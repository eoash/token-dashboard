import type { ClaudeCodeAnalyticsResponse, ClaudeCodeDataPoint } from "./types";

const PROM_URL = (process.env.PROMETHEUS_URL || "http://localhost:9090").replace(/\\n$/, "").trim();

// --- Prometheus HTTP API types ---

interface PromQueryResponse {
  status: "success" | "error";
  data: {
    resultType: "matrix";
    result: PromSeries[];
  };
}

interface PromSeries {
  metric: Record<string, string>;
  values: [number, string][]; // [unix_timestamp, value_string]
}

/**
 * 시간당 delta 상한 (토큰 수 기준).
 * otel_push.py 구버전이 resume 시 전체 transcript를 DELTA로 재전송하면
 * 시간당 5~10M+ 팽창이 발생함. 정상 집중 사용 최대 ~200K/hour.
 * 500K으로 cap → 정상 사용 2.5배, 스파이크 대부분 차단.
 */
export const MAX_HOURLY_DELTA = 500_000;

// --- PromQL queries ---
// Raw counter queries (no increase()) — delta computed in JS to handle collector restarts
// OTel Collector 재시작 시 누적 카운터가 리셋되며, increase([1d])는 리셋 전 값을
// 다시 더해서 과다 집계함. 원본 카운터를 시간별로 조회 후 JS에서 보정.

const Q_RAW = {
  inputTokens:
    'sum by (user_email, model) (claude_code_tokens_total{token_type="input"})',
  outputTokens:
    'sum by (user_email, model) (claude_code_tokens_total{token_type="output"})',
  cacheReadTokens:
    'sum by (user_email, model) (claude_code_tokens_total{token_type="cache_read"})',
  cacheCreationTokens:
    'sum by (user_email, model) (claude_code_tokens_total{token_type="cache_creation"})',
  sessions:
    "sum by (user_email) (claude_code_session_count_total)",
  lines:
    "sum by (user_email) (claude_code_lines_of_code_count_total)",
  commits:
    "sum by (user_email) (claude_code_commit_count_total)",
  prs: "sum by (user_email) (claude_code_pull_request_count_total)",
  acceptedDecisions:
    'sum by (user_email) (claude_code_code_edit_tool_decision_total{decision="accepted"})',
  totalDecisions:
    "sum by (user_email) (claude_code_code_edit_tool_decision_total)",
};

// --- Query helpers ---

async function queryRangeRaw(
  query: string,
  startISO: string,
  endISO: string
): Promise<PromSeries[]> {
  const url = new URL(`${PROM_URL}/api/v1/query_range`);
  url.searchParams.set("query", query);
  url.searchParams.set("start", startISO);
  url.searchParams.set("end", endISO);
  url.searchParams.set("step", "3600"); // 1 hour — fine-grained for reset detection

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Prometheus ${res.status}: ${await res.text()}`);

  const json: PromQueryResponse = await res.json();
  if (json.status !== "success") throw new Error("Prometheus query error");

  return json.data.result;
}

/**
 * 원본 누적 카운터 → 일별 증가량 변환 (카운터 리셋 보정)
 *
 * OTel Collector 재시작 시 카운터가 0으로 리셋됨.
 * Prometheus increase()는 리셋 전 값을 다시 더해서 과다 집계하므로,
 * 직접 양의 delta만 합산하고, 리셋 시 skip → 다음 양의 delta부터 재개.
 *
 * 첫 데이터포인트는 항상 baseline으로 취급 (값 제외).
 * 신규 유저의 첫 시간 소량 누락은 backfill(Admin API)이 커버.
 * (이전 isNewUser 로직은 OTel Collector 리셋 후 전 유저를 "신규"로 오판하여 스파이크 유발)
 *
 * @param actualStartDate 실제 조회 시작일 (YYYY-MM-DD). 이 날짜 이전은 baseline 패딩.
 */
export function computeDailyIncrease(
  rawSeries: PromSeries[],
  actualStartDate: string
): PromSeries[] {
  const result: PromSeries[] = [];

  for (const s of rawSeries) {
    const dailyIncrease = new Map<string, number>();

    for (let i = 0; i < s.values.length; i++) {
      const curVal = parseFloat(s.values[i][1]);
      const curDate = tsToDate(s.values[i][0]);

      if (i === 0) {
        // 첫 데이터포인트: 항상 baseline (값 제외)
        continue;
      }

      const prevVal = parseFloat(s.values[i - 1][1]);
      const delta = curVal - prevVal;

      if (delta < 0) {
        // 카운터 리셋 감지 → skip, curVal이 새 baseline이 됨
        // 다음 양의 delta부터 정상 집계 재개
      } else if (delta > 0) {
        // 정상 증가 (otel_push 이중 전송 방어: 시간당 상한 적용)
        const capped = Math.min(delta, MAX_HOURLY_DELTA);
        dailyIncrease.set(curDate, (dailyIncrease.get(curDate) ?? 0) + capped);
      }
    }

    // 패딩 기간 날짜 제외, 일별 값으로 PromSeries 재구성
    const values: [number, string][] = [];
    for (const [date, increase] of dailyIncrease) {
      if (date >= actualStartDate) {
        const ts = new Date(`${date}T12:00:00Z`).getTime() / 1000;
        values.push([ts, String(Math.round(increase))]);
      }
    }
    values.sort((a, b) => a[0] - b[0]);

    if (values.length > 0) {
      result.push({ metric: s.metric, values });
    }
  }

  return result;
}

/** Raw counter query + daily increase computation (reset-safe) */
async function queryDailyIncrease(
  query: string,
  startISO: string,
  endISO: string,
  actualStartDate: string
): Promise<PromSeries[]> {
  const rawSeries = await queryRangeRaw(query, startISO, endISO);
  return computeDailyIncrease(rawSeries, actualStartDate);
}

/** Unix timestamp → YYYY-MM-DD (KST 기준)
 * backfill JSON도 KST 로컬 날짜를 사용하므로 timezone 일관성 유지.
 * UTC 사용 시 KST 자정~09시 활동이 전날로 분류되어 grace period에 걸림.
 */
export function tsToDate(ts: number): string {
  const KST_OFFSET = 9 * 3600; // UTC+9
  return new Date((ts + KST_OFFSET) * 1000).toISOString().slice(0, 10);
}

function parseVal(v: string): number {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : Math.round(n);
}

/** 이메일 정규화: 이중 도메인(a@b@c) 방지 + lowercase */
function sanitizeEmail(email: string): string {
  const parts = email.toLowerCase().split("@");
  if (parts.length >= 2) return `${parts[0]}@${parts[1]}`;
  return email.toLowerCase();
}

function emptyDataPoint(
  email: string,
  model: string,
  date: string
): ClaudeCodeDataPoint {
  const clean = sanitizeEmail(email);
  return {
    actor: { type: "user", id: clean, email_address: clean },
    model,
    date,
    session_count: 0,
    lines_of_code: 0,
    commits: 0,
    pull_requests: 0,
    tool_acceptance_rate: 0,
    input_tokens: 0,
    output_tokens: 0,
    cache_read_tokens: 0,
    cache_creation_tokens: 0,
  };
}

// --- Main fetch function ---

export async function fetchFromPrometheus(params: {
  start_date: string;
  end_date: string;
}): Promise<ClaudeCodeAnalyticsResponse> {
  // Rolling window: start=NOW-Ndays, end=NOW
  // 마지막 step이 NOW에 정렬되어 오늘 자정 이후 데이터도 마지막 버킷에 포함됨
  const now = new Date();
  const endDay = new Date(`${params.end_date}T23:59:59Z`);
  const end = (endDay > now ? now : endDay).toISOString();
  const startDay = new Date(`${params.start_date}T00:00:00Z`);
  // start를 end 기준 역산: step 정렬을 NOW에 맞춤
  // 단일 날짜 조회(daysDiff=0)시 최소 1일 보장 → 0폭 윈도우 방지
  const daysDiff = Math.max(1, Math.round((endDay.getTime() - startDay.getTime()) / 86400000));
  const rollingStart = new Date(now.getTime() - daysDiff * 86400 * 1000);
  // 1일 전부터 조회: 첫 데이터포인트의 baseline 확보 (delta 계산용)
  const paddedStart = new Date(rollingStart.getTime() - 86400 * 1000);
  const start = paddedStart.toISOString();
  // actualStartDate: 패딩 제외한 실제 시작일 (신규 유저 첫 데이터포인트 판별용)
  // tsToDate()와 동일하게 KST 기준 — UTC 사용 시 padding 데이터가 신규 유저로 오인되어 스파이크 발생
  const actualStartDate = tsToDate(Math.floor(rollingStart.getTime() / 1000));

  // Execute all queries in parallel — raw counters + JS-side delta (reset-safe)
  const [
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheCreationTokens,
    sessions,
    lines,
    commits,
    prs,
    acceptedDecisions,
    totalDecisions,
  ] = await Promise.all([
    queryDailyIncrease(Q_RAW.inputTokens, start, end, actualStartDate),
    queryDailyIncrease(Q_RAW.outputTokens, start, end, actualStartDate),
    queryDailyIncrease(Q_RAW.cacheReadTokens, start, end, actualStartDate),
    queryDailyIncrease(Q_RAW.cacheCreationTokens, start, end, actualStartDate),
    queryDailyIncrease(Q_RAW.sessions, start, end, actualStartDate),
    queryDailyIncrease(Q_RAW.lines, start, end, actualStartDate),
    queryDailyIncrease(Q_RAW.commits, start, end, actualStartDate),
    queryDailyIncrease(Q_RAW.prs, start, end, actualStartDate),
    queryDailyIncrease(Q_RAW.acceptedDecisions, start, end, actualStartDate),
    queryDailyIncrease(Q_RAW.totalDecisions, start, end, actualStartDate),
  ]);

  // --- Phase 1: Per-model metrics (email × model × date) ---
  const dataMap = new Map<string, ClaudeCodeDataPoint>();

  function mergeModelMetric(
    seriesList: PromSeries[],
    field: "input_tokens" | "output_tokens" | "cache_read_tokens" | "cache_creation_tokens"
  ) {
    for (const s of seriesList) {
      const email = s.metric.user_email || "unknown";
      const model = s.metric.model || "unknown";
      for (const [ts, val] of s.values) {
        const date = tsToDate(ts);
        const key = `${email}|${model}|${date}`;
        if (!dataMap.has(key)) dataMap.set(key, emptyDataPoint(email, model, date));
        dataMap.get(key)![field] = parseVal(val);
      }
    }
  }

  mergeModelMetric(inputTokens, "input_tokens");
  mergeModelMetric(outputTokens, "output_tokens");
  mergeModelMetric(cacheReadTokens, "cache_read_tokens");
  mergeModelMetric(cacheCreationTokens, "cache_creation_tokens");

  // --- Phase 2: Per-user metrics (email × date) → assign to first model entry ---
  // Build index: email|date → first key in dataMap
  const firstModelIndex = new Map<string, string>();
  for (const key of dataMap.keys()) {
    const [email, , date] = key.split("|");
    const userDateKey = `${email}|${date}`;
    if (!firstModelIndex.has(userDateKey)) {
      firstModelIndex.set(userDateKey, key);
    }
  }

  function mergeUserMetric(
    seriesList: PromSeries[],
    field: "session_count" | "lines_of_code" | "commits" | "pull_requests"
  ) {
    for (const s of seriesList) {
      const email = s.metric.user_email || "unknown";
      for (const [ts, val] of s.values) {
        const date = tsToDate(ts);
        const targetKey = firstModelIndex.get(`${email}|${date}`);
        if (targetKey) {
          dataMap.get(targetKey)![field] = parseVal(val);
        }
      }
    }
  }

  mergeUserMetric(sessions, "session_count");
  mergeUserMetric(lines, "lines_of_code");
  mergeUserMetric(commits, "commits");
  mergeUserMetric(prs, "pull_requests");

  // --- Phase 3: Acceptance rate ---
  const accMap = new Map<string, number>();
  const totMap = new Map<string, number>();

  for (const s of acceptedDecisions) {
    const email = s.metric.user_email || "unknown";
    for (const [ts, val] of s.values) {
      const key = `${email}|${tsToDate(ts)}`;
      accMap.set(key, (accMap.get(key) ?? 0) + parseFloat(val));
    }
  }
  for (const s of totalDecisions) {
    const email = s.metric.user_email || "unknown";
    for (const [ts, val] of s.values) {
      const key = `${email}|${tsToDate(ts)}`;
      totMap.set(key, (totMap.get(key) ?? 0) + parseFloat(val));
    }
  }

  for (const dp of dataMap.values()) {
    const key = `${dp.actor.email_address}|${dp.date}`;
    const acc = accMap.get(key) ?? 0;
    const tot = totMap.get(key) ?? 0;
    dp.tool_acceptance_rate = tot > 0 ? acc / tot : 0;
  }

  return { data: Array.from(dataMap.values()) };
}

/** Check if Prometheus is reachable */
export async function isPrometheusAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${PROM_URL}/api/v1/status/config`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

import type { ClaudeCodeAnalyticsResponse, ClaudeCodeDataPoint } from "./types";

const PROM_URL = process.env.PROMETHEUS_URL || "http://localhost:9090";

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

// --- PromQL queries ---
// Claude Code OTel metrics (dots→underscores, counter→_total suffix)

const Q = {
  inputTokens:
    'sum by (user_email, model) (increase(claude_code_token_usage_total{token_type="input"}[1d]))',
  outputTokens:
    'sum by (user_email, model) (increase(claude_code_token_usage_total{token_type="output"}[1d]))',
  cacheReadTokens:
    'sum by (user_email, model) (increase(claude_code_token_usage_total{token_type="cache_read"}[1d]))',
  cacheCreationTokens:
    'sum by (user_email, model) (increase(claude_code_token_usage_total{token_type="cache_creation"}[1d]))',
  cost: "sum by (user_email, model) (increase(claude_code_cost_usage_total[1d]))",
  sessions:
    "sum by (user_email) (increase(claude_code_session_count_total[1d]))",
  lines:
    "sum by (user_email) (increase(claude_code_lines_of_code_count_total[1d]))",
  commits:
    "sum by (user_email) (increase(claude_code_commit_count_total[1d]))",
  prs: "sum by (user_email) (increase(claude_code_pull_request_count_total[1d]))",
  acceptedDecisions:
    'sum by (user_email) (increase(claude_code_code_edit_tool_decision_total{decision="accepted"}[1d]))',
  totalDecisions:
    "sum by (user_email) (increase(claude_code_code_edit_tool_decision_total[1d]))",
};

// --- Query helpers ---

async function queryRange(
  query: string,
  startISO: string,
  endISO: string
): Promise<PromSeries[]> {
  const url = new URL(`${PROM_URL}/api/v1/query_range`);
  url.searchParams.set("query", query);
  url.searchParams.set("start", startISO);
  url.searchParams.set("end", endISO);
  url.searchParams.set("step", "86400"); // 1 day in seconds

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Prometheus ${res.status}: ${await res.text()}`);

  const json: PromQueryResponse = await res.json();
  if (json.status !== "success") throw new Error("Prometheus query error");

  return json.data.result;
}

function tsToDate(ts: number): string {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

function parseVal(v: string): number {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : Math.round(n);
}

function emptyDataPoint(
  email: string,
  model: string,
  date: string
): ClaudeCodeDataPoint {
  return {
    actor: { type: "user", id: email, email_address: email },
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
    estimated_cost_usd_cents: 0,
  };
}

// --- Main fetch function ---

export async function fetchFromPrometheus(params: {
  start_date: string;
  end_date: string;
}): Promise<ClaudeCodeAnalyticsResponse> {
  const start = `${params.start_date}T00:00:00Z`;
  const end = `${params.end_date}T23:59:59Z`;

  // Execute all queries in parallel
  const [
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheCreationTokens,
    cost,
    sessions,
    lines,
    commits,
    prs,
    acceptedDecisions,
    totalDecisions,
  ] = await Promise.all([
    queryRange(Q.inputTokens, start, end),
    queryRange(Q.outputTokens, start, end),
    queryRange(Q.cacheReadTokens, start, end),
    queryRange(Q.cacheCreationTokens, start, end),
    queryRange(Q.cost, start, end),
    queryRange(Q.sessions, start, end),
    queryRange(Q.lines, start, end),
    queryRange(Q.commits, start, end),
    queryRange(Q.prs, start, end),
    queryRange(Q.acceptedDecisions, start, end),
    queryRange(Q.totalDecisions, start, end),
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

  // Cost (USD → cents)
  for (const s of cost) {
    const email = s.metric.user_email || "unknown";
    const model = s.metric.model || "unknown";
    for (const [ts, val] of s.values) {
      const date = tsToDate(ts);
      const key = `${email}|${model}|${date}`;
      if (!dataMap.has(key)) dataMap.set(key, emptyDataPoint(email, model, date));
      dataMap.get(key)!.estimated_cost_usd_cents = Math.round(parseFloat(val) * 100);
    }
  }

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
    const key = `${dp.actor?.email_address}|${dp.date}`;
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

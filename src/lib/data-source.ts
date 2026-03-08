import type { ClaudeCodeAnalyticsResponse, ClaudeCodeDataPoint } from "./types";
import { fetchFromPrometheus } from "./prometheus";
import { getMockAnalytics } from "./mock-data";
import fs from "fs";
import path from "path";

export type DataSource = "prometheus" | "mock";

export function getDataSource(): DataSource {
  if (process.env.PROMETHEUS_URL) return "prometheus";
  return "mock";
}

/** 이메일 정규화: 이중 도메인(a@b@c) 방지 + lowercase */
function sanitizeEmail(email: string): string {
  const parts = email.toLowerCase().split("@");
  if (parts.length >= 2) return `${parts[0]}@${parts[1]}`;
  return email.toLowerCase();
}

/** backfill/ 디렉토리의 모든 JSON을 읽어서 병합 + sanitize */
function loadAllBackfill(): ClaudeCodeDataPoint[] {
  const dir = path.join(process.cwd(), "src/lib/backfill");
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const all: ClaudeCodeDataPoint[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.data)) {
        for (const d of parsed.data) {
          // sanitize emails
          if (d.actor?.email_address) {
            d.actor.email_address = sanitizeEmail(d.actor.email_address);
          }
          if (d.actor?.id) {
            d.actor.id = sanitizeEmail(d.actor.id);
          }
          all.push(d);
        }
      }
    } catch (e) {
      console.warn(`backfill: failed to parse ${file}:`, e);
    }
  }

  return all;
}

const backfillData = loadAllBackfill();

/** ISO date 문자열에 N일 추가 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Codex 모델 여부 (gpt-* 계열은 /api/codex-usage에서 별도 서빙) */
function isCodexModel(model: string): boolean {
  return model.startsWith("gpt-");
}

/** 유저별 backfill 마지막 날짜 계산 (Claude 모델만, Codex 제외) */
function buildPerUserCutoff(): Map<string, string> {
  const cutoffs = new Map<string, string>();
  for (const d of backfillData) {
    if (isCodexModel(d.model)) continue;
    const email = d.actor?.email_address ?? d.actor?.id ?? "";
    const existing = cutoffs.get(email) ?? "";
    if (d.date > existing) cutoffs.set(email, d.date);
  }
  return cutoffs;
}

const perUserCutoff = buildPerUserCutoff();

/** 글로벌 backfill end (가장 최근 날짜) — 호환용 */
const BACKFILL_END = (() => {
  const dates = backfillData.map((d) => d.date);
  return dates.length > 0 ? dates.sort().pop()! : "";
})();

export function getBackfillEnd(): string {
  return BACKFILL_END;
}

/** <synthetic> 태그 제거 전처리 (이메일 + 모델) */
function filterSynthetic(data: ClaudeCodeDataPoint[]): ClaudeCodeDataPoint[] {
  return data.filter((d) => {
    const email = d.actor?.email_address ?? d.actor?.id ?? "";
    return !email.includes("<synthetic>") && d.model !== "<synthetic>";
  });
}

export async function fetchAnalytics(params: {
  start_date: string;
  end_date: string;
  group_by?: ("actor" | "model" | "date")[];
}): Promise<ClaudeCodeAnalyticsResponse> {
  const source = getDataSource();

  if (source === "mock") {
    return getMockAnalytics();
  }

  // Prometheus + backfill JSON 병합 (유저별 cutoff)
  const promData = await fetchFromPrometheus(params);

  // Prometheus 데이터: 해당 유저의 cutoff + 1일부터 사용
  // (cutoff 당일은 backfill과 중복 + increase([1d]) 외삽이 부정확할 수 있음)
  const promPoints = promData.data.filter((d) => {
    const email = d.actor?.email_address ?? d.actor?.id ?? "";
    const cutoff = perUserCutoff.get(email) ?? "";
    if (!cutoff) return true;
    const graceCutoff = addDays(cutoff, 1);
    return d.date >= graceCutoff;
  });

  // Backfill 데이터: 날짜 범위 내 + 해당 유저의 cutoff 이전
  const backfillPoints = backfillData.filter((d) => {
    const email = d.actor?.email_address ?? d.actor?.id ?? "";
    const cutoff = perUserCutoff.get(email) ?? "";
    return (
      d.date >= params.start_date &&
      d.date <= params.end_date &&
      d.date <= cutoff
    );
  });

  const merged = filterSynthetic([...backfillPoints, ...promPoints]);

  return { data: merged };
}

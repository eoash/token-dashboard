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

/** backfill/ 디렉토리의 모든 JSON을 읽어서 병합 */
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
        all.push(...parsed.data);
      }
    } catch {
      // skip invalid files
    }
  }

  return all;
}

const backfillData = loadAllBackfill();

/** backfill의 마지막 날짜 — 이 날짜 이전은 JSON에서, 이후는 Prometheus에서 */
const BACKFILL_END = (() => {
  const dates = backfillData.map((d) => d.date);
  return dates.length > 0 ? dates.sort().pop()! : "";
})();

export async function fetchAnalytics(params: {
  start_date: string;
  end_date: string;
  group_by?: ("actor" | "model" | "date")[];
}): Promise<ClaudeCodeAnalyticsResponse> {
  const source = getDataSource();

  if (source === "mock") {
    return getMockAnalytics();
  }

  // Prometheus + backfill JSON 병합
  const promData = await fetchFromPrometheus(params);

  // Prometheus에 이미 있는 날짜+actor 조합
  const promKeys = new Set(
    promData.data.map((d) => `${d.date}:${d.actor.id}`)
  );

  // backfill에서 요청 범위 내 + Prometheus에 없는 날짜+actor만 추가
  const backfillPoints = backfillData.filter(
    (d) =>
      d.date >= params.start_date &&
      d.date <= params.end_date &&
      d.date <= BACKFILL_END &&
      !promKeys.has(`${d.date}:${d.actor.id}`)
  );

  return { data: [...backfillPoints, ...promData.data] };
}

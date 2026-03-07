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
  // BACKFILL_END 이전 → backfill JSON만 사용
  // BACKFILL_END 이후 → Prometheus만 사용
  // (OTel deltatocumulative가 과거 데이터를 오늘에 합산하므로 구간을 분리)
  const promData = await fetchFromPrometheus(params);

  const promPoints = BACKFILL_END
    ? promData.data.filter((d) => d.date > BACKFILL_END)
    : promData.data;

  const backfillPoints = backfillData.filter(
    (d) =>
      d.date >= params.start_date &&
      d.date <= params.end_date &&
      d.date <= BACKFILL_END
  );

  return { data: [...backfillPoints, ...promPoints] };
}

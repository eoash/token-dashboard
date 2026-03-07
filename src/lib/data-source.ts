import type { ClaudeCodeAnalyticsResponse, ClaudeCodeDataPoint } from "./types";
import { fetchFromPrometheus } from "./prometheus";
import { getMockAnalytics } from "./mock-data";
import backfillJson from "./backfill-data.json";

export type DataSource = "prometheus" | "mock";

export function getDataSource(): DataSource {
  if (process.env.PROMETHEUS_URL) return "prometheus";
  return "mock";
}

/** backfill JSON의 마지막 날짜 — 이 날짜 이전은 JSON에서, 이후는 Prometheus에서 */
const BACKFILL_END = (() => {
  const dates = (backfillJson.data as ClaudeCodeDataPoint[]).map((d) => d.date);
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

  // Prometheus에 이미 있는 날짜들
  const promDates = new Set(promData.data.map((d) => d.date));

  // backfill에서 요청 범위 내 + Prometheus에 없는 날짜만 추가
  const backfillPoints = (backfillJson.data as ClaudeCodeDataPoint[]).filter(
    (d) =>
      d.date >= params.start_date &&
      d.date <= params.end_date &&
      d.date <= BACKFILL_END &&
      !promDates.has(d.date)
  );

  return { data: [...backfillPoints, ...promData.data] };
}

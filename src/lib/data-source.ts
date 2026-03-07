import type { ClaudeCodeAnalyticsResponse } from "./types";
import { fetchFromPrometheus } from "./prometheus";
import { getMockAnalytics } from "./mock-data";

export type DataSource = "prometheus" | "mock";

export function getDataSource(): DataSource {
  if (process.env.PROMETHEUS_URL) return "prometheus";
  return "mock";
}

export async function fetchAnalytics(params: {
  start_date: string;
  end_date: string;
  group_by?: ("actor" | "model" | "date")[];
}): Promise<ClaudeCodeAnalyticsResponse> {
  const source = getDataSource();

  switch (source) {
    case "prometheus":
      return fetchFromPrometheus(params);

    case "mock":
      return getMockAnalytics();
  }
}

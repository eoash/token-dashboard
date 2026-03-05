import type { ClaudeCodeAnalyticsResponse } from "./types";
import { fetchClaudeCodeAnalytics } from "./anthropic-admin";
import { fetchFromPrometheus } from "./prometheus";
import { getMockAnalytics } from "./mock-data";

export type DataSource = "prometheus" | "admin-api" | "mock";

export function getDataSource(): DataSource {
  const explicit = process.env.DATA_SOURCE as DataSource | undefined;
  if (explicit && ["prometheus", "admin-api", "mock"].includes(explicit)) {
    return explicit;
  }
  if (process.env.PROMETHEUS_URL) return "prometheus";
  if (process.env.ANTHROPIC_ADMIN_API_KEY) return "admin-api";
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

    case "admin-api":
      return fetchClaudeCodeAnalytics({
        start_date: params.start_date,
        end_date: params.end_date,
        group_by: params.group_by ?? ["actor", "model", "date"],
      });

    case "mock":
      return getMockAnalytics();
  }
}

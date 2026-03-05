import { ANTHROPIC_ADMIN_BASE } from "./constants";
import type {
  ClaudeCodeAnalyticsParams,
  ClaudeCodeAnalyticsResponse,
  UsageReportParams,
  UsageReportResponse,
  CostReportParams,
  CostReportResponse,
} from "./types";
import { getMockAnalytics, getMockUsageReport, getMockCostReport } from "./mock-data";

function isMockMode(): boolean {
  return !process.env.ANTHROPIC_ADMIN_API_KEY;
}

function getApiKey(): string {
  const key = process.env.ANTHROPIC_ADMIN_API_KEY;
  if (!key) throw new Error("ANTHROPIC_ADMIN_API_KEY is not set");
  return key;
}

async function adminFetch<T>(path: string, params: Record<string, unknown>): Promise<T> {
  const url = new URL(`${ANTHROPIC_ADMIN_BASE}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        url.searchParams.append(`${key}[]`, String(v));
      }
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      "x-api-key": getApiKey(),
      "anthropic-version": "2023-06-01",
    },
    next: { revalidate: 3600 }, // 1시간 캐시
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic Admin API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

/** Claude Code Analytics — 이메일 기반 사용자 식별 */
export async function fetchClaudeCodeAnalytics(
  params: ClaudeCodeAnalyticsParams
): Promise<ClaudeCodeAnalyticsResponse> {
  if (isMockMode()) return getMockAnalytics();
  // 실제 API는 starting_at 파라미터 사용 (start_date/end_date 미지원)
  const apiParams: Record<string, unknown> = {
    starting_at: params.start_date,
  };
  return adminFetch<ClaudeCodeAnalyticsResponse>(
    "/usage_report/claude_code",
    apiParams
  );
}

/** Usage Report — 모델/API키/워크스페이스별 토큰 */
export async function fetchUsageReport(
  params: UsageReportParams
): Promise<UsageReportResponse> {
  if (isMockMode()) return getMockUsageReport();
  const { start_date, end_date, ...rest } = params;
  return adminFetch<UsageReportResponse>("/usage_report/messages", {
    starting_at: start_date,
    ending_at: end_date,
    ...rest,
  });
}

/** Cost Report — USD 비용 */
export async function fetchCostReport(
  params: CostReportParams
): Promise<CostReportResponse> {
  if (isMockMode()) return getMockCostReport();
  const { start_date, end_date, ...rest } = params;
  return adminFetch<CostReportResponse>("/cost_report", {
    starting_at: start_date,
    ending_at: end_date,
    ...rest,
  });
}

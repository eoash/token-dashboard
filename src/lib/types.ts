// ============================================================
// Anthropic Admin API Response Types
// ============================================================

// --- Claude Code Analytics API ---
// GET /v1/organizations/usage_report/claude_code

export interface ClaudeCodeAnalyticsParams {
  start_date: string; // YYYY-MM-DD
  end_date: string;
  group_by?: ("actor" | "model" | "date")[];
  actor_type?: "api_key" | "user";
}

export interface ClaudeCodeActor {
  type: "api_key" | "user";
  id: string;
  email_address?: string;
  name?: string;
}

export interface ClaudeCodeDataPoint {
  actor?: ClaudeCodeActor;
  model?: string;
  date?: string;
  session_count: number;
  lines_of_code: number;
  commits: number;
  pull_requests: number;
  tool_acceptance_rate: number;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
  estimated_cost_usd_cents: number;
}

export interface ClaudeCodeAnalyticsResponse {
  data: ClaudeCodeDataPoint[];
}

// --- Usage Report API ---
// GET /v1/organizations/usage_report/messages

export interface UsageReportParams {
  start_date: string;
  end_date: string;
  group_by?: ("model" | "api_key_id" | "workspace_id")[];
  bucket_width?: "1d" | "1h" | "1m";
}

export interface UsageReportDataPoint {
  model?: string;
  api_key_id?: string;
  workspace_id?: string;
  bucket_start?: string;
  input_tokens: number;
  output_tokens: number;
  input_cached_tokens_uncached: number;
  input_cached_tokens_cache_read: number;
  input_cached_tokens_cache_creation: number;
}

export interface UsageReportResponse {
  data: UsageReportDataPoint[];
}

// --- Cost Report API ---
// GET /v1/organizations/cost_report

export interface CostReportParams {
  start_date: string;
  end_date: string;
  group_by?: ("workspace_id" | "model")[];
  bucket_width?: "1d" | "1h" | "1m";
}

export interface CostReportDataPoint {
  workspace_id?: string;
  model?: string;
  bucket_start?: string;
  cost_usd: number;
}

export interface CostReportResponse {
  data: CostReportDataPoint[];
}

// --- Aggregated / UI Types ---

export interface TeamMember {
  email: string;
  name: string;
  avatar?: string;
}

export interface DailyUsage {
  date: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  session_count: number;
}

export interface MemberSummary {
  name: string;
  email: string;
  total_tokens: number;
  total_cost_usd: number;
  session_count: number;
  lines_of_code: number;
  commits: number;
  pull_requests: number;
  tool_acceptance_rate: number;
  daily: DailyUsage[];
  models: { name: string; tokens: number; cost: number }[];
}

export interface ModelSummary {
  name: string;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  total_cost_usd: number;
  daily: { date: string; tokens: number; cost: number }[];
}

export interface OverviewData {
  total_tokens: number;
  total_cost_usd: number;
  active_users: number;
  avg_daily_sessions: number;
  daily: DailyUsage[];
  members: { name: string; tokens: number; cost: number }[];
  models: { name: string; value: number; color: string }[];
}

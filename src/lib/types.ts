// ============================================================
// Claude Code Analytics Types (OTel / Prometheus)
// ============================================================

export interface ClaudeCodeActor {
  type: "api_key" | "user";
  id: string;
  email_address?: string;
  name?: string;
}

export interface ClaudeCodeDataPoint {
  actor: ClaudeCodeActor;
  model: string;
  date: string;
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

// ============================================================
// UI Types
// ============================================================

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

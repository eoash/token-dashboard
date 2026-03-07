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
}

export interface ClaudeCodeAnalyticsResponse {
  data: ClaudeCodeDataPoint[];
}

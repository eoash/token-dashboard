import { EMAIL_TO_NAME, getModelLabel, getModelColor } from "@/lib/constants";
import type { ClaudeCodeDataPoint } from "@/lib/types";

export interface MemberData {
  totalTokens: number;
  totalCost: number;
  sessions: number;
  linesOfCode: number;
  commits: number;
  pullRequests: number;
  toolAcceptanceRate: number;
  daily: { date: string; input_tokens: number; output_tokens: number; cache_read_tokens: number }[];
  models: { name: string; value: number; color: string }[];
}

export function aggregateMember(data: ClaudeCodeDataPoint[], email: string): MemberData {
  const filtered = data.filter((d) => d.actor.email_address === email);

  let totalTokens = 0;
  let totalCost = 0;
  let sessions = 0;
  let linesOfCode = 0;
  let commits = 0;
  let pullRequests = 0;
  let toolAccSum = 0;
  let toolAccCount = 0;

  const dailyMap = new Map<string, { input: number; output: number; cache: number }>();
  const modelMap = new Map<string, number>();

  for (const d of filtered) {
    const tokens = d.input_tokens + d.output_tokens + d.cache_read_tokens;
    totalTokens += tokens;
    totalCost += d.estimated_cost_usd_cents;
    sessions += d.session_count;
    linesOfCode += d.lines_of_code;
    commits += d.commits;
    pullRequests += d.pull_requests;
    if (d.tool_acceptance_rate > 0) {
      toolAccSum += d.tool_acceptance_rate;
      toolAccCount++;
    }

    const existing = dailyMap.get(d.date) ?? { input: 0, output: 0, cache: 0 };
    existing.input += d.input_tokens;
    existing.output += d.output_tokens;
    existing.cache += d.cache_read_tokens;
    dailyMap.set(d.date, existing);

    modelMap.set(d.model, (modelMap.get(d.model) ?? 0) + tokens);
  }

  return {
    totalTokens,
    totalCost: totalCost / 100,
    sessions,
    linesOfCode,
    commits,
    pullRequests,
    toolAcceptanceRate: toolAccCount > 0 ? toolAccSum / toolAccCount : 0,
    daily: Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        input_tokens: v.input,
        output_tokens: v.output,
        cache_read_tokens: v.cache,
      })),
    models: Array.from(modelMap.entries())
      .map(([model, value]) => ({
        name: getModelLabel(model),
        value,
        color: getModelColor(model),
      }))
      .sort((a, b) => b.value - a.value),
  };
}

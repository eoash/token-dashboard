import { resolveActorName, getModelLabel, getModelColor } from "@/lib/constants";
import type { ClaudeCodeDataPoint } from "@/lib/types";

export interface OverviewAggregation {
  totalTokens: number;
  totalCostUsd: number;
  activeUsers: number;
  avgDailySessions: number;
  totalLines: number;
  totalCommits: number;
  totalPRs: number;
  avgAcceptanceRate: number;
  daily: { date: string; input_tokens: number; output_tokens: number; cache_read_tokens: number }[];
  members: { name: string; tokens: number; cost: number; lines: number; commits: number; prs: number; acceptanceRate: number }[];
  models: { name: string; value: number; color: string }[];
}

export function aggregateOverview(data: ClaudeCodeDataPoint[]): OverviewAggregation {
  let totalTokens = 0;
  let totalCostCents = 0;
  let totalSessions = 0;
  let totalLines = 0;
  let totalCommits = 0;
  let totalPRs = 0;
  let acceptanceRateSum = 0;
  let acceptanceRateCount = 0;
  const userSet = new Set<string>();
  const dailyMap = new Map<string, { input: number; output: number; cache: number; cost: number; sessions: number }>();
  const memberMap = new Map<string, { tokens: number; cost: number; lines: number; commits: number; prs: number; acceptanceSum: number; acceptanceCount: number }>();
  const modelMap = new Map<string, number>();

  for (const d of data) {
    const tokens = d.input_tokens + d.output_tokens + d.cache_read_tokens;
    totalTokens += tokens;
    totalCostCents += d.estimated_cost_usd_cents;
    totalSessions += d.session_count;
    totalLines += d.lines_of_code;
    totalCommits += d.commits;
    totalPRs += d.pull_requests;
    if (d.tool_acceptance_rate != null) {
      acceptanceRateSum += d.tool_acceptance_rate * d.session_count;
      acceptanceRateCount += d.session_count;
    }

    userSet.add(resolveActorName(d.actor));

    if (d.date) {
      const existing = dailyMap.get(d.date) ?? { input: 0, output: 0, cache: 0, cost: 0, sessions: 0 };
      existing.input += d.input_tokens;
      existing.output += d.output_tokens;
      existing.cache += d.cache_read_tokens;
      existing.cost += d.estimated_cost_usd_cents;
      existing.sessions += d.session_count;
      dailyMap.set(d.date, existing);
    }

    {
      const name = resolveActorName(d.actor);
      const existing = memberMap.get(name) ?? { tokens: 0, cost: 0, lines: 0, commits: 0, prs: 0, acceptanceSum: 0, acceptanceCount: 0 };
      existing.tokens += tokens;
      existing.cost += d.estimated_cost_usd_cents / 100;
      existing.lines += d.lines_of_code;
      existing.commits += d.commits;
      existing.prs += d.pull_requests;
      if (d.tool_acceptance_rate != null) {
        existing.acceptanceSum += d.tool_acceptance_rate * d.session_count;
        existing.acceptanceCount += d.session_count;
      }
      memberMap.set(name, existing);
    }

    if (d.model) {
      modelMap.set(d.model, (modelMap.get(d.model) ?? 0) + tokens);
    }
  }

  const days = dailyMap.size || 1;
  const avgAcceptanceRate = acceptanceRateCount > 0 ? acceptanceRateSum / acceptanceRateCount : 0;

  return {
    totalTokens,
    totalCostUsd: totalCostCents / 100,
    activeUsers: userSet.size,
    avgDailySessions: Math.round(totalSessions / days),
    totalLines,
    totalCommits,
    totalPRs,
    avgAcceptanceRate,
    daily: Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        input_tokens: v.input,
        output_tokens: v.output,
        cache_read_tokens: v.cache,
      })),
    members: Array.from(memberMap.entries())
      .map(([name, v]) => ({
        name,
        tokens: v.tokens,
        cost: v.cost,
        lines: v.lines,
        commits: v.commits,
        prs: v.prs,
        acceptanceRate: v.acceptanceCount > 0 ? v.acceptanceSum / v.acceptanceCount : 0,
      }))
      .sort((a, b) => b.tokens - a.tokens),
    models: Array.from(modelMap.entries())
      .map(([model, value]) => ({
        name: getModelLabel(model),
        value,
        color: getModelColor(model),
      }))
      .sort((a, b) => b.value - a.value),
  };
}

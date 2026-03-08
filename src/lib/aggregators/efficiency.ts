import { resolveActorName } from "@/lib/constants";
import type { ClaudeCodeDataPoint } from "@/lib/types";
import type { CodexMemberRow } from "@/app/api/codex-usage/route";

export type EfficiencyTool = "claude" | "codex" | "all";

export interface MemberEfficiency {
  name: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  cacheHitRate: number;
  outputRatio: number;
  cacheEfficiency: number; // cache_read / cache_creation — higher = better reuse
}

export interface DailyEfficiency {
  date: string;
  cacheHitRate: number;
  outputRatio: number;
}

export interface EfficiencyAggregation {
  avgCacheHitRate: number;
  avgOutputRatio: number;
  avgCacheEfficiency: number;
  daily: DailyEfficiency[];
  members: MemberEfficiency[];
}

// ── Codex-specific types ──────────────────────────────

export interface CodexMemberEfficiency {
  name: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  cacheHitRate: number;
  outputRatio: number;
  reasoningRatio: number; // reasoning / output
}

export interface CodexEfficiencyAggregation {
  avgCacheHitRate: number;
  avgOutputRatio: number;
  avgReasoningRatio: number;
  daily: DailyEfficiency[];
  members: CodexMemberEfficiency[];
}

// ── Filter helpers ────────────────────────────────────

function isCodexModel(model: string): boolean {
  return model.startsWith("gpt-");
}

export function filterByTool(data: ClaudeCodeDataPoint[], tool: EfficiencyTool): ClaudeCodeDataPoint[] {
  if (tool === "all") return data;
  if (tool === "codex") return data.filter((d) => isCodexModel(d.model));
  return data.filter((d) => !isCodexModel(d.model)); // claude
}

// ── Shared calc helpers ───────────────────────────────

const calcCacheHitRate = (cacheRead: number, cacheCreation: number, input: number) => {
  const denom = cacheRead + cacheCreation + input;
  return denom > 0 ? cacheRead / denom : 0;
};

const calcOutputRatio = (output: number, input: number) => {
  return input > 0 ? output / input : 0;
};

const calcCacheEfficiency = (cacheRead: number, cacheCreation: number) => {
  return cacheCreation > 0 ? cacheRead / cacheCreation : 0;
};

// ── Claude / All aggregation ──────────────────────────

export function aggregateEfficiency(data: ClaudeCodeDataPoint[]): EfficiencyAggregation {
  const memberMap = new Map<string, {
    input: number; output: number; cacheRead: number; cacheCreation: number;
  }>();

  const dailyMap = new Map<string, {
    input: number; output: number; cacheRead: number; cacheCreation: number;
  }>();

  for (const d of data) {
    const name = resolveActorName(d.actor);

    const m = memberMap.get(name) ?? { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
    m.input += d.input_tokens;
    m.output += d.output_tokens;
    m.cacheRead += d.cache_read_tokens;
    m.cacheCreation += d.cache_creation_tokens;
    memberMap.set(name, m);

    if (d.date) {
      const day = dailyMap.get(d.date) ?? { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
      day.input += d.input_tokens;
      day.output += d.output_tokens;
      day.cacheRead += d.cache_read_tokens;
      day.cacheCreation += d.cache_creation_tokens;
      dailyMap.set(d.date, day);
    }
  }

  const members: MemberEfficiency[] = Array.from(memberMap.entries())
    .map(([name, v]) => ({
      name,
      totalTokens: v.input + v.output + v.cacheRead,
      inputTokens: v.input,
      outputTokens: v.output,
      cacheReadTokens: v.cacheRead,
      cacheCreationTokens: v.cacheCreation,
      cacheHitRate: calcCacheHitRate(v.cacheRead, v.cacheCreation, v.input),
      outputRatio: calcOutputRatio(v.output, v.input),
      cacheEfficiency: calcCacheEfficiency(v.cacheRead, v.cacheCreation),
    }))
    .filter((m) => m.totalTokens > 0)
    .sort((a, b) => b.cacheHitRate - a.cacheHitRate);

  const daily: DailyEfficiency[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      cacheHitRate: calcCacheHitRate(v.cacheRead, v.cacheCreation, v.input),
      outputRatio: calcOutputRatio(v.output, v.input),
    }));

  const totals = { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
  for (const v of memberMap.values()) {
    totals.input += v.input;
    totals.output += v.output;
    totals.cacheRead += v.cacheRead;
    totals.cacheCreation += v.cacheCreation;
  }

  return {
    avgCacheHitRate: calcCacheHitRate(totals.cacheRead, totals.cacheCreation, totals.input),
    avgOutputRatio: calcOutputRatio(totals.output, totals.input),
    avgCacheEfficiency: calcCacheEfficiency(totals.cacheRead, totals.cacheCreation),
    daily,
    members,
  };
}

// ── Codex-specific aggregation ────────────────────────

export function aggregateCodexEfficiency(
  codexRows: CodexMemberRow[],
  dailyData: ClaudeCodeDataPoint[],
): CodexEfficiencyAggregation {
  const members: CodexMemberEfficiency[] = codexRows
    .filter((r) => r.total > 0)
    .map((r) => ({
      name: r.name,
      totalTokens: r.total,
      inputTokens: r.input,
      outputTokens: r.output,
      cachedTokens: r.cached,
      reasoningTokens: r.reasoning,
      cacheHitRate: (r.cached + r.input) > 0 ? r.cached / (r.cached + r.input) : 0,
      outputRatio: r.input > 0 ? r.output / r.input : 0,
      reasoningRatio: r.output > 0 ? r.reasoning / r.output : 0,
    }))
    .sort((a, b) => b.cacheHitRate - a.cacheHitRate);

  // Daily trend from analytics data (gpt-* filtered)
  const dailyMap = new Map<string, { input: number; output: number; cacheRead: number }>();
  for (const d of dailyData) {
    if (!d.date) continue;
    const day = dailyMap.get(d.date) ?? { input: 0, output: 0, cacheRead: 0 };
    day.input += d.input_tokens;
    day.output += d.output_tokens;
    day.cacheRead += d.cache_read_tokens;
    dailyMap.set(d.date, day);
  }

  const daily: DailyEfficiency[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      cacheHitRate: (v.cacheRead + v.input) > 0 ? v.cacheRead / (v.cacheRead + v.input) : 0,
      outputRatio: v.input > 0 ? v.output / v.input : 0,
    }));

  // Team averages (weighted)
  const totals = { input: 0, output: 0, cached: 0, reasoning: 0 };
  for (const r of codexRows) {
    totals.input += r.input;
    totals.output += r.output;
    totals.cached += r.cached;
    totals.reasoning += r.reasoning;
  }

  return {
    avgCacheHitRate: (totals.cached + totals.input) > 0 ? totals.cached / (totals.cached + totals.input) : 0,
    avgOutputRatio: totals.input > 0 ? totals.output / totals.input : 0,
    avgReasoningRatio: totals.output > 0 ? totals.reasoning / totals.output : 0,
    daily,
    members,
  };
}

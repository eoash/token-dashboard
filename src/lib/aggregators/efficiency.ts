import { resolveActorName } from "@/lib/constants";
import type { ClaudeCodeDataPoint } from "@/lib/types";

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

export function aggregateEfficiency(data: ClaudeCodeDataPoint[]): EfficiencyAggregation {
  // Per-member accumulation
  const memberMap = new Map<string, {
    input: number; output: number; cacheRead: number; cacheCreation: number;
  }>();

  // Per-day accumulation
  const dailyMap = new Map<string, {
    input: number; output: number; cacheRead: number; cacheCreation: number;
  }>();

  for (const d of data) {
    const name = resolveActorName(d.actor);

    // member
    const m = memberMap.get(name) ?? { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
    m.input += d.input_tokens;
    m.output += d.output_tokens;
    m.cacheRead += d.cache_read_tokens;
    m.cacheCreation += d.cache_creation_tokens;
    memberMap.set(name, m);

    // daily
    if (d.date) {
      const day = dailyMap.get(d.date) ?? { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
      day.input += d.input_tokens;
      day.output += d.output_tokens;
      day.cacheRead += d.cache_read_tokens;
      day.cacheCreation += d.cache_creation_tokens;
      dailyMap.set(d.date, day);
    }
  }

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

  // Team averages
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

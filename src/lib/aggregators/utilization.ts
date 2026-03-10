import { resolveActorName, getModelLabel, getModelColor } from "@/lib/constants";
import type { ClaudeCodeDataPoint } from "@/lib/types";

export interface UtilizationAggregation {
  totalTokens: number;
  cacheHitRate: number;
  outputRatio: number;
  avgDailyTokens: number;
  daily: { date: string; input: number; output: number; cache_read: number }[];
  memberTokens: { name: string; tokens: number; cacheHitRate: number }[];
  modelTokens: { name: string; value: number; color: string }[];
}

export function aggregateUtilization(data: ClaudeCodeDataPoint[]): UtilizationAggregation {
  let totalInput = 0;
  let totalOutput = 0;
  let totalCacheRead = 0;
  let totalCacheCreation = 0;
  const dailyMap = new Map<string, { input: number; output: number; cache_read: number }>();
  const memberMap = new Map<string, { input: number; output: number; cacheRead: number; cacheCreation: number }>();
  const modelMap = new Map<string, number>();

  for (const d of data) {
    totalInput += d.input_tokens;
    totalOutput += d.output_tokens;
    totalCacheRead += d.cache_read_tokens;
    totalCacheCreation += d.cache_creation_tokens;

    if (d.date) {
      const existing = dailyMap.get(d.date) ?? { input: 0, output: 0, cache_read: 0 };
      existing.input += d.input_tokens;
      existing.output += d.output_tokens;
      existing.cache_read += d.cache_read_tokens;
      dailyMap.set(d.date, existing);
    }

    {
      const name = resolveActorName(d.actor);
      const existing = memberMap.get(name) ?? { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
      existing.input += d.input_tokens;
      existing.output += d.output_tokens;
      existing.cacheRead += d.cache_read_tokens;
      existing.cacheCreation += d.cache_creation_tokens;
      memberMap.set(name, existing);
    }

    if (d.model) {
      const tokens = d.input_tokens + d.output_tokens;
      modelMap.set(d.model, (modelMap.get(d.model) ?? 0) + tokens);
    }
  }

  const totalAllInput = totalInput + totalCacheRead + totalCacheCreation;
  const totalTokens = totalInput + totalOutput + totalCacheRead;
  const days = dailyMap.size || 1;

  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const memberTokens = Array.from(memberMap.entries())
    .map(([name, v]) => {
      const allInput = v.input + v.cacheRead + v.cacheCreation;
      return {
        name,
        tokens: v.input + v.output + v.cacheRead,
        cacheHitRate: allInput > 0 ? v.cacheRead / allInput : 0,
      };
    })
    .sort((a, b) => b.tokens - a.tokens);

  const modelTokens = Array.from(modelMap.entries())
    .map(([model, value]) => ({
      name: getModelLabel(model),
      value,
      color: getModelColor(model),
    }))
    .sort((a, b) => b.value - a.value);

  return {
    totalTokens,
    cacheHitRate: totalAllInput > 0 ? totalCacheRead / totalAllInput : 0,
    outputRatio: totalTokens > 0 ? totalOutput / totalTokens : 0,
    avgDailyTokens: Math.round(totalTokens / days),
    daily,
    memberTokens,
    modelTokens,
  };
}

import { getModelLabel, getModelColor } from "@/lib/constants";
import type { ClaudeCodeDataPoint } from "@/lib/types";

export interface ModelDetail {
  name: string;
  label: string;
  color: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  totalCost: number;
  daily: { date: string; cost: number }[];
}

export function aggregateModels(data: ClaudeCodeDataPoint[]): {
  pie: { name: string; value: number; color: string }[];
  details: ModelDetail[];
} {
  const modelMap = new Map<
    string,
    {
      input: number;
      output: number;
      cache: number;
      cost: number;
      daily: Map<string, number>;
    }
  >();

  for (const d of data) {
    const existing = modelMap.get(d.model) ?? {
      input: 0,
      output: 0,
      cache: 0,
      cost: 0,
      daily: new Map(),
    };
    existing.input += d.input_tokens;
    existing.output += d.output_tokens;
    existing.cache += d.cache_read_tokens;
    existing.cost += d.estimated_cost_usd_cents;

    existing.daily.set(d.date, (existing.daily.get(d.date) ?? 0) + d.estimated_cost_usd_cents / 100);
    modelMap.set(d.model, existing);
  }

  const details: ModelDetail[] = Array.from(modelMap.entries())
    .map(([model, v]) => ({
      name: model,
      label: getModelLabel(model),
      color: getModelColor(model),
      totalTokens: v.input + v.output + v.cache,
      inputTokens: v.input,
      outputTokens: v.output,
      cacheTokens: v.cache,
      totalCost: v.cost / 100,
      daily: Array.from(v.daily.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, cost]) => ({ date, cost })),
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens);

  const pie = details.map((d) => ({
    name: d.label,
    value: d.totalTokens,
    color: d.color,
  }));

  return { pie, details };
}

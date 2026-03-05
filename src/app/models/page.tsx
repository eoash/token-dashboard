"use client";

import KpiCard from "@/components/cards/KpiCard";
import ModelPieChart from "@/components/charts/ModelPieChart";
import CostTrendChart from "@/components/charts/CostTrendChart";
import { getModelLabel, getModelColor } from "@/lib/constants";
import { formatTokens, formatDollars } from "@/lib/utils";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import type { ClaudeCodeDataPoint } from "@/lib/types";

interface ModelDetail {
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

function aggregateModels(data: ClaudeCodeDataPoint[]): {
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
    if (!d.model) continue;
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

    if (d.date) {
      existing.daily.set(d.date, (existing.daily.get(d.date) ?? 0) + d.estimated_cost_usd_cents / 100);
    }
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

export default function ModelsPage() {
  const { data: rawData, loading, error } = useAnalytics(30);
  const { pie, details } = aggregateModels(rawData);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Models</h1>
        <span className="text-xs text-gray-500">Last 30 days</span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading...</div>
      ) : (
        <>
          {/* Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <ModelPieChart data={pie} />
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-4 content-start">
              {details.map((m) => (
                <div
                  key={m.name}
                  className="rounded-xl bg-[#111111] border border-[#222] p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    <span className="text-sm font-medium">{m.label}</span>
                  </div>
                  <p className="text-xl font-bold">{formatTokens(m.totalTokens)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Cost: {formatDollars(m.totalCost)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Per-model cost trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {details.map((m) => (
              <CostTrendChart key={m.name} data={m.daily} />
            ))}
          </div>

          {/* Token Breakdown Table */}
          <div className="mt-6 rounded-xl bg-[#111111] p-6">
            <h3 className="text-lg font-semibold mb-4">Token Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-[#222]">
                    <th className="text-left py-2 font-medium">Model</th>
                    <th className="text-right py-2 font-medium">Input</th>
                    <th className="text-right py-2 font-medium">Output</th>
                    <th className="text-right py-2 font-medium">Cache</th>
                    <th className="text-right py-2 font-medium">Total</th>
                    <th className="text-right py-2 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((m) => (
                    <tr key={m.name} className="border-b border-[#1a1a1a]">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: m.color }}
                          />
                          {m.label}
                        </div>
                      </td>
                      <td className="text-right text-gray-400">
                        {formatTokens(m.inputTokens)}
                      </td>
                      <td className="text-right text-gray-400">
                        {formatTokens(m.outputTokens)}
                      </td>
                      <td className="text-right text-gray-400">
                        {formatTokens(m.cacheTokens)}
                      </td>
                      <td className="text-right font-medium">
                        {formatTokens(m.totalTokens)}
                      </td>
                      <td className="text-right text-[#E8FF47]">
                        {formatDollars(m.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

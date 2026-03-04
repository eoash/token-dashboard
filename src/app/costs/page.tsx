"use client";

import { useState, useEffect, useCallback } from "react";
import KpiCard from "@/components/cards/KpiCard";
import CostTrendChart from "@/components/charts/CostTrendChart";
import TeamBarChart from "@/components/charts/TeamBarChart";
import ModelPieChart from "@/components/charts/ModelPieChart";
import { EMAIL_TO_NAME, getModelLabel, getModelColor } from "@/lib/constants";
import { formatDollars, projectMonthlyCost } from "@/lib/utils";
import type { ClaudeCodeDataPoint } from "@/lib/types";

function aggregateCosts(data: ClaudeCodeDataPoint[]) {
  let totalCostCents = 0;
  const dailyMap = new Map<string, number>();
  const memberMap = new Map<string, number>();
  const modelMap = new Map<string, number>();

  for (const d of data) {
    totalCostCents += d.estimated_cost_usd_cents;

    if (d.date) {
      dailyMap.set(d.date, (dailyMap.get(d.date) ?? 0) + d.estimated_cost_usd_cents / 100);
    }

    if (d.actor?.email_address) {
      const name = EMAIL_TO_NAME[d.actor.email_address] ?? d.actor.email_address;
      memberMap.set(name, (memberMap.get(name) ?? 0) + d.estimated_cost_usd_cents / 100);
    }

    if (d.model) {
      modelMap.set(d.model, (modelMap.get(d.model) ?? 0) + d.estimated_cost_usd_cents / 100);
    }
  }

  const dailyCosts = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, cost]) => ({ date, cost }));

  const projected = projectMonthlyCost(dailyCosts);

  // 비용 추이에 projected 추가
  const today = new Date().toISOString().slice(0, 10);
  const dailyWithProjection = dailyCosts.map((d) => ({
    ...d,
    projected: d.date >= today ? projected / 30 : undefined,
  }));

  const memberCosts = Array.from(memberMap.entries())
    .map(([name, cost]) => ({ name, tokens: 0, cost }))
    .sort((a, b) => b.cost - a.cost);

  const modelCosts = Array.from(modelMap.entries())
    .map(([model, cost]) => ({
      name: getModelLabel(model),
      value: cost,
      color: getModelColor(model),
    }))
    .sort((a, b) => b.value - a.value);

  const days = dailyMap.size || 1;
  const avgDaily = totalCostCents / 100 / days;

  return {
    totalCostUsd: totalCostCents / 100,
    avgDailyCost: avgDaily,
    projectedMonthly: projected,
    daily: dailyWithProjection,
    memberCosts,
    modelCosts,
  };
}

export default function CostsPage() {
  const [rawData, setRawData] = useState<ClaudeCodeDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics?days=30");
      if (res.ok) {
        const json = await res.json();
        setRawData(json.data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const costs = aggregateCosts(rawData);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Costs</h1>
        <span className="text-xs text-gray-500">Last 30 days</span>
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <KpiCard
              title="Total Cost"
              value={formatDollars(costs.totalCostUsd)}
              subtitle="last 30 days"
            />
            <KpiCard
              title="Avg Daily"
              value={formatDollars(costs.avgDailyCost)}
              subtitle="per day average"
            />
            <KpiCard
              title="Projected Monthly"
              value={formatDollars(costs.projectedMonthly)}
              subtitle="end of month estimate"
            />
          </div>

          {/* Cost Trend */}
          <div className="mb-6">
            <CostTrendChart data={costs.daily} />
          </div>

          {/* Member + Model breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Member costs as bar chart — reuse TeamBarChart with cost focus */}
            <div className="rounded-xl bg-[#111111] p-6">
              <h3 className="text-lg font-semibold mb-4">Cost by Team Member</h3>
              <div className="space-y-3">
                {costs.memberCosts.map((m) => {
                  const pct = costs.totalCostUsd > 0 ? (m.cost / costs.totalCostUsd) * 100 : 0;
                  return (
                    <div key={m.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{m.name}</span>
                        <span className="text-[#E8FF47]">{formatDollars(m.cost)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#1a1a1a]">
                        <div
                          className="h-full rounded-full bg-[#E8FF47]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Model cost pie */}
            <ModelPieChart data={costs.modelCosts} />
          </div>
        </>
      )}
    </div>
  );
}

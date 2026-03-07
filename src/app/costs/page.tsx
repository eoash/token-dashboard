"use client";

import { useMemo } from "react";
import KpiCard from "@/components/cards/KpiCard";
import CostTrendChart from "@/components/charts/CostTrendChart";
import ModelPieChart from "@/components/charts/ModelPieChart";
import { formatDollars } from "@/lib/utils";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { aggregateCosts } from "@/lib/aggregators/costs";

export default function CostsPage() {
  const { data: rawData, loading, error } = useAnalytics(30);

  // loading 중 불필요한 집계 연산 방지
  const costs = useMemo(
    () => (loading ? null : aggregateCosts(rawData)),
    [rawData, loading]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Costs</h1>
        <span className="text-xs text-gray-500">Last 30 days</span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading || !costs ? (
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

            <ModelPieChart data={costs.modelCosts} />
          </div>
        </>
      )}
    </div>
  );
}

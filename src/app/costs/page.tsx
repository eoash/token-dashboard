"use client";

import { useMemo } from "react";
import KpiCard from "@/components/cards/KpiCard";
import UsageTrendChart from "@/components/charts/UsageTrendChart";
import ModelPieChart from "@/components/charts/ModelPieChart";
import { formatTokens, formatPercent } from "@/lib/utils";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { aggregateUtilization } from "@/lib/aggregators/costs";

export default function UtilizationPage() {
  const { data: rawData, loading, error } = useAnalytics(30);

  const util = useMemo(
    () => (loading ? null : aggregateUtilization(rawData)),
    [rawData, loading]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Utilization</h1>
        <span className="text-xs text-gray-500">Last 30 days</span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading || !util ? (
        <div className="text-gray-400 text-center py-12">Loading...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <KpiCard
              title="Total Tokens"
              value={formatTokens(util.totalTokens)}
              subtitle="input + output + cache"
            />
            <KpiCard
              title="Cache Hit Rate"
              value={formatPercent(util.cacheHitRate)}
              subtitle="cache reuse efficiency"
            />
            <KpiCard
              title="Avg Daily Tokens"
              value={formatTokens(util.avgDailyTokens)}
              subtitle="tokens per day"
            />
          </div>

          {/* Usage Trend */}
          <div className="mb-6">
            <UsageTrendChart data={util.daily} />
          </div>

          {/* Member + Model breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-[#111111] p-6">
              <h3 className="text-lg font-semibold mb-4">Tokens by Team Member</h3>
              <div className="space-y-3">
                {util.memberTokens.map((m) => {
                  const pct = util.totalTokens > 0 ? (m.tokens / util.totalTokens) * 100 : 0;
                  return (
                    <div key={m.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{m.name}</span>
                        <span className="text-gray-400">
                          {formatTokens(m.tokens)}
                          <span className="text-xs text-gray-600 ml-2">
                            cache {formatPercent(m.cacheHitRate)}
                          </span>
                        </span>
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

            <ModelPieChart data={util.modelTokens} />
          </div>
        </>
      )}
    </div>
  );
}

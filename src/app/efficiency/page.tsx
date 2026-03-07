"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import KpiCard from "@/components/cards/KpiCard";
import DateRangePicker from "@/components/layout/DateRangePicker";
import { formatPercent, formatTokens } from "@/lib/utils";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { aggregateEfficiency } from "@/lib/aggregators/efficiency";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export default function EfficiencyPage() {
  const { data: rawData, loading, error } = useAnalytics();

  const eff = useMemo(
    () => (loading ? null : aggregateEfficiency(rawData)),
    [rawData, loading]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Efficiency</h1>
        <DateRangePicker />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading || !eff ? (
        <div className="text-gray-400 text-center py-12">Loading...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <KpiCard
              title="Cache Hit Rate"
              value={formatPercent(eff.avgCacheHitRate)}
              subtitle="team average"
              tooltip="캐시 재활용률. cache_read / (cache_read + cache_creation + input). 높을수록 동일 컨텍스트를 효율적으로 재사용하고 있다는 뜻입니다."
            />
            <KpiCard
              title="Output Ratio"
              value={`${eff.avgOutputRatio.toFixed(1)}x`}
              subtitle="output / input"
              tooltip="입력 토큰 대비 출력 토큰 비율. 높을수록 적은 프롬프트로 많은 결과를 얻고 있다는 뜻입니다."
            />
            <KpiCard
              title="Cache Efficiency"
              value={`${eff.avgCacheEfficiency.toFixed(1)}x`}
              subtitle="cache read / creation"
              tooltip="캐시 생성 대비 재사용 배수. 1x = 만든 만큼만 씀, 10x = 한번 만들어 10번 재활용. 높을수록 컨텍스트 설계가 잘 되어 있다는 뜻입니다."
            />
          </div>

          {/* Daily Cache Hit Rate Trend */}
          <div className="rounded-xl bg-[#111111] p-6 mb-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Daily Cache Hit Rate</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eff.daily} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#666"
                    tick={{ fill: "#999", fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={formatPct}
                    stroke="#666"
                    tick={{ fill: "#999", fontSize: 12 }}
                    domain={[0, 1]}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-lg">
                          <p className="mb-2 text-sm text-neutral-400">{label}</p>
                          <p className="text-sm text-[#E8FF47]">
                            Cache Hit: {formatPct(payload[0].value as number)}
                          </p>
                          {payload[1] && (
                            <p className="text-sm text-[#3B82F6]">
                              Output Ratio: {(payload[1].value as number).toFixed(1)}x
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cacheHitRate"
                    stroke="#E8FF47"
                    strokeWidth={2}
                    dot={{ fill: "#E8FF47", r: 3 }}
                    name="Cache Hit Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Member Efficiency Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Cache Hit Rate by Member */}
            <div className="rounded-xl bg-[#111111] p-6">
              <h3 className="text-lg font-semibold mb-4">Cache Hit Rate by Member</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={eff.members}
                    layout="vertical"
                    margin={{ top: 5, right: 20, bottom: 5, left: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={formatPct}
                      stroke="#666"
                      tick={{ fill: "#999", fontSize: 12 }}
                      domain={[0, 1]}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#666"
                      tick={{ fill: "#ccc", fontSize: 12 }}
                      width={55}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const m = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-lg">
                            <p className="font-medium text-sm mb-1">{m.name}</p>
                            <p className="text-sm text-[#E8FF47]">Cache Hit: {formatPct(m.cacheHitRate)}</p>
                            <p className="text-sm text-gray-400">Total: {formatTokens(m.totalTokens)}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="cacheHitRate" radius={[0, 4, 4, 0]}>
                      {eff.members.map((m, i) => (
                        <Cell
                          key={m.name}
                          fill={i === 0 ? "#E8FF47" : "#E8FF47"}
                          fillOpacity={1 - i * (0.6 / Math.max(eff.members.length - 1, 1))}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Output Ratio by Member */}
            <div className="rounded-xl bg-[#111111] p-6">
              <h3 className="text-lg font-semibold mb-4">Output Ratio by Member</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...eff.members].sort((a, b) => b.outputRatio - a.outputRatio)}
                    layout="vertical"
                    margin={{ top: 5, right: 20, bottom: 5, left: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#666"
                      tick={{ fill: "#999", fontSize: 12 }}
                      tickFormatter={(v: number) => `${v.toFixed(0)}x`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#666"
                      tick={{ fill: "#ccc", fontSize: 12 }}
                      width={55}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const m = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-lg">
                            <p className="font-medium text-sm mb-1">{m.name}</p>
                            <p className="text-sm text-[#3B82F6]">Output Ratio: {m.outputRatio.toFixed(1)}x</p>
                            <p className="text-sm text-gray-400">Input: {formatTokens(m.inputTokens)}</p>
                            <p className="text-sm text-gray-400">Output: {formatTokens(m.outputTokens)}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="outputRatio" radius={[0, 4, 4, 0]}>
                      {[...eff.members]
                        .sort((a, b) => b.outputRatio - a.outputRatio)
                        .map((m, i) => (
                          <Cell
                            key={m.name}
                            fill="#3B82F6"
                            fillOpacity={1 - i * (0.6 / Math.max(eff.members.length - 1, 1))}
                          />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="rounded-xl bg-[#111111] p-6">
            <h3 className="text-lg font-semibold mb-4">Efficiency Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-[#222]">
                    <th className="text-left py-2 font-medium">Member</th>
                    <th className="text-right py-2 font-medium">Total Tokens</th>
                    <th className="text-right py-2 font-medium">Cache Hit</th>
                    <th className="text-right py-2 font-medium">Output Ratio</th>
                    <th className="text-right py-2 font-medium">Cache Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {eff.members.map((m) => (
                    <tr key={m.name} className="border-b border-[#1a1a1a]">
                      <td className="py-3 font-medium">{m.name}</td>
                      <td className="text-right text-gray-400">{formatTokens(m.totalTokens)}</td>
                      <td className="text-right text-[#E8FF47]">{formatPct(m.cacheHitRate)}</td>
                      <td className="text-right text-[#3B82F6]">{m.outputRatio.toFixed(1)}x</td>
                      <td className="text-right text-[#10B981]">{m.cacheEfficiency.toFixed(1)}x</td>
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

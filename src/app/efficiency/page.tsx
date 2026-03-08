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
import { useT } from "@/lib/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

function InfoTip({ text, wide, below }: { text: string; wide?: boolean; below?: boolean }) {
  return (
    <div className="relative inline-flex ml-1.5">
      <svg className="w-3.5 h-3.5 text-gray-600 cursor-help peer outline-none" tabIndex={0} viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm1 12H7V7h2v5zM8 6a1 1 0 110-2 1 1 0 010 2z"/>
      </svg>
      <div className={`invisible peer-hover:visible peer-focus:visible absolute left-1/2 -translate-x-1/2 ${below ? "top-full mt-2" : "bottom-full mb-2"} ${wide ? "w-64" : "w-56"} rounded-lg bg-[#1a1a1a] border border-[#333] px-3 py-2 text-xs text-gray-300 leading-relaxed shadow-xl z-50 font-normal`}>
        {text}
        <div className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent ${below ? "bottom-full border-b-[5px] border-b-[#333]" : "top-full border-t-[5px] border-t-[#333]"}`}/>
      </div>
    </div>
  );
}

export default function EfficiencyPage() {
  const { t } = useT();
  const { data: rawData, loading, error } = useAnalytics();

  const eff = useMemo(
    () => (loading ? null : aggregateEfficiency(rawData)),
    [rawData, loading]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("nav.efficiency")}</h1>
        <DateRangePicker />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {loading || !eff ? (
        <div className="text-gray-400 text-center py-12">{t("common.loading")}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <KpiCard title={t("kpi.cacheHitRate")} value={formatPercent(eff.avgCacheHitRate)} subtitle={t("lb.teamAvg").toLowerCase()} tooltip={t("eff.cacheEff.tip")} />
            <KpiCard title={t("eff.outputRatio")} value={`${eff.avgOutputRatio.toFixed(1)}x`} subtitle={t("eff.outputRatio.sub")} tooltip={t("eff.outputRatio.tip")} />
            <KpiCard title={t("eff.cacheEff")} value={`${eff.avgCacheEfficiency.toFixed(1)}x`} subtitle={t("eff.cacheEff.sub")} tooltip={t("eff.cacheEff.tip")} />
          </div>

          {/* Daily Cache Hit Rate Trend */}
          <div className="rounded-xl bg-[#111111] p-6 mb-6">
            <h3 className="mb-4 text-lg font-semibold text-white flex items-center">{t("eff.dailyCacheHit")}<InfoTip text={t("eff.dailyCacheHit.tip")} /></h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eff.daily} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="#666" tick={{ fill: "#999", fontSize: 12 }} />
                  <YAxis tickFormatter={formatPct} stroke="#666" tick={{ fill: "#999", fontSize: 12 }} domain={[0, 1]} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-lg">
                          <p className="mb-2 text-sm text-neutral-400">{label}</p>
                          <p className="text-sm text-[#E8FF47]">
                            {t("lb.cacheHit")}: {formatPct(payload[0].value as number)}
                          </p>
                          {payload[1] && (
                            <p className="text-sm text-[#3B82F6]">
                              {t("eff.outputRatio")}: {(payload[1].value as number).toFixed(1)}x
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Line type="monotone" dataKey="cacheHitRate" stroke="#E8FF47" strokeWidth={2} dot={{ fill: "#E8FF47", r: 3 }} name={t("kpi.cacheHitRate")} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Member Efficiency Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="rounded-xl bg-[#111111] p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">{t("eff.cacheHitByMember")}<InfoTip text={t("eff.cacheHitByMember.tip")} /></h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eff.members} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                    <XAxis type="number" tickFormatter={formatPct} stroke="#666" tick={{ fill: "#999", fontSize: 12 }} domain={[0, 1]} />
                    <YAxis type="category" dataKey="name" stroke="#666" tick={{ fill: "#ccc", fontSize: 12 }} width={55} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const m = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-lg">
                            <p className="font-medium text-sm mb-1">{m.name}</p>
                            <p className="text-sm text-[#E8FF47]">{t("lb.cacheHit")}: {formatPct(m.cacheHitRate)}</p>
                            <p className="text-sm text-gray-400">{t("lb.total")}: {formatTokens(m.totalTokens)}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="cacheHitRate" radius={[0, 4, 4, 0]}>
                      {eff.members.map((m, i) => (
                        <Cell key={m.name} fill="#E8FF47" fillOpacity={1 - i * (0.6 / Math.max(eff.members.length - 1, 1))} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl bg-[#111111] p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">{t("eff.outputRatioByMember")}<InfoTip text={t("eff.outputRatioByMember.tip")} wide /></h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...eff.members].sort((a, b) => b.outputRatio - a.outputRatio)} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                    <XAxis type="number" stroke="#666" tick={{ fill: "#999", fontSize: 12 }} tickFormatter={(v: number) => `${v.toFixed(0)}x`} />
                    <YAxis type="category" dataKey="name" stroke="#666" tick={{ fill: "#ccc", fontSize: 12 }} width={55} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const m = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-lg">
                            <p className="font-medium text-sm mb-1">{m.name}</p>
                            <p className="text-sm text-[#3B82F6]">{t("eff.outputRatio")}: {m.outputRatio.toFixed(1)}x</p>
                            <p className="text-sm text-gray-400">{t("chart.input")}: {formatTokens(m.inputTokens)}</p>
                            <p className="text-sm text-gray-400">{t("chart.output")}: {formatTokens(m.outputTokens)}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="outputRatio" radius={[0, 4, 4, 0]}>
                      {[...eff.members].sort((a, b) => b.outputRatio - a.outputRatio).map((m, i) => (
                        <Cell key={m.name} fill="#3B82F6" fillOpacity={1 - i * (0.6 / Math.max(eff.members.length - 1, 1))} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="rounded-xl bg-[#111111] p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">{t("eff.breakdown")}<InfoTip text={t("eff.breakdown.tip")} /></h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-[#222]">
                    <th className="text-left py-2 font-medium">{t("eff.member")}</th>
                    <th className="text-right py-2 font-medium"><span className="inline-flex items-center justify-end">{t("kpi.totalTokens")}<InfoTip below text={t("eff.totalTokens.tip")} /></span></th>
                    <th className="text-right py-2 font-medium"><span className="inline-flex items-center justify-end">{t("lb.cacheHit")}<InfoTip below text={t("eff.cacheHit.tip")} /></span></th>
                    <th className="text-right py-2 font-medium"><span className="inline-flex items-center justify-end">{t("eff.outputRatio")}<InfoTip below text={t("eff.outputRatioCol.tip")} /></span></th>
                    <th className="text-right py-2 font-medium"><span className="inline-flex items-center justify-end">{t("eff.cacheEff")}<InfoTip below text={t("eff.cacheEffCol.tip")} /></span></th>
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

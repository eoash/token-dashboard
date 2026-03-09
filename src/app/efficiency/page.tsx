"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
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
import InfoTip from "@/components/InfoTip";
import DateRangePicker from "@/components/layout/DateRangePicker";
import { formatPercent, formatTokens } from "@/lib/utils";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import {
  aggregateEfficiency,
  aggregateCodexEfficiency,
  filterByTool,
  type EfficiencyTool,
  type EfficiencyAggregation,
  type CodexEfficiencyAggregation,
  type CodexMemberEfficiency,
  type MemberEfficiency,
} from "@/lib/aggregators/efficiency";
import type { CodexMemberRow } from "@/app/api/codex-usage/route";
import { useT } from "@/lib/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

const TOOL_TABS: { key: EfficiencyTool; label: string; color: string }[] = [
  { key: "claude", label: "Claude Code", color: "#00E87A" },
  { key: "codex", label: "Codex", color: "#10A37F" },
  { key: "all", label: "All", color: "#FFFFFF" },
];

// ── Daily Cache Hit Rate Chart (shared) ───────────────

function DailyChart({ daily, accentColor, t }: {
  daily: { date: string; cacheHitRate: number; outputRatio: number }[];
  accentColor: string;
  t: (key: TranslationKey) => string;
}) {
  if (daily.length < 2) {
    return (
      <div className="rounded-xl bg-[#111111] p-6 mb-6">
        <h3 className="mb-4 text-lg font-semibold text-white">{t("eff.dailyCacheHit")}</h3>
        <div className="h-[200px] flex items-center justify-center text-neutral-600 text-sm">
          {t("eff.noDaily" as TranslationKey)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#111111] p-6 mb-6">
      <h3 className="mb-4 text-lg font-semibold text-white flex items-center">{t("eff.dailyCacheHit")}<InfoTip text={t("eff.dailyCacheHit.tip")} /></h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={daily} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke="#666" tick={{ fill: "#999", fontSize: 12 }} />
            <YAxis tickFormatter={formatPct} stroke="#666" tick={{ fill: "#999", fontSize: 12 }} domain={[0, 1]} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-lg">
                    <p className="mb-2 text-sm text-neutral-400">{label}</p>
                    <p className="text-sm" style={{ color: accentColor }}>
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
            <Line type="monotone" dataKey="cacheHitRate" stroke={accentColor} strokeWidth={2} dot={{ fill: accentColor, r: 3 }} name={t("kpi.cacheHitRate")} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Claude / All Tab Content ──────────────────────────

function ClaudeEfficiencyContent({ eff, t }: { eff: EfficiencyAggregation; t: (key: TranslationKey) => string }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard title={t("kpi.cacheHitRate")} value={formatPercent(eff.avgCacheHitRate)} subtitle={t("lb.teamAvg").toLowerCase()} tooltip={t("eff.cacheEff.tip")} />
        <KpiCard title={t("eff.outputRatio")} value={`${eff.avgOutputRatio.toFixed(1)}x`} subtitle={t("eff.outputRatio.sub")} tooltip={t("eff.outputRatio.tip")} />
        <KpiCard title={t("eff.cacheEff")} value={`${eff.avgCacheEfficiency.toFixed(1)}x`} subtitle={t("eff.cacheEff.sub")} tooltip={t("eff.cacheEff.tip")} />
      </div>

      <DailyChart daily={eff.daily} accentColor="#00E87A" t={t} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MemberBarChart
          data={eff.members}
          dataKey="cacheHitRate"
          title={t("eff.cacheHitByMember")}
          tipText={t("eff.cacheHitByMember.tip")}
          color="#00E87A"
          formatX={formatPct}
          domain={[0, 1]}
          tooltipContent={(m: MemberEfficiency) => (
            <>
              <p className="font-medium text-sm mb-1">{m.name}</p>
              <p className="text-sm text-[#00E87A]">{t("lb.cacheHit")}: {formatPct(m.cacheHitRate)}</p>
              <p className="text-sm text-gray-400">{t("lb.total")}: {formatTokens(m.totalTokens)}</p>
            </>
          )}
          t={t}
        />
        <MemberBarChart
          data={[...eff.members].sort((a, b) => b.outputRatio - a.outputRatio)}
          dataKey="outputRatio"
          title={t("eff.outputRatioByMember")}
          tipText={t("eff.outputRatioByMember.tip")}
          color="#3B82F6"
          formatX={(v: number) => `${v.toFixed(0)}x`}
          tooltipContent={(m: MemberEfficiency) => (
            <>
              <p className="font-medium text-sm mb-1">{m.name}</p>
              <p className="text-sm text-[#3B82F6]">{t("eff.outputRatio")}: {m.outputRatio.toFixed(1)}x</p>
              <p className="text-sm text-gray-400">{t("chart.input")}: {formatTokens(m.inputTokens)}</p>
              <p className="text-sm text-gray-400">{t("chart.output")}: {formatTokens(m.outputTokens)}</p>
            </>
          )}
          t={t}
        />
      </div>

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
                  <td className="text-right text-[#00E87A]">{formatPct(m.cacheHitRate)}</td>
                  <td className="text-right text-[#3B82F6]">{m.outputRatio.toFixed(1)}x</td>
                  <td className="text-right text-[#10B981]">{m.cacheEfficiency.toFixed(1)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ── Codex Tab Content ─────────────────────────────────

function CodexEfficiencyContent({ eff, t }: { eff: CodexEfficiencyAggregation; t: (key: TranslationKey) => string }) {
  return (
    <>
      <div className="mx-0 mb-4 rounded-lg border border-[#10A37F]/20 bg-[#10A37F]/5 px-4 py-2.5 text-xs text-neutral-400 leading-relaxed">
        <span className="text-[#10A37F] font-medium">Note</span> — {t("eff.codexNote" as TranslationKey)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard title={t("kpi.cacheHitRate")} value={formatPercent(eff.avgCacheHitRate)} subtitle={t("lb.teamAvg").toLowerCase()} tooltip={t("kpi.cacheHitRate.tip")} />
        <KpiCard title={t("eff.outputRatio")} value={`${eff.avgOutputRatio.toFixed(1)}x`} subtitle={t("eff.outputRatio.sub")} tooltip={t("eff.outputRatio.tip")} />
        <KpiCard title={t("eff.reasoningRatio" as TranslationKey)} value={formatPercent(eff.avgReasoningRatio)} subtitle={t("eff.reasoningRatio.sub" as TranslationKey)} tooltip={t("eff.reasoningRatio.tip" as TranslationKey)} />
      </div>

      <DailyChart daily={eff.daily} accentColor="#10A37F" t={t} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MemberBarChart
          data={eff.members}
          dataKey="cacheHitRate"
          title={t("eff.cacheHitByMember")}
          tipText={t("eff.cacheHitByMember.tip")}
          color="#10A37F"
          formatX={formatPct}
          domain={[0, 1]}
          tooltipContent={(m: CodexMemberEfficiency) => (
            <>
              <p className="font-medium text-sm mb-1">{m.name}</p>
              <p className="text-sm text-[#10A37F]">{t("lb.cacheHit")}: {formatPct(m.cacheHitRate)}</p>
              <p className="text-sm text-gray-400">{t("lb.total")}: {formatTokens(m.totalTokens)}</p>
            </>
          )}
          t={t}
        />
        <MemberBarChart
          data={[...eff.members].sort((a, b) => b.reasoningRatio - a.reasoningRatio)}
          dataKey="reasoningRatio"
          title={t("eff.reasoningRatio" as TranslationKey)}
          tipText={t("eff.reasoningRatio.tip" as TranslationKey)}
          color="#F59E0B"
          formatX={formatPct}
          domain={[0, 1]}
          tooltipContent={(m: CodexMemberEfficiency) => (
            <>
              <p className="font-medium text-sm mb-1">{m.name}</p>
              <p className="text-sm text-[#F59E0B]">{t("eff.reasoningRatio" as TranslationKey)}: {formatPct(m.reasoningRatio)}</p>
              <p className="text-sm text-gray-400">{t("chart.output")}: {formatTokens(m.outputTokens)}</p>
            </>
          )}
          t={t}
        />
      </div>

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
                <th className="text-right py-2 font-medium"><span className="inline-flex items-center justify-end">{t("eff.reasoningRatio" as TranslationKey)}<InfoTip below text={t("eff.reasoningRatio.tip" as TranslationKey)} /></span></th>
              </tr>
            </thead>
            <tbody>
              {eff.members.map((m) => (
                <tr key={m.name} className="border-b border-[#1a1a1a]">
                  <td className="py-3 font-medium">{m.name}</td>
                  <td className="text-right text-gray-400">{formatTokens(m.totalTokens)}</td>
                  <td className="text-right text-[#10A37F]">{formatPct(m.cacheHitRate)}</td>
                  <td className="text-right text-[#3B82F6]">{m.outputRatio.toFixed(1)}x</td>
                  <td className="text-right text-[#F59E0B]">{formatPct(m.reasoningRatio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ── Shared horizontal bar chart ───────────────────────

function MemberBarChart<T extends { name: string }>({ data, dataKey, title, tipText, color, formatX, domain, tooltipContent, t }: {
  data: T[];
  dataKey: string;
  title: string;
  tipText: string;
  color: string;
  formatX: (v: number) => string;
  domain?: [number, number];
  tooltipContent: (m: T) => React.ReactNode;
  t: (key: TranslationKey) => string;
}) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-xl bg-[#111111] p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">{title}<InfoTip text={tipText} wide /></h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
            <XAxis type="number" tickFormatter={formatX} stroke="#666" tick={{ fill: "#999", fontSize: 12 }} domain={domain} />
            <YAxis type="category" dataKey="name" stroke="#666" tick={{ fill: "#ccc", fontSize: 12 }} width={55} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-lg">
                    {tooltipContent(payload[0].payload as T)}
                  </div>
                );
              }}
            />
            <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={color} fillOpacity={1 - i * (0.6 / Math.max(data.length - 1, 1))} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────

export default function EfficiencyPage() {
  const { t } = useT();
  const { data: rawData, loading, error } = useAnalytics();
  const [tool, setTool] = useState<EfficiencyTool>("claude");

  // Codex data from dedicated API (has reasoning tokens)
  const [codexRows, setCodexRows] = useState<CodexMemberRow[]>([]);
  const [codexLoading, setCodexLoading] = useState(false);

  const fetchCodex = useCallback(async () => {
    setCodexLoading(true);
    try {
      const res = await fetch("/api/codex-usage");
      if (res.ok) {
        const json = await res.json();
        setCodexRows(json.data ?? []);
      }
    } catch {
      // Codex data is optional — fail silently
    } finally {
      setCodexLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tool === "codex" || tool === "all") fetchCodex();
  }, [tool, fetchCodex]);

  const claudeEff = useMemo(
    () => loading ? null : aggregateEfficiency(filterByTool(rawData, "claude")),
    [rawData, loading],
  );

  const codexEff = useMemo(
    () => {
      if (codexLoading || codexRows.length === 0) return null;
      const codexAnalyticsData = filterByTool(rawData, "codex");
      return aggregateCodexEfficiency(codexRows, codexAnalyticsData);
    },
    [rawData, codexRows, codexLoading],
  );

  const allEff = useMemo(
    () => loading ? null : aggregateEfficiency(rawData),
    [rawData, loading],
  );

  const isLoading = loading || (tool === "codex" && codexLoading);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{t("nav.efficiency")}</h1>
          <div className="flex gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
            {TOOL_TABS.map((tab) => (
              <button key={tab.key} onClick={() => setTool(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${tool === tab.key ? "text-black" : "text-neutral-400 hover:text-white"}`}
                style={tool === tab.key ? { backgroundColor: tab.color } : {}}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <DateRangePicker />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {isLoading ? (
        <div className="text-gray-400 text-center py-12">{t("common.loading")}</div>
      ) : (
        <>
          {tool === "claude" && claudeEff && <ClaudeEfficiencyContent eff={claudeEff} t={t} />}
          {tool === "codex" && codexEff && <CodexEfficiencyContent eff={codexEff} t={t} />}
          {tool === "codex" && !codexEff && !codexLoading && (
            <div className="text-gray-400 text-center py-12">{t("lb.noDataCodex")}</div>
          )}
          {tool === "all" && allEff && <ClaudeEfficiencyContent eff={allEff} t={t} />}
        </>
      )}
    </div>
  );
}

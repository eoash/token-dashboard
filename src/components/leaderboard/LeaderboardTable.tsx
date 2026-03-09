"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatTokens, formatPercent } from "@/lib/utils";
import { aggregateMembers, type ClaudeMemberRow } from "@/lib/aggregators/leaderboard";
import { NAME_TO_AVATAR } from "@/lib/constants";
import InfoTip from "@/components/InfoTip";
import { useT } from "@/lib/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";
import type { GeminiMemberRow } from "@/app/api/gemini-usage/route";
import type { CodexMemberRow } from "@/app/api/codex-usage/route";

type AiTool = "claude" | "gemini" | "codex";
type Period = "today" | "7d" | "30d" | "all";

const PERIOD_DAYS: Record<Period, number> = { today: 1, "7d": 7, "30d": 30, all: 365 };
const PERIOD_LABEL_KEYS: Record<Period, TranslationKey> = {
  today: "period.today",
  "7d": "period.7days",
  "30d": "period.30days",
  all: "period.allTime",
};
const AVATAR_COLORS = ["#7C3AED", "#DB2777", "#059669", "#D97706", "#2563EB"];
const MEDAL = ["🥇", "🥈", "🥉"];

function Avatar({ name, initial, color }: { name: string; initial: string; color: string }) {
  const avatarUrl = NAME_TO_AVATAR[name];
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: color }}>
      {initial}
    </div>
  );
}

// ── Claude Code 테이블 ──────────────────────────────
function ClaudeTable({ period }: { period: Period }) {
  const { t, locale } = useT();
  const [rows, setRows] = useState<ClaudeMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?days=${PERIOD_DAYS[period]}`);
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      setRows(aggregateMembers(json.data ?? []));
      setLastUpdated(new Date().toLocaleTimeString(locale === "ko" ? "ko-KR" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (e) {
      console.warn("leaderboard fetch failed:", e);
      setError(t("common.error"));
      setRows([]);
    } finally { setLoading(false); }
  }, [period, t, locale]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const timer = setInterval(fetchData, 30_000);
    const onVis = () => { if (document.visibilityState === "visible") fetchData(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVis); };
  }, [fetchData]);

  const maxTotal = rows.length > 0 ? rows[0].total : 1;
  const avgTotal = rows.length > 0 ? rows.reduce((s, r) => s + r.total, 0) / rows.length : 0;
  const avgLineIndex = rows.findIndex((r) => r.total < avgTotal);

  return (
    <>
      {lastUpdated && <p className="text-xs text-neutral-600 px-6 pb-2">Updated {lastUpdated}</p>}
      {error && (
        <div className="mx-6 mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-400 text-xs">{error}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e1e]">
              <th className="px-3 py-3 text-left text-xs text-neutral-600 font-medium w-10 md:px-4">#</th>
              <th className="px-3 py-3 text-left text-xs text-neutral-600 font-medium md:px-4">{t("lb.developer")}</th>
              <th className="hidden sm:table-cell px-4 py-3 text-right text-xs text-neutral-600 font-medium"><span className="inline-flex items-center justify-end">{t("chart.input").toUpperCase()}<InfoTip below text={t("lb.input.tip")} /></span></th>
              <th className="hidden sm:table-cell px-4 py-3 text-right text-xs text-neutral-600 font-medium"><span className="inline-flex items-center justify-end">{t("chart.output").toUpperCase()}<InfoTip below text={t("lb.output.tip")} /></span></th>
              <th className="hidden lg:table-cell px-4 py-3 text-right text-xs text-neutral-600 font-medium"><span className="inline-flex items-center justify-end">{t("chart.cacheRead").toUpperCase()}<InfoTip below text={t("lb.cacheRead.tip")} /></span></th>
              <th className="px-3 py-3 text-right text-xs text-neutral-600 font-medium min-w-[120px] md:min-w-[180px] md:px-4"><span className="inline-flex items-center justify-end">{t("lb.total")}<InfoTip below text={t("lb.total.tip")} /></span></th>
              <th className="hidden sm:table-cell px-4 py-3 text-right text-xs text-neutral-600 font-medium"><span className="inline-flex items-center justify-end">{t("lb.cacheHit")}<InfoTip below text={t("lb.cacheHit.tip")} /></span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-600">{t("common.loading")}</td></tr>
            ) : rows.map((row, i) => {
              const isTop3 = i < 3;
              const isBelowAvg = row.total < avgTotal;
              const barWidth = maxTotal > 0 ? (row.total / maxTotal) * 100 : 0;
              const showAvgLine = i === avgLineIndex && avgLineIndex > 0;

              return (
                <React.Fragment key={row.name}>
                  {showAvgLine && (
                    <tr>
                      <td colSpan={7} className="px-4 py-0">
                        <div className="flex items-center gap-2 py-1">
                          <div className="flex-1 border-t border-dashed border-yellow-500/40" />
                          <span className="text-[10px] text-yellow-500/60 font-medium whitespace-nowrap">{t("lb.teamAvg")} — {formatTokens(avgTotal)}</span>
                          <div className="flex-1 border-t border-dashed border-yellow-500/40" />
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr className={`border-b border-[#1a1a1a] transition-colors ${isTop3 ? "bg-[#00E87A]/[0.03] hover:bg-[#00E87A]/[0.07]" : "hover:bg-[#161616]"} ${isBelowAvg ? "opacity-50" : ""}`}>
                    <td className="px-3 py-3 text-sm md:px-4 md:py-4">{isTop3 ? MEDAL[i] : <span className="text-neutral-600">{i + 1}</span>}</td>
                    <td className="px-3 py-3 md:px-4 md:py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <Avatar name={row.name} initial={row.initial} color={isTop3 ? "#00E87A" : AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                        <span className={`font-medium text-sm md:text-base ${isTop3 ? "text-white" : "text-neutral-300"}`}>{row.name}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.input)}</td>
                    <td className="hidden sm:table-cell px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.output)}</td>
                    <td className="hidden lg:table-cell px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.cacheRead)}</td>
                    <td className="px-3 py-3 text-right md:px-4 md:py-4">
                      <div className="flex items-center justify-end gap-2 md:gap-3">
                        <div className="w-16 md:w-24 h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: isTop3 ? "#00E87A" : isBelowAvg ? "#555" : "#888" }} />
                        </div>
                        <span className="text-white font-mono text-xs md:text-sm font-medium min-w-[50px] md:min-w-[60px] text-right">{formatTokens(row.total)}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-4 text-right">
                      <span className="font-mono text-sm font-bold text-[#00E87A]">{formatPercent(row.cacheHitRate)}</span>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-[#1a1a1a] flex justify-between text-xs text-neutral-600">
        <span>{rows.length}{t("lb.members")} · {t(PERIOD_LABEL_KEYS[period])}</span>
        <span>{t("lb.autoRefresh")}</span>
      </div>
    </>
  );
}

// ── Codex 테이블 (실데이터) ──────────────────────────
function CodexTable() {
  const { t, locale } = useT();
  const [rows, setRows] = useState<CodexMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const accentColor = "#10A37F";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/codex-usage");
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      setRows(json.data ?? []);
      setLastUpdated(new Date().toLocaleTimeString(locale === "ko" ? "ko-KR" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (e) {
      console.warn("codex leaderboard fetch failed:", e);
      setError(t("common.error"));
      setRows([]);
    } finally { setLoading(false); }
  }, [t, locale]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const timer = setInterval(fetchData, 30_000);
    const onVis = () => { if (document.visibilityState === "visible") fetchData(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVis); };
  }, [fetchData]);

  return (
    <>
      <div className="mx-6 mt-3 mb-2 rounded-lg border border-[#10A37F]/20 bg-[#10A37F]/5 px-4 py-2.5 text-xs text-neutral-400 leading-relaxed">
        <span className="text-[#10A37F] font-medium">Note</span> — {t("lb.codexNote" as TranslationKey)}
      </div>
      {lastUpdated && <p className="text-xs text-neutral-600 px-6 pb-2">Updated {lastUpdated}</p>}
      {error && (
        <div className="mx-6 mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-400 text-xs">{error}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e1e]">
              <th className="px-3 py-3 text-left text-xs text-neutral-600 font-medium w-10 md:px-4">#</th>
              <th className="px-3 py-3 text-left text-xs text-neutral-600 font-medium md:px-4">{t("lb.developer")}</th>
              <th className="hidden sm:table-cell px-4 py-3 text-right text-xs text-neutral-600 font-medium"><span className="inline-flex items-center justify-end">{t("chart.input").toUpperCase()}<InfoTip below text={t("lb.input.tip")} /></span></th>
              <th className="hidden sm:table-cell px-4 py-3 text-right text-xs text-neutral-600 font-medium"><span className="inline-flex items-center justify-end">{t("chart.output").toUpperCase()}<InfoTip below text={t("lb.output.tip")} /></span></th>
              <th className="hidden lg:table-cell px-4 py-3 text-right text-xs text-neutral-600 font-medium"><span className="inline-flex items-center justify-end">CACHED<InfoTip below text={t("lb.cached.tip")} /></span></th>
              <th className="hidden lg:table-cell px-4 py-3 text-right text-xs text-neutral-600 font-medium"><span className="inline-flex items-center justify-end">REASONING<InfoTip below text={t("lb.reasoning.tip")} /></span></th>
              <th className="px-3 py-3 text-right text-xs text-neutral-600 font-medium md:px-4"><span className="inline-flex items-center justify-end">{t("lb.total")}<InfoTip below text={t("lb.total.tip")} /></span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-600">{t("common.loading")}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-600">{t("lb.noDataCodex")}</td></tr>
            ) : rows.map((row, i) => (
              <tr key={row.email} className="border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors">
                <td className="px-3 py-3 text-sm md:px-4 md:py-4">{i < 3 ? MEDAL[i] : <span className="text-neutral-600">{i + 1}</span>}</td>
                <td className="px-3 py-3 md:px-4 md:py-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Avatar name={row.name} initial={row.name[0]} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                    <span className="font-medium text-white text-sm md:text-base">{row.name}</span>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.input)}</td>
                <td className="hidden sm:table-cell px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.output)}</td>
                <td className="hidden lg:table-cell px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.cached)}</td>
                <td className="hidden lg:table-cell px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.reasoning)}</td>
                <td className="px-3 py-3 text-right md:px-4 md:py-4">
                  <span className="font-mono text-xs md:text-sm font-bold" style={{ color: accentColor }}>{formatTokens(row.total)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-[#1a1a1a] flex justify-between text-xs text-neutral-600">
        <span>{rows.length}{t("lb.members")} · {t("period.allTime")}</span>
        <span>{t("lb.autoRefresh")}</span>
      </div>
    </>
  );
}

// ── Gemini CLI 테이블 (실데이터) ─────────────────────
function GeminiTable() {
  const { t, locale } = useT();
  const [rows, setRows] = useState<GeminiMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const accentColor = "#4285F4";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gemini-usage");
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const json = await res.json();
      setRows(json.data ?? []);
      setLastUpdated(new Date().toLocaleTimeString(locale === "ko" ? "ko-KR" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (e) {
      console.warn("gemini leaderboard fetch failed:", e);
      setError(t("common.error"));
      setRows([]);
    } finally { setLoading(false); }
  }, [t, locale]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const timer = setInterval(fetchData, 30_000);
    const onVis = () => { if (document.visibilityState === "visible") fetchData(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVis); };
  }, [fetchData]);

  return (
    <>
      {lastUpdated && <p className="text-xs text-neutral-600 px-6 pb-2">Updated {lastUpdated}</p>}
      {error && (
        <div className="mx-6 mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-400 text-xs">{error}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e1e]">
              <th className="px-3 py-3 text-left text-xs text-neutral-600 font-medium w-10 md:px-4">#</th>
              <th className="px-3 py-3 text-left text-xs text-neutral-600 font-medium md:px-4">{t("lb.developer")}</th>
              <th className="hidden sm:table-cell px-4 py-3 text-right text-xs text-neutral-600 font-medium"><span className="inline-flex items-center justify-end">{t("chart.input").toUpperCase()}<InfoTip below text={t("lb.input.tip")} /></span></th>
              <th className="hidden sm:table-cell px-4 py-3 text-right text-xs text-neutral-600 font-medium"><span className="inline-flex items-center justify-end">{t("chart.output").toUpperCase()}<InfoTip below text={t("lb.output.tip")} /></span></th>
              <th className="hidden lg:table-cell px-4 py-3 text-right text-xs text-neutral-600 font-medium"><span className="inline-flex items-center justify-end">CACHE<InfoTip below text={t("lb.geminiCache.tip")} /></span></th>
              <th className="hidden lg:table-cell px-4 py-3 text-right text-xs text-neutral-600 font-medium"><span className="inline-flex items-center justify-end">THOUGHT<InfoTip below text={t("lb.thought.tip")} /></span></th>
              <th className="px-3 py-3 text-right text-xs text-neutral-600 font-medium md:px-4"><span className="inline-flex items-center justify-end">{t("lb.total")}<InfoTip below text={t("lb.total.tip")} /></span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-600">{t("common.loading")}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-600">{t("lb.noDataGemini")}</td></tr>
            ) : rows.map((row, i) => (
              <tr key={row.email} className="border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors">
                <td className="px-3 py-3 text-sm md:px-4 md:py-4">{i < 3 ? MEDAL[i] : <span className="text-neutral-600">{i + 1}</span>}</td>
                <td className="px-3 py-3 md:px-4 md:py-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Avatar name={row.name} initial={row.name[0]} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                    <span className="font-medium text-white text-sm md:text-base">{row.name}</span>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.input)}</td>
                <td className="hidden sm:table-cell px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.output)}</td>
                <td className="hidden lg:table-cell px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.cache)}</td>
                <td className="hidden lg:table-cell px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.thought)}</td>
                <td className="px-3 py-3 text-right md:px-4 md:py-4">
                  <span className="font-mono text-xs md:text-sm font-bold" style={{ color: accentColor }}>{formatTokens(row.total)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-[#1a1a1a] flex justify-between text-xs text-neutral-600">
        <span>{rows.length}{t("lb.members")} · {t("period.allTime")}</span>
        <span>{t("lb.autoRefresh")}</span>
      </div>
    </>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────
export default function LeaderboardTable() {
  const { t } = useT();
  const [tool, setTool] = useState<AiTool>("claude");
  const [period, setPeriod] = useState<Period>("30d");

  const AI_TOOLS: { key: AiTool; label: string; color: string }[] = [
    { key: "claude", label: "Claude Code", color: "#00E87A" },
    { key: "gemini", label: "Gemini",      color: "#4285F4" },
    { key: "codex",  label: "Codex",       color: "#10A37F" },
  ];

  return (
    <div className="rounded-xl bg-[#111111] border border-[#222] overflow-hidden">
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222]">
        <div className="flex gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
          {AI_TOOLS.map((ai) => (
            <button key={ai.key} onClick={() => setTool(ai.key)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${tool === ai.key ? "text-black" : "text-neutral-400 hover:text-white"}`}
              style={tool === ai.key ? { backgroundColor: ai.color } : {}}>
              {ai.label}
            </button>
          ))}
        </div>

        {tool === "claude" && (
          <div className="flex rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-1 gap-1">
            {(Object.keys(PERIOD_LABEL_KEYS) as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p ? "bg-white text-black" : "text-neutral-400 hover:text-white"}`}>
                {t(PERIOD_LABEL_KEYS[p])}
              </button>
            ))}
          </div>
        )}
      </div>

      {tool === "claude" && <ClaudeTable period={period} />}
      {tool === "gemini" && <GeminiTable />}
      {tool === "codex"  && <CodexTable />}
    </div>
  );
}

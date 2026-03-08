"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatTokens, formatPercent } from "@/lib/utils";
import { aggregateMembers, type ClaudeMemberRow } from "@/lib/aggregators/leaderboard";
import { NAME_TO_AVATAR } from "@/lib/constants";
import type { GeminiMemberRow } from "@/app/api/gemini-usage/route";
import type { CodexMemberRow } from "@/app/api/codex-usage/route";

type AiTool = "claude" | "gemini" | "codex";
type Period = "today" | "7d" | "30d" | "all";

const PERIOD_DAYS: Record<Period, number> = { today: 1, "7d": 7, "30d": 30, all: 365 };
const PERIOD_LABELS: Record<Period, string> = { today: "Today", "7d": "7 Days", "30d": "30 Days", all: "All Time" };
const AVATAR_COLORS = ["#7C3AED", "#DB2777", "#059669", "#D97706", "#2563EB"];
const MEDAL = ["🥇", "🥈", "🥉"];

function Avatar({ name, initial, color }: { name: string; initial: string; color: string }) {
  const avatarUrl = NAME_TO_AVATAR[name];
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name}
        className="w-8 h-8 rounded-full object-cover shrink-0" />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
      style={{ backgroundColor: color }}>
      {initial}
    </div>
  );
}

// ── Claude Code 테이블 ──────────────────────────────
function ClaudeTable({ period }: { period: Period }) {
  const [rows, setRows] = useState<ClaudeMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?days=${PERIOD_DAYS[period]}`);
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      const json = await res.json();
      setRows(aggregateMembers(json.data ?? []));
      setLastUpdated(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (e) {
      console.error("leaderboard fetch failed:", e);
      setError("데이터를 불러오지 못했습니다.");
      setRows([]);
    } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const t = setInterval(fetchData, 30_000);
    const onVis = () => { if (document.visibilityState === "visible") fetchData(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [fetchData]);

  const maxTotal = rows.length > 0 ? rows[0].total : 1;
  const avgTotal = rows.length > 0 ? rows.reduce((s, r) => s + r.total, 0) / rows.length : 0;
  const avgLineIndex = rows.findIndex((r) => r.total < avgTotal);

  return (
    <>
      {lastUpdated && <p className="text-xs text-neutral-600 px-6 pb-2">Updated {lastUpdated}</p>}
      {error && (
        <div className="mx-6 mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-400 text-xs">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e1e]">
              <th className="px-4 py-3 text-left text-xs text-neutral-600 font-medium w-10">#</th>
              <th className="px-4 py-3 text-left text-xs text-neutral-600 font-medium">DEVELOPER</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">INPUT</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">OUTPUT</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">CACHE R</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium min-w-[180px]">TOTAL</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">CACHE HIT</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-600">불러오는 중...</td></tr>
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
                          <span className="text-[10px] text-yellow-500/60 font-medium whitespace-nowrap">TEAM AVG — {formatTokens(avgTotal)}</span>
                          <div className="flex-1 border-t border-dashed border-yellow-500/40" />
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr className={`border-b border-[#1a1a1a] transition-colors ${isTop3 ? "bg-[#E8FF47]/[0.03] hover:bg-[#E8FF47]/[0.07]" : "hover:bg-[#161616]"} ${isBelowAvg ? "opacity-50" : ""}`}>
                    <td className="px-4 py-4 text-sm">{isTop3 ? MEDAL[i] : <span className="text-neutral-600">{i + 1}</span>}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={row.name} initial={row.initial} color={isTop3 ? "#E8FF47" : AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                        <span className={`font-medium ${isTop3 ? "text-white" : "text-neutral-300"}`}>{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.input)}</td>
                    <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.output)}</td>
                    <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.cacheRead)}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="w-24 h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: isTop3 ? "#E8FF47" : isBelowAvg ? "#555" : "#888",
                            }}
                          />
                        </div>
                        <span className="text-white font-mono text-sm font-medium min-w-[60px] text-right">{formatTokens(row.total)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-mono text-sm font-bold text-[#E8FF47]">
                        {formatPercent(row.cacheHitRate)}
                      </span>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-[#1a1a1a] flex justify-between text-xs text-neutral-600">
        <span>{rows.length}명 · {PERIOD_LABELS[period]}</span>
        <span>Auto-refresh: 30s</span>
      </div>
    </>
  );
}

// ── Codex 테이블 (실데이터) ──────────────────────────
function CodexTable() {
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
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      const json = await res.json();
      setRows(json.data ?? []);
      setLastUpdated(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (e) {
      console.error("codex leaderboard fetch failed:", e);
      setError("데이터를 불러오지 못했습니다.");
      setRows([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const t = setInterval(fetchData, 30_000);
    const onVis = () => { if (document.visibilityState === "visible") fetchData(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [fetchData]);

  return (
    <>
      {lastUpdated && <p className="text-xs text-neutral-600 px-6 pb-2">Updated {lastUpdated}</p>}
      {error && (
        <div className="mx-6 mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-400 text-xs">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e1e]">
              <th className="px-4 py-3 text-left text-xs text-neutral-600 font-medium w-10">#</th>
              <th className="px-4 py-3 text-left text-xs text-neutral-600 font-medium">DEVELOPER</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">INPUT</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">OUTPUT</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">CACHED</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">REASONING</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-600">불러오는 중...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-600">Codex 사용 데이터가 없습니다</td></tr>
            ) : rows.map((row, i) => (
              <tr key={row.email} className="border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors">
                <td className="px-4 py-4 text-sm">{i < 3 ? MEDAL[i] : <span className="text-neutral-600">{i + 1}</span>}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={row.name} initial={row.name[0]} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                    <span className="font-medium text-white">{row.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.input)}</td>
                <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.output)}</td>
                <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.cached)}</td>
                <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.reasoning)}</td>
                <td className="px-4 py-4 text-right">
                  <span className="font-mono text-sm font-bold" style={{ color: accentColor }}>
                    {formatTokens(row.total)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-[#1a1a1a] flex justify-between text-xs text-neutral-600">
        <span>{rows.length}명 · All Time</span>
        <span>Auto-refresh: 30s</span>
      </div>
    </>
  );
}

// ── Gemini CLI 테이블 (실데이터) ─────────────────────
function GeminiTable() {
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
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      const json = await res.json();
      setRows(json.data ?? []);
      setLastUpdated(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (e) {
      console.error("gemini leaderboard fetch failed:", e);
      setError("데이터를 불러오지 못했습니다.");
      setRows([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const t = setInterval(fetchData, 30_000);
    const onVis = () => { if (document.visibilityState === "visible") fetchData(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [fetchData]);

  return (
    <>
      {lastUpdated && <p className="text-xs text-neutral-600 px-6 pb-2">Updated {lastUpdated}</p>}
      {error && (
        <div className="mx-6 mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-400 text-xs">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e1e]">
              <th className="px-4 py-3 text-left text-xs text-neutral-600 font-medium w-10">#</th>
              <th className="px-4 py-3 text-left text-xs text-neutral-600 font-medium">DEVELOPER</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">INPUT</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">OUTPUT</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">CACHE</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">THOUGHT</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-600">불러오는 중...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-600">Gemini CLI 사용 데이터가 없습니다</td></tr>
            ) : rows.map((row, i) => (
              <tr key={row.email} className="border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors">
                <td className="px-4 py-4 text-sm">{i < 3 ? MEDAL[i] : <span className="text-neutral-600">{i + 1}</span>}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={row.name} initial={row.name[0]} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                    <span className="font-medium text-white">{row.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.input)}</td>
                <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.output)}</td>
                <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.cache)}</td>
                <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.thought)}</td>
                <td className="px-4 py-4 text-right">
                  <span className="font-mono text-sm font-bold" style={{ color: accentColor }}>
                    {formatTokens(row.total)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-[#1a1a1a] flex justify-between text-xs text-neutral-600">
        <span>{rows.length}명 · All Time</span>
        <span>Auto-refresh: 30s</span>
      </div>
    </>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────
export default function LeaderboardTable() {
  const [tool, setTool] = useState<AiTool>("claude");
  const [period, setPeriod] = useState<Period>("30d");

  const AI_TOOLS: { key: AiTool; label: string; color: string }[] = [
    { key: "claude", label: "Claude Code", color: "#E8FF47" },
    { key: "gemini", label: "Gemini",      color: "#4285F4" },
    { key: "codex",  label: "Codex",       color: "#10A37F" },
  ];

  return (
    <div className="rounded-xl bg-[#111111] border border-[#222] overflow-hidden">
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222]">
        {/* AI 도구 탭 */}
        <div className="flex gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
          {AI_TOOLS.map((t) => (
            <button key={t.key} onClick={() => setTool(t.key)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${tool === t.key ? "text-black" : "text-neutral-400 hover:text-white"}`}
              style={tool === t.key ? { backgroundColor: t.color } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {tool === "claude" && (
          <div className="flex rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-1 gap-1">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p ? "bg-white text-black" : "text-neutral-400 hover:text-white"}`}>
                {PERIOD_LABELS[p]}
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

"use client";

import { useState, useEffect, useCallback } from "react";
import { formatTokens, formatPercent } from "@/lib/utils";
import { getMockGptData, type AiMemberRow } from "@/lib/mock-ai-tools";
import { aggregateMembers, type ClaudeMemberRow } from "@/lib/aggregators/leaderboard";
import type { GeminiMemberRow } from "@/app/api/gemini-usage/route";

type AiTool = "claude" | "gemini" | "gpt";
type Period = "today" | "7d" | "30d" | "all";

const PERIOD_DAYS: Record<Period, number> = { today: 1, "7d": 7, "30d": 30, all: 365 };
const PERIOD_LABELS: Record<Period, string> = { today: "Today", "7d": "7 Days", "30d": "30 Days", all: "All Time" };
const AVATAR_COLORS = ["#7C3AED", "#DB2777", "#059669", "#D97706", "#2563EB"];
const MEDAL = ["🥇", "🥈", "🥉"];

function Avatar({ initial, color }: { initial: string; color: string }) {
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
  useEffect(() => { const t = setInterval(fetchData, 30_000); return () => clearInterval(t); }, [fetchData]);

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
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">TOTAL</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">CACHE HIT</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-600">불러오는 중...</td></tr>
            ) : rows.map((row, i) => (
              <tr key={row.name} className="border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors">
                <td className="px-4 py-4 text-sm">{i < 3 ? MEDAL[i] : <span className="text-neutral-600">{i + 1}</span>}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar initial={row.initial} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                    <span className="font-medium text-white">{row.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.input)}</td>
                <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.output)}</td>
                <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.cacheRead)}</td>
                <td className="px-4 py-4 text-right text-white font-mono text-sm font-medium">{formatTokens(row.total)}</td>
                <td className="px-4 py-4 text-right">
                  <span className="font-mono text-sm font-bold text-[#E8FF47]">
                    {formatPercent(row.cacheHitRate)}
                  </span>
                </td>
              </tr>
            ))}
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

// ── Gemini / GPT 공통 테이블 ─────────────────────────
function AiTable({ rows, accentColor }: { rows: AiMemberRow[]; accentColor: string }) {
  const sorted = [...rows].sort((a, b) => b.totalTokens - a.totalTokens);
  const colors = [accentColor, accentColor + "cc", accentColor + "99", "#6B7280", "#6B7280"];

  return (
    <>
      <div className="mx-6 mt-4 mb-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-yellow-400 text-xs">
        ⚠️ Mock 데이터입니다 — 실제 사용량이 아닙니다
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e1e]">
              <th className="px-4 py-3 text-left text-xs text-neutral-600 font-medium w-10">#</th>
              <th className="px-4 py-3 text-left text-xs text-neutral-600 font-medium">DEVELOPER</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">INPUT</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">OUTPUT</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={row.name} className="border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors">
                <td className="px-4 py-4 text-sm">{i < 3 ? MEDAL[i] : <span className="text-neutral-600">{i + 1}</span>}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ backgroundColor: colors[i] }}>
                      {row.initial}
                    </div>
                    <span className="font-medium text-white">{row.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.inputTokens)}</td>
                <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">{formatTokens(row.outputTokens)}</td>
                <td className="px-4 py-4 text-right">
                  <span className="font-mono text-sm font-bold" style={{ color: accentColor }}>
                    {formatTokens(row.totalTokens)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-[#1a1a1a] flex justify-between text-xs text-neutral-600">
        <span>{sorted.length}명 · 30 Days</span>
        <span>Mock Data</span>
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
                    <Avatar initial={row.name[0]} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
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
    { key: "gpt",    label: "ChatGPT",     color: "#10A37F" },
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
      {tool === "gpt"    && <AiTable rows={getMockGptData()}    accentColor="#10A37F" />}
    </div>
  );
}

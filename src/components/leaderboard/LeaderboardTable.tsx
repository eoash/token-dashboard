"use client";

import { useState, useEffect, useCallback } from "react";
import { EMAIL_TO_NAME } from "@/lib/constants";

type Period = "today" | "7d" | "30d" | "all";
type Metric = "cost" | "tokens";

const PERIOD_DAYS: Record<Period, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  all: 365,
};

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  "7d": "7 Days",
  "30d": "30 Days",
  all: "All Time",
};

const AVATAR_COLORS = ["#7C3AED", "#DB2777", "#059669", "#D97706", "#2563EB"];
const MEDAL = ["🥇", "🥈", "🥉"];

interface MemberRow {
  name: string;
  initial: string;
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
  total: number;
  cost: number;
}

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateMembers(data: any[]): MemberRow[] {
  const map = new Map<string, MemberRow>();

  for (const d of data) {
    const email = d.actor?.email_address;
    if (!email) continue;

    const name = EMAIL_TO_NAME[email] ?? email.split("@")[0];
    const existing = map.get(name) ?? {
      name,
      initial: name[0].toUpperCase(),
      input: 0,
      output: 0,
      cacheWrite: 0,
      cacheRead: 0,
      total: 0,
      cost: 0,
    };

    existing.input += d.input_tokens ?? 0;
    existing.output += d.output_tokens ?? 0;
    existing.cacheWrite += d.cache_creation_tokens ?? 0;
    existing.cacheRead += d.cache_read_tokens ?? 0;
    existing.cost += (d.estimated_cost_usd_cents ?? 0) / 100;
    existing.total =
      existing.input + existing.output + existing.cacheWrite + existing.cacheRead;

    map.set(name, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export default function LeaderboardTable() {
  const [period, setPeriod] = useState<Period>("30d");
  const [metric, setMetric] = useState<Metric>("cost");
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const days = PERIOD_DAYS[period];
      const res = await fetch(`/api/analytics?days=${days}`);
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      setRows(aggregateMembers(json.data ?? []));
      setLastUpdated(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  // 기간 변경 시 재조회
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 30초 자동 갱신
  useEffect(() => {
    const timer = setInterval(fetchData, 30_000);
    return () => clearInterval(timer);
  }, [fetchData]);

  return (
    <div className="rounded-xl bg-[#111111] border border-[#222] overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222]">
        <div>
          <h3 className="text-lg font-semibold text-white">Developer Leaderboard</h3>
          {lastUpdated && (
            <p className="text-xs text-neutral-600 mt-0.5">Updated {lastUpdated}</p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* 기간 필터 */}
          <div className="flex rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-1 gap-1">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === p
                    ? "bg-white text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          {/* Cost / Tokens 토글 */}
          <div className="flex rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-1 gap-1">
            <button
              onClick={() => setMetric("cost")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                metric === "cost"
                  ? "bg-[#E8FF47] text-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Cost
            </button>
            <button
              onClick={() => setMetric("tokens")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                metric === "tokens"
                  ? "bg-[#E8FF47] text-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Tokens
            </button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e1e]">
              <th className="px-4 py-3 text-left text-xs text-neutral-600 font-medium w-10">#</th>
              <th className="px-4 py-3 text-left text-xs text-neutral-600 font-medium">DEVELOPER</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">INPUT</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">OUTPUT</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">CACHE W</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">CACHE R</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">TOTAL</th>
              <th className="px-4 py-3 text-right text-xs text-neutral-600 font-medium">
                {metric === "cost" ? "COST" : "TOKENS"}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-neutral-600 text-sm">
                  불러오는 중...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-neutral-600 text-sm">
                  데이터 없음
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.name}
                  className="border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors"
                >
                  {/* 순위 */}
                  <td className="px-4 py-4 text-neutral-500 text-sm font-mono">
                    {i < 3 ? (
                      <span>{MEDAL[i]}</span>
                    ) : (
                      <span className="text-neutral-600">{i + 1}</span>
                    )}
                  </td>

                  {/* 개발자 */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                      >
                        {row.initial}
                      </div>
                      <span className="font-medium text-white">{row.name}</span>
                    </div>
                  </td>

                  {/* 토큰 컬럼 */}
                  <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">
                    {fmt(row.input)}
                  </td>
                  <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">
                    {fmt(row.output)}
                  </td>
                  <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">
                    {fmt(row.cacheWrite)}
                  </td>
                  <td className="px-4 py-4 text-right text-neutral-400 font-mono text-sm">
                    {fmt(row.cacheRead)}
                  </td>
                  <td className="px-4 py-4 text-right text-white font-mono text-sm font-medium">
                    {fmt(row.total)}
                  </td>

                  {/* Cost 또는 Tokens */}
                  <td className="px-4 py-4 text-right font-mono text-sm font-bold text-[#E8FF47]">
                    {metric === "cost"
                      ? `$${row.cost.toFixed(2)}`
                      : fmt(row.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 푸터 */}
      {rows.length > 0 && (
        <div className="px-6 py-3 border-t border-[#1a1a1a] flex justify-between text-xs text-neutral-600">
          <span>{rows.length}명 · {PERIOD_LABELS[period]}</span>
          <span>Auto-refresh: 30s</span>
        </div>
      )}
    </div>
  );
}

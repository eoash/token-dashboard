"use client";

import { useState, useEffect, useCallback } from "react";
import KpiCard from "@/components/cards/KpiCard";
import DailyUsageChart from "@/components/charts/DailyUsageChart";
import ModelPieChart from "@/components/charts/ModelPieChart";
import { TEAM_MEMBERS, EMAIL_TO_NAME, getModelLabel, getModelColor } from "@/lib/constants";
import { formatTokens, formatDollars, formatPercent } from "@/lib/utils";
import type { ClaudeCodeDataPoint } from "@/lib/types";

interface MemberData {
  totalTokens: number;
  totalCost: number;
  sessions: number;
  linesOfCode: number;
  commits: number;
  pullRequests: number;
  toolAcceptanceRate: number;
  daily: { date: string; input_tokens: number; output_tokens: number; cache_read_tokens: number }[];
  models: { name: string; value: number; color: string }[];
}

function aggregateMember(data: ClaudeCodeDataPoint[], email: string): MemberData {
  const filtered = data.filter((d) => d.actor?.email_address === email);

  let totalTokens = 0;
  let totalCost = 0;
  let sessions = 0;
  let linesOfCode = 0;
  let commits = 0;
  let pullRequests = 0;
  let toolAccSum = 0;
  let toolAccCount = 0;

  const dailyMap = new Map<string, { input: number; output: number; cache: number }>();
  const modelMap = new Map<string, number>();

  for (const d of filtered) {
    const tokens = d.input_tokens + d.output_tokens + d.cache_read_tokens;
    totalTokens += tokens;
    totalCost += d.estimated_cost_usd_cents;
    sessions += d.session_count;
    linesOfCode += d.lines_of_code;
    commits += d.commits;
    pullRequests += d.pull_requests;
    if (d.tool_acceptance_rate > 0) {
      toolAccSum += d.tool_acceptance_rate;
      toolAccCount++;
    }

    if (d.date) {
      const existing = dailyMap.get(d.date) ?? { input: 0, output: 0, cache: 0 };
      existing.input += d.input_tokens;
      existing.output += d.output_tokens;
      existing.cache += d.cache_read_tokens;
      dailyMap.set(d.date, existing);
    }

    if (d.model) {
      modelMap.set(d.model, (modelMap.get(d.model) ?? 0) + tokens);
    }
  }

  return {
    totalTokens,
    totalCost: totalCost / 100,
    sessions,
    linesOfCode,
    commits,
    pullRequests,
    toolAcceptanceRate: toolAccCount > 0 ? toolAccSum / toolAccCount : 0,
    daily: Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        input_tokens: v.input,
        output_tokens: v.output,
        cache_read_tokens: v.cache,
      })),
    models: Array.from(modelMap.entries())
      .map(([model, value]) => ({
        name: getModelLabel(model),
        value,
        color: getModelColor(model),
      }))
      .sort((a, b) => b.value - a.value),
  };
}

export default function TeamPage() {
  const [selectedEmail, setSelectedEmail] = useState(TEAM_MEMBERS[0]?.email ?? "");
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

  const memberData = aggregateMember(rawData, selectedEmail);
  const memberName = EMAIL_TO_NAME[selectedEmail] ?? selectedEmail;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Team</h1>
        <select
          value={selectedEmail}
          onChange={(e) => setSelectedEmail(e.target.value)}
          className="bg-[#111111] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#E8FF47]"
        >
          {TEAM_MEMBERS.map((m) => (
            <option key={m.email} value={m.email}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard title="Total Tokens" value={formatTokens(memberData.totalTokens)} />
            <KpiCard title="Cost" value={formatDollars(memberData.totalCost)} />
            <KpiCard title="Sessions" value={String(memberData.sessions)} />
            <KpiCard
              title="Tool Accept Rate"
              value={formatPercent(memberData.toolAcceptanceRate)}
            />
          </div>

          {/* Productivity */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <KpiCard
              title="Lines of Code"
              value={memberData.linesOfCode.toLocaleString()}
              subtitle={`by ${memberName}`}
            />
            <KpiCard
              title="Commits"
              value={String(memberData.commits)}
              subtitle={`by ${memberName}`}
            />
            <KpiCard
              title="Pull Requests"
              value={String(memberData.pullRequests)}
              subtitle={`by ${memberName}`}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DailyUsageChart data={memberData.daily} />
            </div>
            <div>
              <ModelPieChart data={memberData.models} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

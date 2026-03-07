"use client";

import { useState } from "react";
import KpiCard from "@/components/cards/KpiCard";
import DailyUsageChart from "@/components/charts/DailyUsageChart";
import ModelPieChart from "@/components/charts/ModelPieChart";
import { UNIQUE_MEMBERS } from "@/lib/constants";
import { formatTokens, formatDollars, formatPercent } from "@/lib/utils";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { aggregateMember } from "@/lib/aggregators/team";

export default function TeamPage() {
  const [selectedName, setSelectedName] = useState(UNIQUE_MEMBERS[0]?.name ?? "");
  const { data: rawData, loading, error } = useAnalytics(30);

  const memberData = aggregateMember(rawData, selectedName);
  const memberName = selectedName;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Team</h1>
        <select
          value={selectedName}
          onChange={(e) => setSelectedName(e.target.value)}
          className="bg-[#111111] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#E8FF47]"
        >
          {UNIQUE_MEMBERS.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

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

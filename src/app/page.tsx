"use client";

import KpiCard from "@/components/cards/KpiCard";
import DailyUsageChart from "@/components/charts/DailyUsageChart";
import ModelPieChart from "@/components/charts/ModelPieChart";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import DateRangePicker from "@/components/layout/DateRangePicker";
import { formatTokens, formatPercent } from "@/lib/utils";
import { aggregateOverview } from "@/lib/aggregators/overview";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useDateRange } from "@/lib/contexts/DateRangeContext";
import { useMemo } from "react";

export default function OverviewPage() {
  const { range } = useDateRange();
  const { data: rawData, loading, error } = useAnalytics();
  const overview = useMemo(() => aggregateOverview(rawData), [rawData]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Overview</h1>
        <DateRangePicker />
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
          {/* KPI Cards — Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KpiCard
              title="Total Tokens"
              value={formatTokens(overview.totalTokens)}
              subtitle="input + output + cache"
              tooltip="입력·출력·캐시를 포함한 전체 토큰 사용량. 팀 전체가 Claude에게 보내고 받은 텍스트의 총량입니다."
            />
            <KpiCard
              title="Cache Hit Rate"
              value={formatPercent(overview.cacheHitRate)}
              subtitle="cache reuse efficiency"
              tooltip="캐시된 프롬프트를 재활용한 비율. 높을수록 동일 컨텍스트 재전송이 줄어 응답이 빨라지고 비용 효율이 올라갑니다."
            />
            <KpiCard
              title="Active Users"
              value={String(overview.activeUsers)}
              subtitle="unique team members"
              tooltip="선택 기간 중 Claude를 1회 이상 사용한 팀원 수입니다."
            />
            <KpiCard
              title="Avg Daily Sessions"
              value={String(overview.avgDailySessions)}
              subtitle="sessions per day"
              tooltip="하루 평균 Claude 세션 수입니다."
            />
          </div>

          {/* KPI Cards — Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <KpiCard
              title="Total Commits"
              value={overview.totalCommits.toLocaleString()}
              subtitle="commits in period"
              tooltip="Claude 세션에서 발생한 Git 커밋 수입니다."
            />
            <KpiCard
              title="Pull Requests"
              value={overview.totalPRs.toLocaleString()}
              subtitle="PRs created"
              tooltip="Claude 세션에서 생성된 PR 수입니다."
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DailyUsageChart data={overview.daily} />
            </div>
            <div>
              <ModelPieChart data={overview.models} />
            </div>
          </div>

          {/* Leaderboard */}
          <div className="mt-6">
            <LeaderboardTable />
          </div>
        </>
      )}
    </div>
  );
}

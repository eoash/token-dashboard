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
              unavailable
              tooltip="하루 평균 Claude 세션 수. 현재 OTel 메트릭에서 세션 카운트를 지원하지 않아 추적 불가 상태입니다."
            />
          </div>

          {/* KPI Cards — Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard
              title="Accepted Lines"
              value={overview.totalLines.toLocaleString()}
              subtitle="lines of code accepted"
              unavailable
              tooltip="Claude가 제안한 코드 중 팀원이 실제로 수락한 라인 수. 현재 미추적 상태입니다."
            />
            <KpiCard
              title="Acceptance Rate"
              value={`${(overview.avgAcceptanceRate * 100).toFixed(1)}%`}
              subtitle="tool suggestion accepted"
              unavailable
              tooltip="Claude의 도구 호출(편집·생성 등) 중 팀원이 승인한 비율. 현재 미추적 상태입니다."
            />
            <KpiCard
              title="Total Commits"
              value={overview.totalCommits.toLocaleString()}
              subtitle="commits in period"
              unavailable
              tooltip="Claude 세션에서 발생한 Git 커밋 수. 현재 미추적 상태입니다."
            />
            <KpiCard
              title="Pull Requests"
              value={overview.totalPRs.toLocaleString()}
              subtitle="PRs merged"
              unavailable
              tooltip="Claude 지원으로 머지된 PR 수. 현재 미추적 상태입니다."
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

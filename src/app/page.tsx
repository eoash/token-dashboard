import KpiCard from "@/components/cards/KpiCard";
import DailyUsageChart from "@/components/charts/DailyUsageChart";
import ModelPieChart from "@/components/charts/ModelPieChart";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { formatTokens, formatPercent } from "@/lib/utils";
import { aggregateOverview } from "@/lib/aggregators/overview";
import { fetchAnalytics, getDataSource } from "@/lib/data-source";
import { getDateRange } from "@/lib/utils";

async function fetchData() {
  try {
    const { start, end } = getDateRange(30);
    return await fetchAnalytics({
      start_date: start,
      end_date: end,
      group_by: ["actor", "model", "date"],
    });
  } catch (error) {
    console.error("[OverviewPage] fetchAnalytics failed:", error);
    return null;
  }
}

export default async function OverviewPage() {
  const source = getDataSource();
  const analytics = await fetchData();

  if (!analytics) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2">Overview</h1>
        <div className="rounded-xl bg-[#111111] border border-[#222] p-8 text-center">
          <p className="text-gray-400 mb-2">데이터를 불러올 수 없습니다</p>
          <p className="text-sm text-gray-600">
            서버 재시작 후 다시 시도해주세요
          </p>
        </div>
      </div>
    );
  }

  const overview = aggregateOverview(analytics.data);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Overview</h1>
        <span className="text-xs text-gray-500">Last 30 days</span>
      </div>

      {/* Data source 배너 */}
      {source !== "prometheus" && (
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 flex items-center gap-3">
          <span className="text-yellow-400 text-sm font-medium">Mock Mode</span>
          <span className="text-yellow-500/70 text-xs">
            샘플 데이터 표시 중 — PROMETHEUS_URL 설정 후 OTel 데이터를 확인하세요
          </span>
        </div>
      )}

      {/* KPI Cards — Row 1: 사용량·비용 */}
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
          tooltip="최근 30일간 Claude를 1회 이상 사용한 팀원 수입니다."
        />
        <KpiCard
          title="Avg Daily Sessions"
          value={String(overview.avgDailySessions)}
          subtitle="sessions per day"
          unavailable
          tooltip="하루 평균 Claude 세션 수. 현재 OTel 메트릭에서 세션 카운트를 지원하지 않아 추적 불가 상태입니다."
        />
      </div>

      {/* KPI Cards — Row 2: 생산성 */}
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
    </div>
  );
}

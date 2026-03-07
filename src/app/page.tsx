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
        />
        <KpiCard
          title="Cache Hit Rate"
          value={formatPercent(overview.cacheHitRate)}
          subtitle="cache reuse efficiency"
        />
        <KpiCard
          title="Active Users"
          value={String(overview.activeUsers)}
          subtitle="unique team members"
        />
        <KpiCard
          title="Avg Daily Sessions"
          value={String(overview.avgDailySessions)}
          subtitle="sessions per day"
          unavailable
        />
      </div>

      {/* KPI Cards — Row 2: 생산성 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Accepted Lines"
          value={overview.totalLines.toLocaleString()}
          subtitle="lines of code accepted"
          unavailable
        />
        <KpiCard
          title="Acceptance Rate"
          value={`${(overview.avgAcceptanceRate * 100).toFixed(1)}%`}
          subtitle="tool suggestion accepted"
          unavailable
        />
        <KpiCard
          title="Total Commits"
          value={overview.totalCommits.toLocaleString()}
          subtitle="commits in period"
          unavailable
        />
        <KpiCard
          title="Pull Requests"
          value={overview.totalPRs.toLocaleString()}
          subtitle="PRs merged"
          unavailable
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

import KpiCard from "@/components/cards/KpiCard";
import DailyUsageChart from "@/components/charts/DailyUsageChart";
import ModelPieChart from "@/components/charts/ModelPieChart";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { formatTokens, formatDollars } from "@/lib/utils";
import { EMAIL_TO_NAME, getModelLabel, getModelColor } from "@/lib/constants";
import { fetchClaudeCodeAnalytics } from "@/lib/anthropic-admin";
import type { ClaudeCodeAnalyticsResponse, ClaudeCodeDataPoint } from "@/lib/types";
import { getDateRange } from "@/lib/utils";

async function fetchAnalytics(): Promise<ClaudeCodeAnalyticsResponse | null> {
  try {
    const { start, end } = getDateRange(30);
    return await fetchClaudeCodeAnalytics({
      start_date: start,
      end_date: end,
      group_by: ["actor", "model", "date"],
    });
  } catch {
    return null;
  }
}

function aggregateOverview(data: ClaudeCodeDataPoint[]) {
  let totalTokens = 0;
  let totalCostCents = 0;
  let totalSessions = 0;
  let totalLines = 0;
  let totalCommits = 0;
  let totalPRs = 0;
  let acceptanceRateSum = 0;
  let acceptanceRateCount = 0;
  const userSet = new Set<string>();
  const dailyMap = new Map<string, { input: number; output: number; cache: number; cost: number; sessions: number }>();
  const memberMap = new Map<string, { tokens: number; cost: number; lines: number; commits: number; prs: number; acceptanceSum: number; acceptanceCount: number }>();
  const modelMap = new Map<string, number>();

  for (const d of data) {
    const tokens = d.input_tokens + d.output_tokens + d.cache_read_tokens;
    totalTokens += tokens;
    totalCostCents += d.estimated_cost_usd_cents;
    totalSessions += d.session_count;
    totalLines += d.lines_of_code ?? 0;
    totalCommits += d.commits ?? 0;
    totalPRs += d.pull_requests ?? 0;
    if (d.tool_acceptance_rate != null) {
      acceptanceRateSum += d.tool_acceptance_rate * d.session_count;
      acceptanceRateCount += d.session_count;
    }

    if (d.actor?.email_address) userSet.add(d.actor.email_address);

    if (d.date) {
      const existing = dailyMap.get(d.date) ?? { input: 0, output: 0, cache: 0, cost: 0, sessions: 0 };
      existing.input += d.input_tokens;
      existing.output += d.output_tokens;
      existing.cache += d.cache_read_tokens;
      existing.cost += d.estimated_cost_usd_cents;
      existing.sessions += d.session_count;
      dailyMap.set(d.date, existing);
    }

    if (d.actor?.email_address) {
      const name = EMAIL_TO_NAME[d.actor.email_address] ?? d.actor.email_address;
      const existing = memberMap.get(name) ?? { tokens: 0, cost: 0, lines: 0, commits: 0, prs: 0, acceptanceSum: 0, acceptanceCount: 0 };
      existing.tokens += tokens;
      existing.cost += d.estimated_cost_usd_cents / 100;
      existing.lines += d.lines_of_code ?? 0;
      existing.commits += d.commits ?? 0;
      existing.prs += d.pull_requests ?? 0;
      if (d.tool_acceptance_rate != null) {
        existing.acceptanceSum += d.tool_acceptance_rate * d.session_count;
        existing.acceptanceCount += d.session_count;
      }
      memberMap.set(name, existing);
    }

    if (d.model) {
      modelMap.set(d.model, (modelMap.get(d.model) ?? 0) + tokens);
    }
  }

  const days = dailyMap.size || 1;
  const avgAcceptanceRate = acceptanceRateCount > 0 ? acceptanceRateSum / acceptanceRateCount : 0;

  return {
    totalTokens,
    totalCostUsd: totalCostCents / 100,
    activeUsers: userSet.size,
    avgDailySessions: Math.round(totalSessions / days),
    totalLines,
    totalCommits,
    totalPRs,
    avgAcceptanceRate,
    daily: Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        input_tokens: v.input,
        output_tokens: v.output,
        cache_read_tokens: v.cache,
      })),
    members: Array.from(memberMap.entries())
      .map(([name, v]) => ({
        name,
        tokens: v.tokens,
        cost: v.cost,
        lines: v.lines,
        commits: v.commits,
        prs: v.prs,
        acceptanceRate: v.acceptanceCount > 0 ? v.acceptanceSum / v.acceptanceCount : 0,
      }))
      .sort((a, b) => b.tokens - a.tokens),
    models: Array.from(modelMap.entries())
      .map(([model, value]) => ({
        name: getModelLabel(model),
        value,
        color: getModelColor(model),
      }))
      .sort((a, b) => b.value - a.value),
  };
}

export default async function OverviewPage() {
  const isMock = !process.env.ANTHROPIC_ADMIN_API_KEY;
  const analytics = await fetchAnalytics();

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

      {/* Mock 모드 배너 */}
      {isMock && (
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 flex items-center gap-3">
          <span className="text-yellow-400 text-sm font-medium">Mock Mode</span>
          <span className="text-yellow-500/70 text-xs">샘플 데이터로 표시 중 — ANTHROPIC_ADMIN_API_KEY 설정 후 실제 데이터를 확인하세요</span>
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
          title="Total Cost"
          value={formatDollars(overview.totalCostUsd)}
          subtitle="estimated USD"
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
        />
      </div>

      {/* KPI Cards — Row 2: 생산성 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Accepted Lines"
          value={overview.totalLines.toLocaleString()}
          subtitle="lines of code accepted"
        />
        <KpiCard
          title="Acceptance Rate"
          value={`${(overview.avgAcceptanceRate * 100).toFixed(1)}%`}
          subtitle="tool suggestion accepted"
        />
        <KpiCard
          title="Total Commits"
          value={overview.totalCommits.toLocaleString()}
          subtitle="commits in period"
        />
        <KpiCard
          title="Pull Requests"
          value={overview.totalPRs.toLocaleString()}
          subtitle="PRs merged"
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

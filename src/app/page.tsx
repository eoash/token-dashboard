import KpiCard from "@/components/cards/KpiCard";
import DailyUsageChart from "@/components/charts/DailyUsageChart";
import TeamBarChart from "@/components/charts/TeamBarChart";
import ModelPieChart from "@/components/charts/ModelPieChart";
import { formatTokens, formatDollars } from "@/lib/utils";
import { EMAIL_TO_NAME, getModelLabel, getModelColor } from "@/lib/constants";
import type { ClaudeCodeAnalyticsResponse, ClaudeCodeDataPoint } from "@/lib/types";

async function fetchAnalytics(): Promise<ClaudeCodeAnalyticsResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/analytics?days=30`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function aggregateOverview(data: ClaudeCodeDataPoint[]) {
  let totalTokens = 0;
  let totalCostCents = 0;
  let totalSessions = 0;
  const userSet = new Set<string>();
  const dailyMap = new Map<string, { input: number; output: number; cache: number; cost: number; sessions: number }>();
  const memberMap = new Map<string, { tokens: number; cost: number }>();
  const modelMap = new Map<string, number>();

  for (const d of data) {
    const tokens = d.input_tokens + d.output_tokens + d.cache_read_tokens;
    totalTokens += tokens;
    totalCostCents += d.estimated_cost_usd_cents;
    totalSessions += d.session_count;

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
      const existing = memberMap.get(name) ?? { tokens: 0, cost: 0 };
      existing.tokens += tokens;
      existing.cost += d.estimated_cost_usd_cents / 100;
      memberMap.set(name, existing);
    }

    if (d.model) {
      modelMap.set(d.model, (modelMap.get(d.model) ?? 0) + tokens);
    }
  }

  const days = dailyMap.size || 1;

  return {
    totalTokens,
    totalCostUsd: totalCostCents / 100,
    activeUsers: userSet.size,
    avgDailySessions: Math.round(totalSessions / days),
    daily: Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        input_tokens: v.input,
        output_tokens: v.output,
        cache_read_tokens: v.cache,
      })),
    members: Array.from(memberMap.entries())
      .map(([name, v]) => ({ name, tokens: v.tokens, cost: v.cost }))
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
  const analytics = await fetchAnalytics();

  if (!analytics) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2">Overview</h1>
        <div className="rounded-xl bg-[#111111] border border-[#222] p-8 text-center">
          <p className="text-gray-400 mb-2">API 연결을 확인해주세요</p>
          <p className="text-sm text-gray-600">
            .env.local에 ANTHROPIC_ADMIN_API_KEY를 설정하고 서버를 재시작하세요
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DailyUsageChart data={overview.daily} />
        </div>
        <div>
          <ModelPieChart data={overview.models} />
        </div>
      </div>

      <div className="mt-6">
        <TeamBarChart data={overview.members} />
      </div>
    </div>
  );
}

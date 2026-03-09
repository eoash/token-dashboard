"use client";

import KpiCard from "@/components/cards/KpiCard";
import DailyUsageChart from "@/components/charts/DailyUsageChart";
import ModelPieChart from "@/components/charts/ModelPieChart";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import DateRangePicker from "@/components/layout/DateRangePicker";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import WeeklyChampions from "@/components/cards/WeeklyChampions";
import { formatTokens, formatPercent } from "@/lib/utils";
import { aggregateOverview } from "@/lib/aggregators/overview";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useDateRange } from "@/lib/contexts/DateRangeContext";
import { useT } from "@/lib/contexts/LanguageContext";
import { useMemo } from "react";

export default function OverviewPage() {
  const { t } = useT();
  const { range } = useDateRange();
  const { data: rawData, loading, error } = useAnalytics();
  const overview = useMemo(() => aggregateOverview(rawData), [rawData]);

  return (
    <div>
      <AnnouncementBanner />

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">{t("nav.overview")}</h1>
        <DateRangePicker />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-center py-12">{t("common.loading")}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
            <KpiCard title={t("kpi.totalTokens")} value={formatTokens(overview.totalTokens)} subtitle={t("kpi.totalTokens.sub")} tooltip={t("kpi.totalTokens.tip")} />
            <KpiCard title={t("kpi.cacheHitRate")} value={formatPercent(overview.cacheHitRate)} subtitle={t("kpi.cacheHitRate.sub")} tooltip={t("kpi.cacheHitRate.tip")} />
            <KpiCard title={t("kpi.activeUsers")} value={String(overview.activeUsers)} subtitle={t("kpi.activeUsers.sub")} tooltip={t("kpi.activeUsers.tip")} />
            <KpiCard title={t("kpi.avgDailySessions")} value={String(overview.avgDailySessions)} subtitle={t("kpi.avgDailySessions.sub")} tooltip={t("kpi.avgDailySessions.tip")} />
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
            <KpiCard title={t("kpi.totalCommits")} value={overview.totalCommits.toLocaleString()} subtitle={t("kpi.totalCommits.sub")} tooltip={t("kpi.totalCommits.tip")} />
            <KpiCard title={t("kpi.pullRequests")} value={overview.totalPRs.toLocaleString()} subtitle={t("kpi.pullRequests.sub")} tooltip={t("kpi.pullRequests.tip")} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DailyUsageChart data={overview.daily} />
            </div>
            <div>
              <ModelPieChart data={overview.models} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <LeaderboardTable />
            </div>
            <div>
              <WeeklyChampions data={rawData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

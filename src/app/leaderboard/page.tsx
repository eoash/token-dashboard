"use client";

import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { useT } from "@/lib/contexts/LanguageContext";

export default function LeaderboardPage() {
  const { t } = useT();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("nav.leaderboard")}</h1>
      </div>
      <LeaderboardTable />
    </div>
  );
}

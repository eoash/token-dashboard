"use client";

import { useMemo } from "react";
import type { UserProfile } from "@/lib/gamification";
import type { ClaudeCodeDataPoint } from "@/lib/types";
import { resolveActorName } from "@/lib/constants";
import { formatTokens } from "@/lib/utils";
import { useT } from "@/lib/contexts/LanguageContext";

interface Props {
  profile: UserProfile;
  data: ClaudeCodeDataPoint[];
}

export default function WeeklySummary({ profile, data }: Props) {
  const { locale } = useT();
  const isKo = locale === "ko";

  const kpis = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    // Filter data for this user, last 7 days
    const userPoints = data.filter((d) => {
      const email = (d.actor.email_address ?? d.actor.id).toLowerCase();
      const isUser =
        resolveActorName(d.actor) === profile.name || email === profile.email;
      return isUser && d.date >= cutoffStr;
    });

    // 1. Weekly tokens (input + output + cache)
    let weeklyTokens = 0;
    const activeDates = new Set<string>();
    for (const d of userPoints) {
      weeklyTokens += d.input_tokens + d.output_tokens;
      activeDates.add(d.date);
    }

    // 2. Active days
    const activeDayCount = activeDates.size;

    // 3. Achievements (total earned)
    const achievementCount = profile.earnedAchievements.length;

    // 4. Level + progress
    const levelStr = `Lv.${profile.level.level}`;
    const progressStr = `${profile.progressPercent}%`;

    return { weeklyTokens, activeDayCount, achievementCount, levelStr, progressStr };
  }, [profile, data]);

  return (
    <div className="rounded-xl border border-[#222] bg-[#111111] p-5">
      <h2 className="text-base font-semibold text-white mb-3">
        {isKo ? "\u{1F4CA} \uC774\uBC88 \uC8FC" : "\u{1F4CA} This Week"}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Weekly Tokens */}
        <div className="bg-[#0A0A0A] rounded-lg px-3 py-3 text-center">
          <div className="text-base font-mono text-white">
            {formatTokens(kpis.weeklyTokens)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {isKo ? "\uC8FC\uAC04 \uD1A0\uD070" : "Weekly Tokens"}
          </div>
        </div>

        {/* Active Days */}
        <div className="bg-[#0A0A0A] rounded-lg px-3 py-3 text-center">
          <div className="text-base font-mono text-white">
            {kpis.activeDayCount}/7{isKo ? "\uC77C" : "d"}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {isKo ? "\uD65C\uB3D9\uC77C" : "Active Days"}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-[#0A0A0A] rounded-lg px-3 py-3 text-center">
          <div className="text-base font-mono text-white">
            {"\u{1F3C6}"} {kpis.achievementCount}{isKo ? "\uAC1C" : ""}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {isKo ? "\uC5C5\uC801" : "Achievements"}
          </div>
        </div>

        {/* Level */}
        <div className="bg-[#0A0A0A] rounded-lg px-3 py-3 text-center">
          <div className="text-base font-mono text-white">
            {kpis.levelStr} {"\u2192"} {kpis.progressStr}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {isKo ? "\uB808\uBCA8" : "Level"}
          </div>
        </div>
      </div>

      <p className="text-xs font-mono text-gray-600 mt-3">
        [LOG] Weekly activity summary compiled.
      </p>
    </div>
  );
}

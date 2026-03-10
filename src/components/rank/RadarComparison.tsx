"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { UserProfile } from "@/lib/gamification";
import { useT } from "@/lib/contexts/LanguageContext";
import { useMemo } from "react";

interface Props {
  profile: UserProfile;
  allProfiles: UserProfile[];
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export default function RadarComparison({ profile, allProfiles }: Props) {
  const { locale } = useT();
  const isKo = locale === "ko";

  const { chartData, aboveAvgCount } = useMemo(() => {
    const teamAvg = {
      tokens: avg(allProfiles.map((p) => p.totalTokens)),
      activeDays: avg(allProfiles.map((p) => p.activeDays)),
      commits: avg(allProfiles.map((p) => p.totalCommits)),
      streak: avg(allProfiles.map((p) => p.currentStreak)),
      achievements: avg(allProfiles.map((p) => p.earnedAchievements.length)),
    };

    const maxVals = {
      tokens: Math.max(...allProfiles.map((p) => p.totalTokens)) || 1,
      activeDays: Math.max(...allProfiles.map((p) => p.activeDays)) || 1,
      commits: Math.max(...allProfiles.map((p) => p.totalCommits)) || 1,
      streak: Math.max(...allProfiles.map((p) => p.currentStreak)) || 1,
      achievements:
        Math.max(...allProfiles.map((p) => p.earnedAchievements.length)) || 1,
    };

    const axes: {
      key: keyof typeof teamAvg;
      labelKo: string;
      labelEn: string;
      userVal: number;
    }[] = [
      {
        key: "tokens",
        labelKo: "토큰",
        labelEn: "Tokens",
        userVal: profile.totalTokens,
      },
      {
        key: "activeDays",
        labelKo: "활동일",
        labelEn: "Active Days",
        userVal: profile.activeDays,
      },
      {
        key: "commits",
        labelKo: "커밋",
        labelEn: "Commits",
        userVal: profile.totalCommits,
      },
      {
        key: "streak",
        labelKo: "스트릭",
        labelEn: "Streak",
        userVal: profile.currentStreak,
      },
      {
        key: "achievements",
        labelKo: "업적",
        labelEn: "Achievements",
        userVal: profile.earnedAchievements.length,
      },
    ];

    let aboveCount = 0;
    const data = axes.map((axis) => {
      const userNorm = (axis.userVal / maxVals[axis.key]) * 100;
      const avgNorm = (teamAvg[axis.key] / maxVals[axis.key]) * 100;
      if (axis.userVal > teamAvg[axis.key]) aboveCount++;
      return {
        axis: isKo ? axis.labelKo : axis.labelEn,
        user: Math.round(userNorm),
        avg: Math.round(avgNorm),
      };
    });

    return { chartData: data, aboveAvgCount: aboveCount };
  }, [profile, allProfiles, isKo]);

  const userColor = profile.level.color[0];

  return (
    <div className="rounded-xl border border-[#222] bg-[#111111] p-5">
      <h2 className="text-base font-semibold text-white mb-3">
        {isKo ? "🛰️ 탐사 프로필" : "🛰️ Exploration Profile"}
      </h2>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: userColor, opacity: 0.6 }}
          />
          <span className="text-xs text-gray-400">
            {isKo ? "나" : "You"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm border border-dashed"
            style={{ borderColor: "#666", backgroundColor: "transparent" }}
          />
          <span className="text-xs text-gray-400">
            {isKo ? "팀 평균" : "Team Avg"}
          </span>
        </div>
      </div>

      <div style={{ width: "100%", height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="#222" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "#666", fontSize: 11 }}
            />
            <Radar
              name="Team Avg"
              dataKey="avg"
              stroke="#666"
              fill="#666"
              fillOpacity={0.1}
              strokeDasharray="4 4"
            />
            <Radar
              name={profile.name}
              dataKey="user"
              stroke={userColor}
              fill={userColor}
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Axis descriptions */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 px-1">
        {[
          { labelKo: "토큰", labelEn: "Tokens", descKo: "총 사용 토큰", descEn: "Total tokens used" },
          { labelKo: "활동일", labelEn: "Active Days", descKo: "AI 사용한 날 수", descEn: "Days with AI usage" },
          { labelKo: "커밋", labelEn: "Commits", descKo: "Git 커밋 수", descEn: "Git commits made" },
          { labelKo: "스트릭", labelEn: "Streak", descKo: "연속 활동일", descEn: "Consecutive active days" },
          { labelKo: "업적", labelEn: "Achievements", descKo: "획득한 업적 수", descEn: "Achievements earned" },
        ].map((item) => (
          <p key={item.labelEn} className="text-[10px] text-gray-600">
            <span className="text-gray-500">{isKo ? item.labelKo : item.labelEn}</span>
            {" — "}
            {isKo ? item.descKo : item.descEn}
          </p>
        ))}
      </div>

      <p
        className="text-xs text-gray-500 mt-3 font-mono"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        [LOG] Above average in {aboveAvgCount}/5 dimensions.
      </p>
    </div>
  );
}

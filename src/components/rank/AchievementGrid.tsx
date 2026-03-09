"use client";

import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from "@/lib/gamification";
import { useT } from "@/lib/contexts/LanguageContext";

interface Props {
  earnedAchievements: string[];
}

export default function AchievementGrid({ earnedAchievements }: Props) {
  const { locale } = useT();
  const isKo = locale === "ko";
  const earnedSet = new Set(earnedAchievements);

  return (
    <div className="rounded-xl border border-[#222] bg-[#111111] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">
          {isKo ? "미션 로그" : "Mission Log"}
        </h2>
        <span className="text-xs font-mono text-gray-400">
          {earnedAchievements.length}/{ACHIEVEMENTS.length}
        </span>
      </div>

      <div className="space-y-5">
        {ACHIEVEMENT_CATEGORIES.map((cat) => {
          const items = ACHIEVEMENTS.filter((a) => a.category === cat.key);
          if (items.length === 0) return null;

          return (
            <div key={cat.key}>
              <h3 className="text-xs font-medium text-gray-500 mb-2">
                {isKo ? cat.labelKo : cat.labelEn}
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map((a) => {
                  const earned = earnedSet.has(a.id);
                  return (
                    <div
                      key={a.id}
                      className="group relative"
                    >
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          earned
                            ? "bg-[#E8FF47]/[0.07] border border-[#E8FF47]/20 text-white"
                            : "bg-[#0A0A0A] border border-[#1a1a1a] text-gray-600"
                        }`}
                      >
                        <span className={earned ? "" : "grayscale opacity-40"}>
                          {earned ? a.icon : "?"}
                        </span>
                        <span className={earned ? "font-medium" : ""}>
                          {earned ? a.name : "???"}
                        </span>
                      </div>
                      {/* Tooltip */}
                      <div className="invisible group-hover:visible group-focus-within:visible absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-[#222] border border-[#333] rounded-lg text-xs text-gray-300 whitespace-nowrap pointer-events-none">
                        {earned
                          ? `${a.icon} ${a.name} — ${isKo ? a.conditionKo : a.conditionEn}`
                          : isKo ? "조건을 달성하면 해금됩니다" : "Complete the condition to unlock"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

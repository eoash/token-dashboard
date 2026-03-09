"use client";

import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, getAchievementProgress } from "@/lib/gamification";
import type { UserProfile } from "@/lib/gamification";
import { useT } from "@/lib/contexts/LanguageContext";

interface Props {
  earnedAchievements: string[];
  profile: UserProfile;
}

export default function AchievementGrid({ earnedAchievements, profile }: Props) {
  const { locale } = useT();
  const isKo = locale === "ko";
  const earnedSet = new Set(earnedAchievements);

  return (
    <div className="rounded-xl border border-[#222] bg-[#111111] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">
          {isKo ? "탐사 기록" : "Field Records"}
        </h2>
        <span className="text-sm font-mono text-gray-400">
          {earnedAchievements.length}/{ACHIEVEMENTS.length}
        </span>
      </div>

      <div className="space-y-5">
        {ACHIEVEMENT_CATEGORIES.map((cat) => {
          const items = ACHIEVEMENTS.filter((a) => a.category === cat.key);
          if (items.length === 0) return null;
          const earnedInCat = items.filter((a) => earnedSet.has(a.id)).length;

          return (
            <div key={cat.key}>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {isKo ? cat.labelKo : cat.labelEn}{" "}
                <span className="text-gray-600 font-mono text-xs">({earnedInCat}/{items.length})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map((a) => {
                  const earned = earnedSet.has(a.id);
                  const progress = !earned ? getAchievementProgress(a.id, profile) : null;
                  const hinted = progress && progress.percent >= 30;

                  return (
                    <div key={a.id} className="group relative" tabIndex={0}>
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          earned
                            ? "bg-[#00E87A]/[0.07] border border-[#00E87A]/20 text-white"
                            : hinted
                              ? "bg-[#1a1a1a] border border-[#333] text-gray-400"
                              : "bg-[#0A0A0A] border border-[#1a1a1a] text-gray-600"
                        }`}
                      >
                        <span className={earned ? "" : hinted ? "opacity-70" : "grayscale opacity-40"}>
                          {earned || hinted ? a.icon : "?"}
                        </span>
                        <div className="flex flex-col">
                          <span className={earned ? "font-medium" : ""}>
                            {earned || hinted ? a.name : "???"}
                          </span>
                          {/* Progress bar for hinted achievements */}
                          {hinted && progress && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="w-16 h-1 bg-[#222] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gray-500 rounded-full"
                                  style={{ width: `${progress.percent}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-gray-500">
                                {progress.current}/{progress.target}
                              </span>
                            </div>
                          )}
                          {/* Earned checkmark */}
                          {earned && (
                            <span className="text-[10px] text-[#00E87A]">✓ {isKo ? "획득" : "Earned"}</span>
                          )}
                        </div>
                      </div>
                      {/* Tooltip */}
                      <div className="invisible group-hover:visible group-focus-within:visible absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-[#222] border border-[#333] rounded-lg text-xs text-gray-300 whitespace-nowrap pointer-events-none">
                        {earned
                          ? `${a.icon} ${a.name} — ${isKo ? a.conditionKo : a.conditionEn}`
                          : hinted
                            ? `${a.icon} ${a.name} — ${progress!.current}/${progress!.target}`
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

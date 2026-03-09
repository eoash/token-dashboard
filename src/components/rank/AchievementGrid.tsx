"use client";

import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  getAchievementProgress,
  getAchievementRarity,
  RARITY_COLORS,
} from "@/lib/gamification";
import type { UserProfile, Rarity } from "@/lib/gamification";
import { useT } from "@/lib/contexts/LanguageContext";

interface Props {
  earnedAchievements: string[];
  profile: UserProfile;
  allProfiles: UserProfile[];
}

const RARITY_LABEL: Record<Rarity, string> = {
  common: "",
  rare: "RARE",
  epic: "EPIC",
  legendary: "LEGENDARY",
};

export default function AchievementGrid({ earnedAchievements, profile, allProfiles }: Props) {
  const { locale } = useT();
  const isKo = locale === "ko";
  const earnedSet = new Set(earnedAchievements);

  const totalAchievements = ACHIEVEMENTS.length;
  const earnedCount = earnedAchievements.length;
  const remainCount = totalAchievements - earnedCount;
  const overallPercent = Math.round((earnedCount / totalAchievements) * 100);

  // Find next closest achievement (highest progress among unearned)
  const nextAchievement = ACHIEVEMENTS.filter((a) => !earnedSet.has(a.id))
    .map((a) => ({ achievement: a, progress: getAchievementProgress(a.id, profile) }))
    .filter((x) => x.progress !== null)
    .sort((a, b) => b.progress!.percent - a.progress!.percent)[0] ?? null;

  return (
    <div className="rounded-xl border border-[#222] bg-[#111111] p-5 space-y-5">
      {/* ── Summary Section ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">
            {isKo ? "탐사 기록" : "Field Records"}
          </h2>
          <span className="text-sm font-mono text-gray-400">
            {earnedCount}/{totalAchievements}
          </span>
        </div>

        {/* Dot Map */}
        <div className="flex flex-wrap gap-1 mb-3">
          {ACHIEVEMENTS.map((a) => (
            <span
              key={a.id}
              className="inline-block w-2 h-2 rounded-full"
              style={{
                backgroundColor: earnedSet.has(a.id) ? "#00E87A" : "#333",
              }}
            />
          ))}
          <span className="ml-2 text-xs font-mono text-gray-500">({overallPercent}%)</span>
        </div>

        {/* Next achievable */}
        {nextAchievement && nextAchievement.progress && (
          <p className="text-xs text-gray-400 mb-1">
            <span className="text-gray-500">{"📍 "}</span>
            {isKo ? "다음 달성 가능" : "Next"}:{" "}
            <span className="text-white font-medium">
              &ldquo;{nextAchievement.achievement.name}&rdquo;
            </span>
            {" "}&#8212; {nextAchievement.progress.current}/{nextAchievement.progress.target}
          </p>
        )}

        {/* System log */}
        <p className="text-xs font-mono text-gray-600">
          [LOG] {earnedCount} field records documented. {remainCount} remain uncharted.
        </p>
      </div>

      {/* ── Category Sections ── */}
      <div className="space-y-5">
        {ACHIEVEMENT_CATEGORIES.map((cat) => {
          const items = ACHIEVEMENTS.filter((a) => a.category === cat.key);
          if (items.length === 0) return null;
          const earnedInCat = items.filter((a) => earnedSet.has(a.id)).length;
          const catPercent = Math.round((earnedInCat / items.length) * 100);
          const isComplete = earnedInCat === items.length;

          return (
            <div key={cat.key}>
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-medium text-gray-400 shrink-0">
                  {isKo ? cat.labelKo : cat.labelEn}
                </h3>
                {/* Progress bar */}
                <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${catPercent}%`,
                      backgroundColor: isComplete ? "#F59E0B" : "#00E87A",
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-500 shrink-0">
                  {earnedInCat}/{items.length}
                </span>
                {isComplete && (
                  <span className="text-xs font-mono text-[#F59E0B] shrink-0">
                    {"✦ COMPLETE"}
                  </span>
                )}
              </div>

              {/* Achievement Cards */}
              <div className="flex flex-wrap gap-2">
                {items.map((a) => {
                  const earned = earnedSet.has(a.id);
                  const progress = !earned ? getAchievementProgress(a.id, profile) : null;
                  const hinted = progress !== null && progress.percent >= 30;
                  const rarity = earned ? getAchievementRarity(a.id, allProfiles) : null;
                  const rarityColor = rarity ? RARITY_COLORS[rarity] : "";

                  return (
                    <div key={a.id} className="group relative" tabIndex={0}>
                      <div
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                        style={
                          earned
                            ? {
                                backgroundColor: rarityColor
                                  ? `${rarityColor}08`
                                  : "rgba(0, 232, 122, 0.07)",
                                border: `1px solid ${
                                  rarityColor
                                    ? `${rarityColor}${rarity === "common" ? "33" : "4D"}`
                                    : "rgba(0, 232, 122, 0.2)"
                                }`,
                                boxShadow:
                                  rarity === "epic"
                                    ? "0 0 12px rgba(168, 85, 247, 0.15)"
                                    : rarity === "legendary"
                                      ? "0 0 12px rgba(245, 158, 11, 0.2)"
                                      : "none",
                              }
                            : hinted
                              ? {
                                  backgroundColor: "#1a1a1a",
                                  border: `1px solid ${profile.level.color[0]}33`,
                                }
                              : {
                                  backgroundColor: "#0A0A0A",
                                  border: "1px solid #1a1a1a",
                                }
                        }
                      >
                        {/* Icon */}
                        <span
                          className={
                            earned
                              ? "text-lg"
                              : hinted
                                ? "opacity-70"
                                : "grayscale opacity-40"
                          }
                        >
                          {earned || hinted ? a.icon : "?"}
                        </span>

                        <div className="flex flex-col">
                          {/* Name */}
                          <span
                            className={
                              earned
                                ? "font-medium text-white"
                                : hinted
                                  ? "text-gray-400"
                                  : "text-gray-700"
                            }
                          >
                            {earned || hinted ? a.name : "???"}
                          </span>

                          {/* Hinted: progress bar */}
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

                          {/* Earned: check + date + rarity badge */}
                          {earned && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-[#00E87A]">
                                {"✓ "}
                                {profile.achievedAt[a.id]
                                  ? profile.achievedAt[a.id].slice(5).replace("-", "/")
                                  : isKo ? "획득" : "Earned"}
                              </span>
                              {rarity && rarity !== "common" && (
                                <span
                                  className="text-[9px] font-bold font-mono tracking-wider"
                                  style={{ color: rarityColor }}
                                >
                                  {RARITY_LABEL[rarity]}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tooltip */}
                      <div className="invisible group-hover:visible group-focus-within:visible absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-[#222] border border-[#333] rounded-lg text-xs text-gray-300 whitespace-nowrap pointer-events-none">
                        {earned
                          ? `${a.icon} ${a.name} — ${isKo ? a.conditionKo : a.conditionEn}`
                          : hinted
                            ? `${a.icon} ${a.name} — ${progress!.current}/${progress!.target}`
                            : isKo
                              ? "조건을 달성하면 해금됩니다"
                              : "Complete the condition to unlock"}
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

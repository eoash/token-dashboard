"use client";

import { useMemo, useState, useEffect } from "react";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { buildProfiles } from "@/lib/gamification";
import CharacterCard from "@/components/rank/CharacterCard";
import PartyRanking from "@/components/rank/PartyRanking";
import AchievementGrid from "@/components/rank/AchievementGrid";
import { useT } from "@/lib/contexts/LanguageContext";

const LS_KEY = "rank-selected-user";

export default function RankPage() {
  const { locale } = useT();
  const isKo = locale === "ko";
  const { data, loading, error } = useAnalytics();
  const profiles = useMemo(() => buildProfiles(data), [data]);

  const [selectedName, setSelectedName] = useState<string>("");

  // Restore last selection from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved && profiles.some((p) => p.name === saved)) {
      setSelectedName(saved);
    } else if (profiles.length > 0) {
      setSelectedName(profiles[0].name);
    }
  }, [profiles]);

  const handleSelect = (name: string) => {
    setSelectedName(name);
    localStorage.setItem(LS_KEY, name);
  };

  const selected = profiles.find((p) => p.name === selectedName) ?? profiles[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {isKo ? "불러오는 중..." : "Loading..."}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        {error}
      </div>
    );
  }

  if (!selected) return null;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          ⚔️ {isKo ? "모험가 길드" : "Adventurer's Guild"}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {isKo
            ? "AI 도구 사용량 기반 RPG 레벨 & 업적 시스템"
            : "RPG levels & achievements based on AI tool usage"}
        </p>
      </div>

      {/* User Selector (mobile) */}
      <div className="sm:hidden">
        <select
          value={selectedName}
          onChange={(e) => handleSelect(e.target.value)}
          className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white"
        >
          {profiles.map((p) => (
            <option key={p.email} value={p.name}>
              {p.level.icon} Lv.{p.level.level} {p.name} — XP {p.xp.toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {/* Character Card */}
      <CharacterCard profile={selected} />

      {/* Party Ranking */}
      <PartyRanking
        profiles={profiles}
        selectedName={selectedName}
        onSelect={handleSelect}
      />

      {/* Achievement Grid */}
      <AchievementGrid earnedAchievements={selected.earnedAchievements} />
    </div>
  );
}

"use client";

import { useMemo, useState, useEffect } from "react";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { buildProfiles } from "@/lib/gamification";
import JourneyMap from "@/components/rank/JourneyMap";
import CharacterCard from "@/components/rank/CharacterCard";
import RadarComparison from "@/components/rank/RadarComparison";
import PartyRanking from "@/components/rank/PartyRanking";
import AchievementGrid from "@/components/rank/AchievementGrid";
import ActivityTimeline from "@/components/rank/ActivityTimeline";
import WeeklySummary from "@/components/rank/WeeklySummary";
import { useT } from "@/lib/contexts/LanguageContext";

const LS_KEY = "rank-selected-user";

export default function RankPage() {
  const { locale } = useT();
  const isKo = locale === "ko";
  const { data, loading, error } = useAnalytics();
  const profiles = useMemo(() => buildProfiles(data), [data]);

  const [selectedName, setSelectedName] = useState<string>("");

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
        {isKo ? "불러오는 중\u2026" : "Loading\u2026"}
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
    <div
      className="space-y-4"
      style={{
        backgroundImage: "radial-gradient(circle, #1a1a1a 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          📡 {isKo ? "Explorer's Log" : "Explorer's Log"}
        </h1>
        <p className="text-sm font-mono text-gray-500 mt-1">
          [LOG] Monitoring {profiles.length} explorers in AI territory
        </p>
      </div>

      {/* Journey Map (Hero) */}
      <JourneyMap profile={selected} />

      {/* User Selector (mobile) */}
      <div className="sm:hidden">
        <select
          value={selectedName}
          onChange={(e) => handleSelect(e.target.value)}
          aria-label={isKo ? "탐험가 선택" : "Select explorer"}
          className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white"
        >
          {profiles.map((p) => (
            <option key={p.email} value={p.name}>
              {p.level.icon} Lv.{p.level.level} {p.name} — XP {p.xp.toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {/* CharacterCard + RadarComparison: 2-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CharacterCard profile={selected} />
        <RadarComparison profile={selected} allProfiles={profiles} />
      </div>

      {/* Weekly Summary */}
      <WeeklySummary profile={selected} data={data} />

      {/* Activity Timeline */}
      <ActivityTimeline profile={selected} data={data} />

      {/* Party Ranking */}
      <PartyRanking
        profiles={profiles}
        selectedName={selectedName}
        onSelect={handleSelect}
      />

      {/* Achievement Grid */}
      <AchievementGrid earnedAchievements={selected.earnedAchievements} profile={selected} allProfiles={profiles} />
    </div>
  );
}

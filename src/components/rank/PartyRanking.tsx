"use client";

import { useMemo } from "react";
import type { UserProfile } from "@/lib/gamification";
import { LEVELS } from "@/lib/gamification";
import { formatNumber, formatTokens } from "@/lib/utils";
import { useT } from "@/lib/contexts/LanguageContext";
import InfoTip from "@/components/InfoTip";

interface Props {
  profiles: UserProfile[];
  selectedName?: string;
  onSelect: (name: string) => void;
}

export default function PartyRanking({ profiles, selectedName, onSelect }: Props) {
  const { locale } = useT();
  const isKo = locale === "ko";

  const grouped = useMemo(() => {
    const map = new Map<number, UserProfile[]>();
    profiles.forEach((p) => {
      const lv = p.level.level;
      if (!map.has(lv)) map.set(lv, []);
      map.get(lv)!.push(p);
    });
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [profiles]);

  let rank = 0;

  const showGroupHeaders = grouped.length > 1;

  return (
    <div className="rounded-xl border border-[#222] bg-[#111111] p-5">
      <h2 className="text-base font-semibold text-white mb-3">
        {isKo ? "탐험대" : "Expedition"}
        {!showGroupHeaders && grouped.length === 1 && (
          <span className="ml-2 text-xs font-normal" style={{ color: LEVELS.find(l => l.level === grouped[0][0])?.color[0] ?? "#666" }}>
            {LEVELS.find(l => l.level === grouped[0][0])?.icon}{" "}
            {isKo
              ? LEVELS.find(l => l.level === grouped[0][0])?.titleKo
              : LEVELS.find(l => l.level === grouped[0][0])?.titleEn}
          </span>
        )}
      </h2>
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-base table-fixed" style={{ fontVariantNumeric: "tabular-nums" }}>
          <colgroup>
            <col className="w-8" />
            <col className="w-[35%]" />
            <col className="w-[30%] hidden sm:table-column" />
            <col className="w-16" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr className="text-gray-500 text-xs border-b border-[#222]">
              <th className="text-left py-2 text-sm">#</th>
              <th className="text-left py-2 text-sm">{isKo ? "탐험가" : "Explorer"}</th>
              <th className="text-left py-2 text-sm hidden sm:table-cell">
                {isKo ? "다음 레벨" : "Next Lv"}
                <InfoTip text={isKo ? "현재 레벨에서 다음 레벨까지의 XP 진행률" : "XP progress from current level to next"} below />
              </th>
              <th className="text-center py-2 text-sm">
                {isKo ? "활동" : "Activity"}
                <InfoTip text={isKo ? "🔥Nd = 연속 사용일 · ✓ = 오늘/어제 활동 · Nd = 비활동 일수" : "🔥Nd = streak · ✓ = active today · Nd = days inactive"} wide below />
              </th>
              <th className="text-right py-2 text-sm">XP</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(([lvNum, members]) => {
              const lvInfo = LEVELS.find((l) => l.level === lvNum) ?? LEVELS[0];
              const [from] = lvInfo.color;
              return (
                <GroupRows
                  key={lvNum}
                  lvInfo={lvInfo}
                  color={from}
                  members={members}
                  startRank={rank}
                  selectedName={selectedName}
                  onSelect={onSelect}
                  isKo={isKo}
                  showHeader={showGroupHeaders}
                  afterRender={(count) => { rank += count; }}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupRows({
  lvInfo, color, members, startRank, selectedName, onSelect, isKo, showHeader, afterRender,
}: {
  lvInfo: { level: number; icon: string; titleKo: string; titleEn: string; color: [string, string] };
  color: string;
  members: UserProfile[];
  startRank: number;
  selectedName?: string;
  onSelect: (name: string) => void;
  isKo: boolean;
  showHeader: boolean;
  afterRender: (count: number) => void;
}) {
  afterRender(members.length);
  const title = isKo ? lvInfo.titleKo : lvInfo.titleEn;

  return (
    <>
      {/* Group Header — hidden when only one level group exists */}
      {showHeader && (
        <tr>
          <td colSpan={5} className="pt-4 pb-1">
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color }}>
              <span>{lvInfo.icon}</span>
              <span>{title}</span>
              <span className="text-gray-600">({members.length})</span>
            </div>
          </td>
        </tr>
      )}
      {members.map((p, i) => {
        const r = startRank + i + 1;
        const isSelected = p.name === selectedName;
        const isMaxLevel = !p.nextLevel;
        const streakLabel = p.currentStreak > 0
          ? `🔥${p.currentStreak}d`
          : p.daysSinceLastActivity <= 1
            ? "✓"
            : `${p.daysSinceLastActivity}d`;

        return (
          <tr
            key={p.email}
            tabIndex={0}
            role="button"
            onClick={() => onSelect(p.name)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(p.name); } }}
            className={`border-b border-[#1a1a1a] cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E87A]/50 ${
              isSelected ? "bg-[#00E87A]/[0.07]" : "hover:bg-white/[0.02]"
            }`}
          >
            <td className="py-2.5 text-gray-500 font-mono text-sm">{r}</td>
            <td className="py-2.5">
              <div className="flex items-center gap-2">
                {p.avatar ? (
                  <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                    {p.name[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <span className={`font-medium ${isSelected ? "text-white" : "text-gray-300"}`}>
                    {p.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-600">
                    <span>{formatTokens(p.totalTokens)}</span>
                    <span>·</span>
                    <span>{p.activeDays}d</span>
                    <span>·</span>
                    <span>🏆{p.earnedAchievements.length}</span>
                    {p.tools.size > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-gray-700">{[...p.tools].join(" · ")}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </td>
            {/* Progress to next level */}
            <td className="py-2.5 hidden sm:table-cell">
              {isMaxLevel ? (
                <span className="text-xs font-mono text-gray-500">MAX</span>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${p.progressPercent}%`,
                        background: `linear-gradient(90deg, ${color}, ${lvInfo.color[1]})`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-500 w-8">{p.progressPercent}%</span>
                </div>
              )}
            </td>
            {/* Activity: streak or days since last */}
            <td className="py-2.5 text-center">
              <span className={`text-xs font-mono ${
                p.currentStreak > 0
                  ? "text-orange-400"
                  : p.daysSinceLastActivity <= 1
                    ? "text-green-500"
                    : p.daysSinceLastActivity >= 7
                      ? "text-gray-600"
                      : "text-gray-500"
              }`}>
                {streakLabel}
              </span>
            </td>
            <td className="py-2.5 text-right">
              <span className={`text-sm font-mono ${isSelected ? "text-[#00E87A]" : "text-gray-400"}`}>
                {formatNumber(p.xp)}
              </span>
            </td>
          </tr>
        );
      })}
    </>
  );
}

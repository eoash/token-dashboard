"use client";

import { useMemo } from "react";
import type { UserProfile } from "@/lib/gamification";
import { LEVELS } from "@/lib/gamification";
import { formatNumber } from "@/lib/utils";
import { useT } from "@/lib/contexts/LanguageContext";

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

  return (
    <div className="rounded-xl border border-[#222] bg-[#111111] p-5">
      <h2 className="text-base font-semibold text-white mb-3">
        {isKo ? "탐험대" : "Expedition"}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-base" style={{ fontVariantNumeric: "tabular-nums" }}>
          <thead>
            <tr className="text-gray-500 text-xs border-b border-[#222]">
              <th className="text-left py-2 w-8 text-sm">#</th>
              <th className="text-left py-2 text-sm">{isKo ? "탐험가" : "Explorer"}</th>
              <th className="text-center py-2 w-16 text-sm">Lv</th>
              <th className="text-left py-2 hidden sm:table-cell text-sm">{isKo ? "칭호" : "Title"}</th>
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
  lvInfo, color, members, startRank, selectedName, onSelect, isKo, afterRender,
}: {
  lvInfo: { level: number; icon: string; titleKo: string; titleEn: string; color: [string, string] };
  color: string;
  members: UserProfile[];
  startRank: number;
  selectedName?: string;
  onSelect: (name: string) => void;
  isKo: boolean;
  afterRender: (count: number) => void;
}) {
  afterRender(members.length);
  const title = isKo ? lvInfo.titleKo : lvInfo.titleEn;

  return (
    <>
      {/* Group Header */}
      <tr>
        <td colSpan={5} className="pt-4 pb-1">
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color }}>
            <span>{lvInfo.icon}</span>
            <span>{title}</span>
            <span className="text-gray-600">({members.length})</span>
          </div>
        </td>
      </tr>
      {members.map((p, i) => {
        const r = startRank + i + 1;
        const isSelected = p.name === selectedName;
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
                  <img src={p.avatar} alt={p.name} className="w-7 h-7 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                    {p.name[0]}
                  </div>
                )}
                <span className={`font-medium ${isSelected ? "text-white" : "text-gray-300"}`}>
                  {p.name}
                </span>
              </div>
            </td>
            <td className="py-2.5 text-center">
              <span className="text-sm font-mono" style={{ color }}>{p.level.level}</span>
            </td>
            <td className="py-2.5 hidden sm:table-cell">
              <span className="text-sm text-gray-400">{p.level.icon} {isKo ? p.level.titleKo : p.level.titleEn}</span>
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

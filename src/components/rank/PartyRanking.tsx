"use client";

import type { UserProfile } from "@/lib/gamification";
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
            {profiles.map((p, i) => {
              const isSelected = p.name === selectedName;
              const title = isKo ? p.level.titleKo : p.level.titleEn;
              return (
                <tr
                  key={p.email}
                  tabIndex={0}
                  role="button"
                  onClick={() => onSelect(p.name)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(p.name); } }}
                  className={`border-b border-[#1a1a1a] cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E87A]/50 ${
                    isSelected
                      ? "bg-[#00E87A]/[0.07]"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  <td className="py-2.5 text-gray-500 font-mono text-sm">{i + 1}</td>
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
                      <span className="sm:hidden text-xs">{p.level.icon}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center">
                    <span className="text-sm font-mono text-[#00E87A]">
                      {p.level.level}
                    </span>
                  </td>
                  <td className="py-2.5 hidden sm:table-cell">
                    <span className="text-sm text-gray-400">
                      {p.level.icon} {title}
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
          </tbody>
        </table>
      </div>
    </div>
  );
}

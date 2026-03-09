"use client";

import { useMemo } from "react";
import Link from "next/link";
import { NAME_TO_AVATAR } from "@/lib/constants";
import { formatTokens } from "@/lib/utils";
import type { ClaudeCodeDataPoint } from "@/lib/types";
import { resolveActorName } from "@/lib/constants";
import { startOfWeek, format, parseISO } from "date-fns";
import { useT } from "@/lib/contexts/LanguageContext";
import { buildProfiles } from "@/lib/gamification";

interface WeeklyChampion {
  week: string;
  weekLabel: string;
  name: string;
  tokens: number;
  avatar?: string;
}

function getWeeklyChampions(data: ClaudeCodeDataPoint[]): WeeklyChampion[] {
  const weekUserMap = new Map<string, Map<string, number>>();

  for (const d of data) {
    if (!d.date) continue;
    const weekStart = startOfWeek(parseISO(d.date), { weekStartsOn: 1 });
    const weekKey = format(weekStart, "yyyy-MM-dd");
    const name = resolveActorName(d.actor);
    const tokens = d.input_tokens + d.output_tokens + d.cache_read_tokens;

    if (!weekUserMap.has(weekKey)) weekUserMap.set(weekKey, new Map());
    const userMap = weekUserMap.get(weekKey)!;
    userMap.set(name, (userMap.get(name) ?? 0) + tokens);
  }

  const champions: WeeklyChampion[] = [];
  for (const [weekKey, userMap] of weekUserMap) {
    let topName = "";
    let topTokens = 0;
    for (const [name, tokens] of userMap) {
      if (tokens > topTokens) {
        topName = name;
        topTokens = tokens;
      }
    }
    if (topName && topTokens > 0) {
      const ws = parseISO(weekKey);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      champions.push({
        week: weekKey,
        weekLabel: `${format(ws, "M/d")} ~ ${format(we, "M/d")}`,
        name: topName,
        tokens: topTokens,
        avatar: NAME_TO_AVATAR[topName],
      });
    }
  }

  return champions.sort((a, b) => b.week.localeCompare(a.week));
}

export default function WeeklyChampions({ data }: { data: ClaudeCodeDataPoint[] }) {
  const { t, locale } = useT();
  const champions = useMemo(() => getWeeklyChampions(data), [data]);
  const profiles = useMemo(() => buildProfiles(data), [data]);
  const levelMap = useMemo(() => {
    const map = new Map<string, { level: number; icon: string }>();
    for (const p of profiles) map.set(p.name, { level: p.level.level, icon: p.level.icon });
    return map;
  }, [profiles]);

  if (champions.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#222] bg-[#111111] p-5">
      <h2 className="text-sm font-semibold text-white mb-4">{t("weekly.title")}</h2>
      <div className="space-y-2">
        {champions.map((c, i) => (
          <div
            key={c.week}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
              i === 0 ? "bg-[#E8FF47]/5 border border-[#E8FF47]/20" : "bg-white/[0.02]"
            }`}
          >
            <span className={`text-xs font-mono w-24 flex-shrink-0 ${i === 0 ? "text-[#E8FF47]" : "text-gray-500"}`}>
              {c.weekLabel}
            </span>
            {c.avatar ? (
              <img src={c.avatar} alt={c.name} className="w-6 h-6 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-gray-400 flex-shrink-0">
                {c.name[0]}
              </div>
            )}
            <span className={`text-sm font-medium flex-1 ${i === 0 ? "text-white" : "text-gray-300"}`}>
              {levelMap.get(c.name) && (
                <span className="text-[10px] text-gray-500 mr-1">
                  {levelMap.get(c.name)!.icon}Lv.{levelMap.get(c.name)!.level}
                </span>
              )}
              {c.name}
            </span>
            <span className={`text-xs font-mono ${i === 0 ? "text-[#E8FF47]" : "text-gray-500"}`}>
              {formatTokens(c.tokens)}
            </span>
          </div>
        ))}
      </div>
      <Link
        href="/rank"
        className="mt-3 block text-center text-xs text-gray-500 hover:text-[#E8FF47] transition-colors"
      >
        ⚔️ {locale === "ko" ? "모험가 길드 →" : "Adventurer's Guild →"}
      </Link>
    </div>
  );
}

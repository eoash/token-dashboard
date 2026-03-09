"use client";

import { useMemo } from "react";
import { ACHIEVEMENTS } from "@/lib/gamification";
import type { UserProfile } from "@/lib/gamification";
import type { ClaudeCodeDataPoint } from "@/lib/types";
import { resolveActorName } from "@/lib/constants";
import { formatTokens } from "@/lib/utils";
import { useT } from "@/lib/contexts/LanguageContext";

interface Props {
  profile: UserProfile;
  data: ClaudeCodeDataPoint[];
}

interface TimelineEvent {
  date: string; // YYYY-MM-DD
  label: string;
}

export default function ActivityTimeline({ profile, data }: Props) {
  const { locale } = useT();
  const isKo = locale === "ko";

  const events = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 14);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    // Filter data for this user
    const userPoints = data.filter((d) => {
      const email = (d.actor.email_address ?? d.actor.id).toLowerCase();
      return resolveActorName(d.actor) === profile.name || email === profile.email;
    });

    const all: TimelineEvent[] = [];

    // 1. Daily token usage -- aggregate output_tokens by date, top 5
    const dailyTokens = new Map<string, number>();
    for (const d of userPoints) {
      if (d.date < cutoffStr) continue;
      dailyTokens.set(d.date, (dailyTokens.get(d.date) ?? 0) + d.output_tokens);
    }
    const sortedDays = [...dailyTokens.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    for (const [date, tokens] of sortedDays) {
      const mm = date.slice(5, 7);
      const dd = date.slice(8, 10);
      all.push({
        date,
        label: `[${mm}/${dd}] \u{1F4AC} ${formatTokens(tokens)} tokens used`,
      });
    }

    // 2. Streak milestones (reverse-calculate from currentStreak)
    const milestones = [3, 7, 14, 30];
    if (profile.currentStreak >= 7) {
      const todayStr = now.toISOString().slice(0, 10);
      for (const ms of milestones) {
        if (profile.currentStreak >= ms) {
          const daysAgo = profile.currentStreak - ms;
          const msDate = new Date(now);
          msDate.setDate(msDate.getDate() - daysAgo);
          const msDateStr = msDate.toISOString().slice(0, 10);
          if (msDateStr >= cutoffStr && msDateStr <= todayStr) {
            const mm = msDateStr.slice(5, 7);
            const dd = msDateStr.slice(8, 10);
            all.push({
              date: msDateStr,
              label: `[${mm}/${dd}] \u{1F525} ${ms}${isKo ? "\uC77C \uC5F0\uC18D \uC0AC\uC6A9 \uB2EC\uC131" : " day streak achieved"}`,
            });
          }
        }
      }
    }

    // 3. Tool first use -- earliest date per tool within window
    const toolFirstDate = new Map<string, string>();
    for (const d of userPoints) {
      const tool = d.model.startsWith("gpt")
        ? "Codex"
        : d.model.startsWith("gemini")
          ? "Gemini"
          : "Claude";
      const existing = toolFirstDate.get(tool);
      if (!existing || d.date < existing) {
        toolFirstDate.set(tool, d.date);
      }
    }
    for (const [tool, date] of toolFirstDate) {
      if (date >= cutoffStr) {
        const mm = date.slice(5, 7);
        const dd = date.slice(8, 10);
        all.push({
          date,
          label: `[${mm}/${dd}] \u{1F6E0}\uFE0F ${tool} ${isKo ? "\uCCAB \uC0AC\uC6A9" : "first use"}`,
        });
      }
    }

    // 4. Achievement unlock events (from achievedAt)
    const achievementMap = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
    for (const [id, date] of Object.entries(profile.achievedAt)) {
      if (date >= cutoffStr) {
        const ach = achievementMap.get(id);
        if (ach) {
          const mm = date.slice(5, 7);
          const dd = date.slice(8, 10);
          all.push({
            date,
            label: `[${mm}/${dd}] 🏆 ${ach.icon} ${ach.name} ${isKo ? "달성" : "unlocked"}`,
          });
        }
      }
    }

    // Sort by date descending, take max 10
    all.sort((a, b) => b.date.localeCompare(a.date));
    return all.slice(0, 10);
  }, [profile, data, isKo]);

  return (
    <div className="rounded-xl border border-[#222] bg-[#111111] p-5">
      <h2 className="text-base font-semibold text-white mb-3">
        {isKo ? "\u{1F4E1} \uD0D0\uC0AC \uB85C\uADF8" : "\u{1F4E1} Exploration Log"}
      </h2>

      {events.length === 0 ? (
        <p className="text-xs font-mono text-gray-600">
          [LOG] {isKo ? "\uCD5C\uADFC 14\uC77C \uD65C\uB3D9 \uC5C6\uC74C." : "No activity in last 14 days."}
        </p>
      ) : (
        <div className="space-y-1.5">
          {events.map((ev, i) => (
            <p key={i} className="text-xs font-mono text-gray-400">
              {ev.label}
            </p>
          ))}
        </div>
      )}

      <p className="text-xs font-mono text-gray-600 mt-3">
        [LOG] {events.length} events recorded in last 14 days.
      </p>
    </div>
  );
}

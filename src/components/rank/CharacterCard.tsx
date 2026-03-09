"use client";

import type { UserProfile } from "@/lib/gamification";
import { ACHIEVEMENTS, AUTO_LEVEL_CAP } from "@/lib/gamification";
import { formatTokens, formatNumber } from "@/lib/utils";
import { useT } from "@/lib/contexts/LanguageContext";

export default function CharacterCard({ profile }: { profile: UserProfile }) {
  const { locale } = useT();
  const isKo = locale === "ko";
  const title = isKo ? profile.level.titleKo : profile.level.titleEn;
  const nextTitle = profile.nextLevel
    ? isKo ? profile.nextLevel.titleKo : profile.nextLevel.titleEn
    : null;
  const [from, to] = profile.level.color;
  const isHighLevel = profile.level.level >= 7;

  const previewAchievements = profile.earnedAchievements.slice(0, 7);
  const remaining = profile.earnedAchievements.length - 7;

  return (
    <div
      className={`rounded-xl bg-[#111111] p-6 ${isHighLevel ? "animate-[pulse_3s_ease-in-out_infinite]" : ""}`}
      style={{
        border: "2px solid transparent",
        borderImage: `linear-gradient(135deg, ${from}, ${to}) 1`,
      }}
    >
      {/* Header: Avatar + Name + Level */}
      <div className="flex items-center gap-4 mb-2">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-16 h-16 rounded-full"
            style={{ boxShadow: `0 0 0 2px ${from}60` }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl text-gray-400"
            style={{ boxShadow: `0 0 0 2px ${from}60` }}
          >
            {profile.name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-bold text-white">{profile.name}</span>
            <span
              className="text-sm font-mono px-2.5 py-0.5 rounded"
              style={{ color: from, backgroundColor: `${from}18` }}
            >
              Lv.{profile.level.level}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-lg">{profile.level.icon}</span>
            <span className="text-base text-gray-300">{title}</span>
          </div>
        </div>
      </div>

      {/* System Log Flavor Text */}
      <p className="text-xs font-mono text-gray-500 mb-5 pl-1">
        {profile.level.logEn}
      </p>

      {/* XP Bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5" style={{ fontVariantNumeric: "tabular-nums" }}>
          <span className="text-gray-400 font-mono">
            XP {formatNumber(profile.xp)}
          </span>
          {profile.nextLevel ? (
            <span className="text-gray-500 font-mono">
              {formatNumber(profile.xpInLevel)} / {formatNumber(profile.xpToNext)} → Lv.{profile.nextLevel.level} {nextTitle}
            </span>
          ) : (
            <span className="font-mono" style={{ color: from }}>MAX</span>
          )}
        </div>
        <div className="w-full h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${profile.progressPercent}%`, background: `linear-gradient(90deg, ${from}, ${to})` }}
          />
        </div>
        {profile.level.level === AUTO_LEVEL_CAP && profile.progressPercent === 100 && (
          <p className="text-[10px] text-gray-500 mt-1.5">
            🔒 {isKo
              ? "Lv.7 이상은 AI 프로덕트 심사 + 팀 추천이 필요합니다"
              : "Lv.7+ requires AI product review + team nomination"}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatBox label={isKo ? "토큰" : "Tokens"} value={formatTokens(profile.totalTokens)} />
        <StatBox label={isKo ? "활동일" : "Active Days"} value={String(profile.activeDays)} />
        <StatBox label={isKo ? "커밋" : "Commits"} value={formatNumber(profile.totalCommits)} />
        <StatBox label="PR" value={formatNumber(profile.totalPRs)} />
      </div>

      {/* Streak + Decay */}
      <div className="flex items-center gap-4 mb-4 text-xs flex-wrap">
        <span className="text-gray-400">
          🔥 {isKo ? "현재 스트릭" : "Current Streak"}: <span className="text-white font-mono">{profile.currentStreak}{isKo ? "일" : "d"}</span>
        </span>
        <span className="text-gray-400">
          ⚡ {isKo ? "최장" : "Best"}: <span className="text-white font-mono">{profile.maxStreak}{isKo ? "일" : "d"}</span>
        </span>
        {profile.decayDays > 0 && (
          <span className="text-red-400">
            📉 {isKo ? "비활동 감소 중" : "Decaying"}: -{profile.decayDays}{isKo ? "일" : "d"}
            <span className="text-gray-500 ml-1">
              ({formatNumber(profile.rawXp - profile.xp)} XP)
            </span>
          </span>
        )}
      </div>

      {/* Achievement Preview */}
      {profile.earnedAchievements.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {previewAchievements.map((id) => {
            const a = ACHIEVEMENTS.find((x) => x.id === id);
            return a ? (
              <span key={id} className="text-lg" title={isKo ? a.conditionKo : a.conditionEn}>
                {a.icon}
              </span>
            ) : null;
          })}
          {remaining > 0 && (
            <span className="text-xs text-gray-500 font-mono ml-1">+{remaining}</span>
          )}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0A0A0A] rounded-lg px-3 py-3 text-center">
      <div className="text-base font-mono text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

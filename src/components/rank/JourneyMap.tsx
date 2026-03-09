"use client";

import type { UserProfile } from "@/lib/gamification";
import { LEVELS, AUTO_LEVEL_CAP } from "@/lib/gamification";

interface Props {
  profile: UserProfile;
}

export default function JourneyMap({ profile }: Props) {
  const currentLv = profile.level.level;

  return (
    <div
      className="rounded-xl border border-[#222] bg-[#111111] pt-10 pb-5 px-5 overflow-x-auto"
      style={{
        backgroundImage: "radial-gradient(circle, #222 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      {/* Step Bar */}
      <div className="flex items-center justify-between min-w-[600px] px-2">
        {LEVELS.map((lv, i) => {
          const reached = currentLv >= lv.level;
          const isCurrent = currentLv === lv.level;
          const isLocked = lv.level > AUTO_LEVEL_CAP;
          const [from, to] = lv.color;
          const isLast = i === LEVELS.length - 1;

          return (
            <div key={lv.level} className="flex items-center flex-1 last:flex-none">
              {/* Node */}
              <div className="flex flex-col items-center relative" style={{ minWidth: 48 }}>
                {/* Avatar indicator for current level */}
                {isCurrent && profile.avatar && (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-6 h-6 rounded-full absolute -top-8"
                    style={{ boxShadow: `0 0 0 1px ${from}` }}
                  />
                )}
                {isCurrent && !profile.avatar && (
                  <div
                    className="w-6 h-6 rounded-full absolute -top-8 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: from }}
                  >
                    {profile.name[0]}
                  </div>
                )}

                {/* Icon circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all relative ${
                    reached ? "bg-[#1a1a1a]" : "bg-[#0A0A0A] opacity-30"
                  }`}
                  style={{
                    borderColor: reached ? from : "#333",
                    boxShadow: isCurrent ? `0 0 12px ${from}40` : undefined,
                  }}
                >
                  {isLocked && !reached && (
                    <span className="absolute -top-1 -right-1 text-[10px]">🔒</span>
                  )}
                  <span className={reached ? "" : "grayscale"}>{lv.icon}</span>
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                    reached ? "text-gray-300" : "text-gray-600"
                  }`}
                  style={isCurrent ? { color: from } : undefined}
                >
                  {lv.titleEn}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 h-0.5 mx-1 relative">
                  {/* Background line */}
                  <div className={`absolute inset-0 ${reached ? "" : "border-t border-dashed border-[#333]"}`}
                    style={reached ? { background: `linear-gradient(90deg, ${from}, ${LEVELS[i + 1]?.color[0] ?? to})` } : undefined}
                  />
                  {/* Progress overlay for current level segment */}
                  {isCurrent && profile.nextLevel && (
                    <div
                      className="absolute inset-y-0 left-0 h-full"
                      style={{
                        width: `${profile.progressPercent}%`,
                        background: `linear-gradient(90deg, ${from}, ${to})`,
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* System log */}
      <p className="text-xs font-mono text-gray-500 mt-4 text-center">
        {profile.level.logEn.replace(
          /\.$/,
          profile.nextLevel
            ? `. ${profile.progressPercent}% to next level.`
            : ". Maximum level reached."
        )}
      </p>
    </div>
  );
}

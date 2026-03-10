import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

// 레벨별 그라데이션 컬러
const LEVEL_COLORS: Record<string, [string, string]> = {
  "1": ["#666", "#888"],
  "2": ["#4A9EFF", "#6BB5FF"],
  "3": ["#00E87A", "#4AFFA0"],
  "4": ["#00CED1", "#48D1CC"],
  "5": ["#A855F7", "#C084FC"],
  "6": ["#F59E0B", "#FBBF24"],
  "7": ["#EF4444", "#F97316"],
  "8": ["#E8FF47", "#00E87A"],
};

const PREV_LEVEL_ICONS: Record<string, string> = {
  "1": "📡", "2": "🛰️", "3": "🌍", "4": "🧬",
  "5": "☄️", "6": "🚀", "7": "🌌", "8": "✦",
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name") || "Explorer";
  const level = searchParams.get("level") || "1";
  const title = searchParams.get("title") || "Scout";
  const icon = searchParams.get("icon") || "📡";
  const xp = searchParams.get("xp") || "0";
  const streak = searchParams.get("streak") || "0";
  const log = searchParams.get("log") || "";
  const prevLevel = searchParams.get("prevLevel") || "";
  const prevTitle = searchParams.get("prevTitle") || "";

  const [color1, color2] = LEVEL_COLORS[level] || ["#666", "#888"];
  const prevColor = prevLevel ? (LEVEL_COLORS[prevLevel] || ["#666", "#888"])[0] : "#666";
  const prevIcon = prevLevel ? (PREV_LEVEL_ICONS[prevLevel] || "📡") : "";
  const formattedXp = Number(xp).toLocaleString();
  const hasPrev = prevLevel && prevTitle;

  return new ImageResponse(
    (
      <div
        style={{
          width: "800px",
          height: "418px",
          display: "flex",
          flexDirection: "row",
          position: "relative",
          overflow: "hidden",
          background: "#050508",
        }}
      >
        {/* === Full background: dramatic radial burst === */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            left: "100px",
            width: "600px",
            height: "800px",
            display: "flex",
            background: `radial-gradient(ellipse at center, ${color1}25 0%, ${color1}08 35%, transparent 65%)`,
          }}
        />
        {/* Secondary burst - lower right */}
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            right: "-50px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            display: "flex",
            background: `radial-gradient(circle, ${color2}15 0%, transparent 60%)`,
          }}
        />

        {/* === Light ray streaks (simulated with thin gradient divs) === */}
        {[
          { top: "0", left: "350px", w: "3px", h: "418px", opacity: "0.06" },
          { top: "0", left: "420px", w: "2px", h: "418px", opacity: "0.04" },
          { top: "0", left: "280px", w: "2px", h: "418px", opacity: "0.04" },
          { top: "0", left: "500px", w: "1px", h: "418px", opacity: "0.03" },
          { top: "0", left: "200px", w: "1px", h: "418px", opacity: "0.03" },
        ].map((ray, i) => (
          <div
            key={`ray-${i}`}
            style={{
              position: "absolute",
              top: ray.top,
              left: ray.left,
              width: ray.w,
              height: ray.h,
              background: `linear-gradient(180deg, transparent 0%, ${color1} 30%, ${color2} 70%, transparent 100%)`,
              opacity: ray.opacity,
              display: "flex",
            }}
          />
        ))}

        {/* === Gradient top & bottom edge glow === */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            height: "4px",
            display: "flex",
            background: `linear-gradient(90deg, transparent 10%, ${color1} 40%, ${color2} 60%, transparent 90%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "3px",
            display: "flex",
            background: `linear-gradient(90deg, transparent 15%, ${color1}60 45%, ${color2}60 55%, transparent 85%)`,
          }}
        />

        {/* ============= LEFT PANEL: Emblem & Level ============= */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "320px",
            position: "relative",
            padding: "30px",
          }}
        >
          {/* Outer glow ring */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: "-110px",
              marginLeft: "-110px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              border: `2px solid ${color1}30`,
              display: "flex",
              boxShadow: `0 0 60px ${color1}20, 0 0 120px ${color1}10`,
            }}
          />
          {/* Inner glow ring */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: "-90px",
              marginLeft: "-90px",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              border: `3px solid ${color1}50`,
              display: "flex",
              boxShadow: `0 0 40px ${color1}30, inset 0 0 30px ${color1}15`,
            }}
          />

          {/* Central emblem background */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color1}25 0%, ${color1}08 60%, transparent 100%)`,
              position: "relative",
            }}
          >
            {/* Icon */}
            <div
              style={{
                display: "flex",
                fontSize: "64px",
                lineHeight: "1",
              }}
            >
              {icon}
            </div>
          </div>

          {/* Level number badge below emblem */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "16px",
              padding: "4px 20px",
              borderRadius: "20px",
              background: `linear-gradient(135deg, ${color1}, ${color2})`,
              boxShadow: `0 0 20px ${color1}50`,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "18px",
                fontWeight: 900,
                color: "#0A0A0A",
                letterSpacing: "2px",
              }}
            >
              Lv.{level}
            </div>
          </div>
        </div>

        {/* ============= RIGHT PANEL: Info ============= */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "36px 40px 28px 0",
            justifyContent: "center",
          }}
        >
          {/* LEVEL UP banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "14px",
                color: color1,
              }}
            >
              ★
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "13px",
                fontWeight: 800,
                color: color1,
                letterSpacing: "6px",
              }}
            >
              LEVEL UP
            </div>
            <div
              style={{
                display: "flex",
                height: "1px",
                flex: 1,
                background: `linear-gradient(90deg, ${color1}40, transparent)`,
              }}
            />
          </div>

          {/* Name - big and bold */}
          <div
            style={{
              display: "flex",
              fontSize: "42px",
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: "1.1",
              marginBottom: "8px",
            }}
          >
            {name}
          </div>

          {/* Title with gradient */}
          <div
            style={{
              display: "flex",
              fontSize: "24px",
              fontWeight: 700,
              background: `linear-gradient(90deg, ${color1}, ${color2})`,
              backgroundClip: "text",
              color: "transparent",
              marginBottom: "12px",
            }}
          >
            {title}
          </div>

          {/* Level transition */}
          {hasPrev && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px",
                padding: "8px 14px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "14px",
                  color: prevColor,
                  opacity: "0.5",
                }}
              >
                <span>{prevIcon}</span>
                <span>Lv.{prevLevel} {prevTitle}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "16px",
                  color: color1,
                  fontWeight: 800,
                }}
              >
                →
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: color1,
                }}
              >
                <span>{icon}</span>
                <span>Lv.{level} {title}</span>
              </div>
            </div>
          )}

          {/* System log */}
          {log && (
            <div
              style={{
                display: "flex",
                fontSize: "12px",
                color: "#666",
                fontFamily: "monospace",
                letterSpacing: "0.3px",
                marginBottom: "14px",
              }}
            >
              {log}
            </div>
          )}

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              marginTop: "auto",
              paddingTop: "14px",
              borderTop: `1px solid ${color1}12`,
            }}
          >
            {/* XP */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", fontSize: "11px", color: "#555", letterSpacing: "1px" }}>
                XP
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "18px",
                  fontWeight: 800,
                  color: color1,
                }}
              >
                {formattedXp}
              </div>
            </div>

            {/* Streak */}
            {Number(streak) > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", fontSize: "11px", color: "#555", letterSpacing: "1px" }}>
                  STREAK
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#F59E0B",
                  }}
                >
                  🔥{streak}d
                </div>
              </div>
            )}

            {/* Brand */}
            <div
              style={{
                display: "flex",
                marginLeft: "auto",
                fontSize: "10px",
                color: "#333",
                letterSpacing: "1.5px",
              }}
            >
              EO STUDIO
            </div>
          </div>
        </div>

        {/* === Corner sparkle decorations === */}
        {[
          { top: "20px", right: "30px", bottom: "", left: "", s: "8px" },
          { top: "35px", right: "55px", bottom: "", left: "", s: "5px" },
          { top: "50px", right: "25px", bottom: "", left: "", s: "4px" },
          { top: "", right: "", bottom: "30px", left: "25px", s: "5px" },
          { top: "", right: "", bottom: "50px", left: "40px", s: "3px" },
          { top: "25px", right: "80px", bottom: "", left: "", s: "3px" },
          { top: "", right: "50px", bottom: "60px", left: "", s: "4px" },
          { top: "", right: "30px", bottom: "40px", left: "", s: "6px" },
        ].map((sp, i) => (
          <div
            key={`sp-${i}`}
            style={{
              position: "absolute",
              top: sp.top || undefined,
              right: sp.right || undefined,
              bottom: sp.bottom || undefined,
              left: sp.left || undefined,
              width: sp.s,
              height: sp.s,
              borderRadius: i % 3 === 0 ? "0" : "50%",
              transform: i % 3 === 0 ? "rotate(45deg)" : undefined,
              background: i % 2 === 0 ? color1 : color2,
              opacity: "0.4",
              display: "flex",
            }}
          />
        ))}
      </div>
    ),
    {
      width: 800,
      height: 418,
    },
  );
}

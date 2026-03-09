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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name") || "Explorer";
  const level = searchParams.get("level") || "1";
  const title = searchParams.get("title") || "Scout";
  const icon = searchParams.get("icon") || "📡";
  const xp = searchParams.get("xp") || "0";
  const streak = searchParams.get("streak") || "0";
  const log = searchParams.get("log") || "";

  const [color1, color2] = LEVEL_COLORS[level] || ["#666", "#888"];
  const formattedXp = Number(xp).toLocaleString();

  return new ImageResponse(
    (
      <div
        style={{
          width: "800px",
          height: "400px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0A0A0A",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color1}22 0%, transparent 70%)`,
            display: "flex",
          }}
        />

        {/* Top bar */}
        <div
          style={{
            display: "flex",
            height: "4px",
            background: `linear-gradient(90deg, ${color1}, ${color2})`,
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "40px 48px",
            flex: 1,
          }}
        >
          {/* LEVEL UP badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                padding: "4px 16px",
                borderRadius: "20px",
                background: `linear-gradient(135deg, ${color1}, ${color2})`,
                fontSize: "14px",
                fontWeight: 700,
                color: "#0A0A0A",
                letterSpacing: "3px",
              }}
            >
              ★ LEVEL UP
            </div>
          </div>

          {/* Main info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              marginBottom: "20px",
            }}
          >
            {/* Level icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                border: `2px solid ${color1}66`,
                background: `${color1}15`,
                fontSize: "40px",
              }}
            >
              {icon}
            </div>

            {/* Name + Title */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "36px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                {name}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "20px",
                  fontWeight: 600,
                  background: `linear-gradient(90deg, ${color1}, ${color2})`,
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Lv.{level} {title}
              </div>
            </div>
          </div>

          {/* System log */}
          {log && (
            <div
              style={{
                display: "flex",
                fontSize: "14px",
                color: "#666",
                fontFamily: "monospace",
                marginBottom: "20px",
              }}
            >
              {log}
            </div>
          )}

          {/* Stats bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
              marginTop: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", fontSize: "14px", color: "#666" }}>
                XP
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: color1,
                }}
              >
                {formattedXp}
              </div>
            </div>

            {Number(streak) > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{ display: "flex", fontSize: "14px", color: "#666" }}
                >
                  STREAK
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#F59E0B",
                  }}
                >
                  {streak}d
                </div>
              </div>
            )}

            {/* Brand */}
            <div
              style={{
                display: "flex",
                marginLeft: "auto",
                fontSize: "13px",
                color: "#333",
                letterSpacing: "1px",
              }}
            >
              EO STUDIO · EXPLORER&apos;S LOG
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 800,
      height: 400,
    },
  );
}

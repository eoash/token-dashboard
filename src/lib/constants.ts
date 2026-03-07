import type { TeamMember } from "./types";

// EO Studio 팀원 매핑
export const TEAM_MEMBERS: TeamMember[] = [
  { email: "ash@eoeoeo.net", name: "Seohyun" },
  { email: "jay@eostudio.tv", name: "Jay" },
  { email: "alex@eostudio.tv", name: "Alex" },
  { email: "yuna@eostudio.tv", name: "Yuna" },
  { email: "chris@eostudio.tv", name: "Chris" },
];

export const EMAIL_TO_NAME: Record<string, string> = Object.fromEntries(
  TEAM_MEMBERS.map((m) => [m.email, m.name])
);

// 모델 표시명 + 색상
export const MODEL_CONFIG: Record<string, { label: string; color: string }> = {
  "claude-opus-4-6": { label: "Opus 4.6", color: "#E8FF47" },
  "claude-sonnet-4-6": { label: "Sonnet 4.6", color: "#3B82F6" },
  "claude-haiku-4-5-20251001": { label: "Haiku 4.5", color: "#10B981" },
  // fallback for older models
  "claude-3-5-sonnet-20241022": { label: "Sonnet 3.5", color: "#6366F1" },
  "claude-3-5-haiku-20241022": { label: "Haiku 3.5", color: "#14B8A6" },
};

export function getModelLabel(model: string): string {
  return MODEL_CONFIG[model]?.label ?? model;
}

export function getModelColor(model: string): string {
  return MODEL_CONFIG[model]?.color ?? "#888888";
}

// API 기본값
export const DEFAULT_DAYS = 30;
export const ANTHROPIC_ADMIN_BASE = "https://api.anthropic.com/v1/organizations";

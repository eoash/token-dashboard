export type TeamMember = { email: string; name: string; avatar?: string };

// 이메일 → 이름 매핑 (같은 사람이 여러 이메일을 쓸 수 있음)
export const TEAM_MEMBERS: TeamMember[] = [
  // — Primary Owner / Owners —
  { email: "ash@eoeoeo.net", name: "Seohyun" },
  { email: "june@eoeoeo.net", name: "June" },
  { email: "chiri@eoeoeo.net", name: "Chiri" },
  { email: "saul@eoeoeo.net", name: "Seongheum" },
  { email: "gwy@eoeoeo.net", name: "Gunwook" },
  { email: "ty@eoeoeo.net", name: "TaeYong" },
  { email: "phoenix@eoeoeo.net", name: "Phoenix" },
  // — Premium —
  { email: "hyeri@eoeoeo.net", name: "Hyeri" },
  { email: "jy.lim@eoeoeo.net", name: "Jiyoon" },
  { email: "cw.lim@eoeoeo.net", name: "Chanwoo" },
  // — Standard —
  { email: "chankim@eoeoeo.net", name: "Chankim" },
  { email: "heejoo@eoeoeo.net", name: "Heejoo" },
  { email: "izzy@eoeoeo.net", name: "Izzy" },
  { email: "grace@eoeoeo.net", name: "Grace" },
  { email: "jemin@eoeoeo.net", name: "Jemin" },
  { email: "chaenn@eoeoeo.net", name: "Chaeeun" },
  { email: "yjk@eoeoeo.net", name: "Jade" },
  { email: "jhghood25@eoeoeo.net", name: "Jihwan" },
  { email: "songsh@eoeoeo.net", name: "Song" },
  { email: "hyunahk@eoeoeo.net", name: "Hyunah" },
  { email: "ljw@eoeoeo.net", name: "Jewoo" },
  { email: "leejumi@eoeoeo.net", name: "Jumi" },
  { email: "gyeol@eoeoeo.net", name: "Gyeol" },
  { email: "jeebin@eoeoeo.net", name: "Jeebin" },
  { email: "dwkim@eoeoeo.net", name: "Dowon" },
  { email: "zen.park@eoeoeo.net", name: "Zen" },
  { email: "soyoung@eoeoeo.net", name: "SoYoung" },
  { email: "ksm@eoeoeo.net", name: "Sumin" },
  { email: "dev@eoeoeo.net", name: "Dev" },
  // — Ash's Agent Squad (Mock/Gemini/GPT 전용) —
  { email: "jay@eostudio.tv", name: "Jay" },
  { email: "alex@eostudio.tv", name: "Alex" },
  { email: "yuna@eostudio.tv", name: "Yuna" },
  { email: "chris@eostudio.tv", name: "Chris" },
];

export const EMAIL_TO_NAME: Record<string, string> = Object.fromEntries(
  TEAM_MEMBERS.map((m) => [m.email, m.name])
);

// 고유 팀원 목록 (이름 중복 제거) — UI 드롭다운, Mock 데이터 생성용
export const UNIQUE_MEMBERS: TeamMember[] = TEAM_MEMBERS.filter(
  (m, i, arr) => arr.findIndex((x) => x.name === m.name) === i
);

// 모델 표시명 + 색상
export interface ModelConfig {
  label: string;
  color: string;
}

export const MODEL_CONFIG: Record<string, ModelConfig> = {
  "claude-opus-4-6":           { label: "Opus 4.6",   color: "#E8FF47" },
  "claude-sonnet-4-6":         { label: "Sonnet 4.6", color: "#3B82F6" },
  "claude-haiku-4-5-20251001": { label: "Haiku 4.5",  color: "#10B981" },
  "claude-sonnet-4-5-20250929":  { label: "Sonnet 4.5", color: "#8B5CF6" },
  "claude-3-5-sonnet-20241022": { label: "Sonnet 3.5", color: "#6366F1" },
  "claude-3-5-haiku-20241022":  { label: "Haiku 3.5",  color: "#14B8A6" },
};

export function getModelLabel(model: string): string {
  return MODEL_CONFIG[model]?.label ?? model;
}

export function getModelColor(model: string): string {
  return MODEL_CONFIG[model]?.color ?? "#888888";
}

/** actor → 표시 이름 변환 (이메일 미등록 시 username 부분 사용) */
export function resolveActorName(actor: { email_address?: string | null; id: string }): string {
  const email = actor.email_address ?? actor.id;
  return EMAIL_TO_NAME[email] ?? email.split("@")[0];
}

// 대시보드에서 제외할 이메일
export const EXCLUDED_EMAILS = new Set(["ash@eostudio.tv"]);

// API 기본값
export const DEFAULT_DAYS = 30;

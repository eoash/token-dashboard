export type TeamMember = { email: string; name: string; avatar?: string };

// 이메일 → 이름 매핑 (같은 사람이 여러 이메일을 쓸 수 있음)
export const TEAM_MEMBERS: TeamMember[] = [
  // — Primary Owner / Owners —
  { email: "ash@eoeoeo.net", name: "Seohyun", avatar: "https://avatars.slack-edge.com/2026-02-09/10474629156276_69b69fa7c803f1e56d85_72.jpg" },
  { email: "june@eoeoeo.net", name: "June", avatar: "https://avatars.slack-edge.com/2025-10-17/9719139044772_b3797a98688f8d42ceee_72.jpg" },
  { email: "chiri@eoeoeo.net", name: "Chiri", avatar: "https://avatars.slack-edge.com/2021-09-05/2463691990404_8dc29cc024f02a2dda1c_72.png" },
  { email: "saul@eoeoeo.net", name: "Seongheum", avatar: "https://avatars.slack-edge.com/2025-10-01/9601341495575_5fbdbff4a5002d8456fd_72.jpg" },
  { email: "gwy@eoeoeo.net", name: "Gunwook", avatar: "https://avatars.slack-edge.com/2025-09-18/9537734062133_a4490dcc881f4c98c0c4_72.jpg" },
  { email: "ty@eoeoeo.net", name: "TaeYong", avatar: "https://avatars.slack-edge.com/2024-11-18/8038728711830_e547e81e64c89196b1c4_72.png" },
  { email: "phoenix@eoeoeo.net", name: "Phoenix", avatar: "https://avatars.slack-edge.com/2023-05-12/5247598924518_479f5ef45b136e096d13_72.png" },
  // — Premium —
  { email: "hyeri@eoeoeo.net", name: "Hyeri", avatar: "https://avatars.slack-edge.com/2025-10-23/9749782929542_eb4e1f1d17ac2e36c39a_72.jpg" },
  { email: "jy.lim@eoeoeo.net", name: "Jiyoon", avatar: "https://avatars.slack-edge.com/2025-09-18/9542670154084_9e7c78110c9a4ff94832_72.jpg" },
  { email: "cw.lim@eoeoeo.net", name: "Chanwoo", avatar: "https://avatars.slack-edge.com/2025-09-18/9524291207319_0c31cb66d5d1501aafcd_72.jpg" },
  // — Standard —
  { email: "chankim@eoeoeo.net", name: "Chankim", avatar: "https://avatars.slack-edge.com/2026-02-28/10615371073553_bfef484b80d2b5af7550_72.jpg" },
  { email: "heejoo@eoeoeo.net", name: "Heejoo", avatar: "https://avatars.slack-edge.com/2025-11-26/9980651837799_5de589c7a820c8d3035f_72.png" },
  { email: "izzy@eoeoeo.net", name: "Izzy", avatar: "https://avatars.slack-edge.com/2025-09-17/9548321478705_9b12a80b514c735c69cc_72.jpg" },
  { email: "grace@eoeoeo.net", name: "Grace", avatar: "https://avatars.slack-edge.com/2025-09-18/9539341183558_899f08971fcc43011541_72.png" },
  { email: "jemin@eoeoeo.net", name: "Jemin", avatar: "https://avatars.slack-edge.com/2025-10-01/9613131790421_9390231d8d42154c0c05_72.png" },
  { email: "chaenn@eoeoeo.net", name: "Chaeeun", avatar: "https://avatars.slack-edge.com/2025-10-01/9611034420181_4809053162293d2c0555_72.png" },
  { email: "yjk@eoeoeo.net", name: "Jade", avatar: "https://avatars.slack-edge.com/2026-01-20/10358470225072_afbf3243899078eae211_72.jpg" },
  { email: "jhghood25@eoeoeo.net", name: "Jihwan", avatar: "https://avatars.slack-edge.com/2025-10-31/9805109735011_14de538b1dcad6f5f3fd_72.png" },
  { email: "songsh@eoeoeo.net", name: "Song", avatar: "https://avatars.slack-edge.com/2025-10-31/9811200976242_45705c818ece3c7792f7_72.png" },
  { email: "hyunahk@eoeoeo.net", name: "Hyunah", avatar: "https://avatars.slack-edge.com/2026-02-10/10475811324406_1c1b4af97a1e52e20655_72.jpg" },
  { email: "ljw@eoeoeo.net", name: "Jewoo", avatar: "https://avatars.slack-edge.com/2025-06-09/9021553122116_cbc61854259dd9be665e_72.jpg" },
  { email: "leejumi@eoeoeo.net", name: "Jumi", avatar: "https://avatars.slack-edge.com/2026-02-23/10554701768627_9564aa9740ef07472cfa_72.jpg" },
  { email: "gyeol@eoeoeo.net", name: "Gyeol", avatar: "https://avatars.slack-edge.com/2026-02-05/10430911278391_fa1b591ce3d0ba12e926_72.jpg" },
  { email: "jeebin@eoeoeo.net", name: "Jeebin", avatar: "https://avatars.slack-edge.com/2025-11-05/9853874266722_48b6d321bb58da1a675d_72.png" },
  { email: "dwkim@eoeoeo.net", name: "Dowon", avatar: "https://avatars.slack-edge.com/2026-02-11/10480953444035_2dd7747773106799424b_72.jpg" },
  { email: "zen.park@eoeoeo.net", name: "Zen", avatar: "https://avatars.slack-edge.com/2026-02-16/10512667182163_c93459dc357d6036d9c7_72.png" },
  { email: "soyoung@eoeoeo.net", name: "SoYoung", avatar: "https://avatars.slack-edge.com/2026-03-02/10611934933044_47498e699880c2c05840_72.png" },
  { email: "ksm@eoeoeo.net", name: "Sumin", avatar: "https://avatars.slack-edge.com/2023-04-20/5152073900257_45c48421221f6f877f8b_72.png" },
  { email: "dev@eoeoeo.net", name: "Dev" },
  // — Ash's Agent Squad (Mock/Gemini/GPT 전용) —
  { email: "jay@eostudio.tv", name: "Jay" },
  { email: "alex@eostudio.tv", name: "Alex" },
  { email: "yuna@eostudio.tv", name: "Yuna" },
  { email: "chris@eostudio.tv", name: "Chris" },
];

export const EMAIL_TO_NAME: Record<string, string> = Object.fromEntries(
  TEAM_MEMBERS.flatMap((m) => {
    const lower = m.email.toLowerCase();
    const username = lower.split("@")[0];
    return [[lower, m.name], [username, m.name]];
  })
);

export const NAME_TO_AVATAR: Record<string, string> = Object.fromEntries(
  TEAM_MEMBERS.filter((m) => m.avatar).map((m) => [m.name, m.avatar!])
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

/** actor → 표시 이름 변환 (이메일/username 대소문자 무관 매핑) */
export function resolveActorName(actor: { email_address?: string | null; id: string }): string {
  const email = (actor.email_address ?? actor.id).toLowerCase();
  return EMAIL_TO_NAME[email] ?? EMAIL_TO_NAME[email.split("@")[0]] ?? email.split("@")[0];
}

// 대시보드에서 제외할 이메일
export const EXCLUDED_EMAILS = new Set(["ash@eostudio.tv"]);

// API 기본값
export const DEFAULT_DAYS = 30;

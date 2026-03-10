import { resolveActorName, TEAM_MEMBERS } from "@/lib/constants";
import { startOfWeek, format, parseISO } from "date-fns";
import type { ClaudeCodeDataPoint } from "@/lib/types";

// === Types ===
export interface LevelInfo {
  level: number;
  requiredXp: number;
  titleKo: string;
  titleEn: string;
  icon: string;
  color: [string, string]; // gradient [from, to]
  logEn: string;           // system log flavor text
}

export interface Achievement {
  id: string;
  name: string;
  category: "onboarding" | "streak" | "volume" | "cumulative" | "multi" | "champion" | "time" | "milestone";
  icon: string;
  conditionKo: string;
  conditionEn: string;
}

export interface UserProfile {
  email: string;
  name: string;
  avatar?: string;
  xp: number;
  level: LevelInfo;
  nextLevel: LevelInfo | null;
  xpInLevel: number;
  xpToNext: number;
  progressPercent: number;
  totalTokens: number;
  activeDays: number;
  totalCommits: number;
  totalPRs: number;
  currentStreak: number;
  maxStreak: number;
  earnedAchievements: string[];
  achievedAt: Record<string, string>; // achievementId → ISO date (YYYY-MM-DD)
  tools: Set<string>;
  models: Set<string>;
  rawXp: number;           // decay 적용 전 원래 XP
  decayDays: number;       // 유예 후 감소 적용 일수 (0이면 감소 없음)
  daysSinceLastActivity: number;
}

// === Level Table (Space Explorer Ranks) ===
export const LEVELS: LevelInfo[] = [
  { level: 1, requiredXp: 0,          titleKo: "스카우트",       titleEn: "Scout",        icon: "📡", color: ["#666","#888"],     logEn: "[LOG] New scout detected. Awaiting first contact." },
  { level: 2, requiredXp: 15_000,     titleKo: "레인저",         titleEn: "Ranger",       icon: "🛰️", color: ["#4A9EFF","#6BB5FF"], logEn: "[LOG] Basic tools acquired. Field operations authorized." },
  { level: 3, requiredXp: 80_000,     titleKo: "탐험가",         titleEn: "Explorer",     icon: "🌍", color: ["#00E87A","#4AFFA0"], logEn: "[LOG] Explorer protocol active. Mapping uncharted territory." },
  { level: 4, requiredXp: 300_000,    titleKo: "패스파인더",     titleEn: "Pathfinder",   icon: "🧬", color: ["#00CED1","#48D1CC"], logEn: "[LOG] Unique path divergence detected. Self-navigation engaged." },
  { level: 5, requiredXp: 1_000_000,  titleKo: "파이오니어",     titleEn: "Pioneer",      icon: "☄️", color: ["#A855F7","#C084FC"], logEn: "[LOG] Breakthrough pattern identified. New methods emerging." },
  { level: 6, requiredXp: 3_000_000,  titleKo: "뱅가드",         titleEn: "Vanguard",     icon: "🚀", color: ["#F59E0B","#FBBF24"], logEn: "[LOG] Vanguard status confirmed. Leading expedition team." },
  { level: 7, requiredXp: 10_000_000, titleKo: "트레일블레이저", titleEn: "Trailblazer",  icon: "🌌", color: ["#EF4444","#F97316"], logEn: "[LOG] ⚠ Anomaly: Subject producing AI-native artifacts." },
  { level: 8, requiredXp: 50_000_000, titleKo: "AI 네이티브",     titleEn: "AI Native",    icon: "✦",  color: ["#E8FF47","#00E87A"], logEn: "[LOG] ★ Transformation complete. Human-AI boundary dissolved." },
];

// === Achievements (38) — AI Explorer's Log ===
export const ACHIEVEMENTS: Achievement[] = [
  // First Steps (4)
  { id: "first-light",     name: "First Contact",      category: "onboarding", icon: "🔭", conditionKo: "첫 토큰 사용",          conditionEn: "First token usage" },
  { id: "first-commit",    name: "First Mark",         category: "onboarding", icon: "🏁", conditionKo: "AI로 첫 커밋",          conditionEn: "First AI commit" },
  { id: "first-pr",        name: "First Report",       category: "onboarding", icon: "📋", conditionKo: "AI로 첫 PR",            conditionEn: "First AI PR" },
  { id: "level-up",        name: "Base Camp",          category: "onboarding", icon: "⛺", conditionKo: "Lv.2 달성",             conditionEn: "Reach Lv.2" },

  // Field Log (13)
  { id: "streak-2",        name: "Two Steps",          category: "streak",     icon: "👣", conditionKo: "2일 연속 사용",          conditionEn: "2 consecutive days" },
  { id: "streak-3",        name: "Trail Found",        category: "streak",     icon: "🔍", conditionKo: "3일 연속 사용",          conditionEn: "3 consecutive days" },
  { id: "streak-5",        name: "Steady Pace",        category: "streak",     icon: "🥾", conditionKo: "5일 연속 사용",          conditionEn: "5 consecutive days" },
  { id: "streak-7",        name: "Weekly Log",         category: "streak",     icon: "📓", conditionKo: "7일 연속 사용",          conditionEn: "7 consecutive days" },
  { id: "streak-14",       name: "Deep Trail",         category: "streak",     icon: "🗺️", conditionKo: "14일 연속 사용",         conditionEn: "14 consecutive days" },
  { id: "streak-30",       name: "Expedition",         category: "streak",     icon: "🏕️", conditionKo: "30일 연속 사용",         conditionEn: "30 consecutive days" },
  { id: "streak-60",       name: "Long March",         category: "streak",     icon: "🚶", conditionKo: "60일 연속 사용",         conditionEn: "60 consecutive days" },
  { id: "streak-100",      name: "Cartographer",       category: "streak",     icon: "🗺️", conditionKo: "100일 연속 사용",        conditionEn: "100 consecutive days" },
  { id: "streak-150",      name: "Chronicler",         category: "streak",     icon: "📜", conditionKo: "150일 연속 사용",        conditionEn: "150 consecutive days" },
  { id: "streak-200",      name: "Wayfinder",          category: "streak",     icon: "🧭", conditionKo: "200일 연속 사용",        conditionEn: "200 consecutive days" },
  { id: "streak-365",      name: "Year One",           category: "streak",     icon: "📅", conditionKo: "365일 연속 사용",        conditionEn: "365 consecutive days" },
  { id: "streak-500",      name: "Living Map",         category: "streak",     icon: "🌐", conditionKo: "500일 연속 사용",        conditionEn: "500 consecutive days" },
  { id: "streak-1000",     name: "Eternal Log",        category: "streak",     icon: "♾️", conditionKo: "1000일 연속 사용",       conditionEn: "1000 consecutive days" },

  // Energy Source (5)
  { id: "vol-100k",        name: "Spark",              category: "volume",     icon: "✨", conditionKo: "일일 output 100K",       conditionEn: "Daily output 100K" },
  { id: "vol-1m",          name: "Generator",          category: "volume",     icon: "⚙️", conditionKo: "일일 output 1M",         conditionEn: "Daily output 1M" },
  { id: "vol-5m",          name: "Reactor",            category: "volume",     icon: "⚛️", conditionKo: "일일 output 5M",         conditionEn: "Daily output 5M" },
  { id: "vol-10m",         name: "Supernova",          category: "volume",     icon: "💥", conditionKo: "일일 output 10M",        conditionEn: "Daily output 10M" },
  { id: "vol-20m",         name: "Singularity Burst",  category: "volume",     icon: "🌑", conditionKo: "일일 output 20M",        conditionEn: "Daily output 20M" },

  // Discoveries (4)
  { id: "commits-50",      name: "Sample Collected",   category: "cumulative", icon: "🧪", conditionKo: "누적 커밋 50건",         conditionEn: "50 cumulative commits" },
  { id: "commits-200",     name: "Archive Built",      category: "cumulative", icon: "🗄️", conditionKo: "누적 커밋 200건",        conditionEn: "200 cumulative commits" },
  { id: "commits-500",     name: "Library",            category: "cumulative", icon: "📚", conditionKo: "누적 커밋 500건",        conditionEn: "500 cumulative commits" },
  { id: "prs-50",          name: "Published",          category: "cumulative", icon: "📰", conditionKo: "누적 PR 50건",           conditionEn: "50 cumulative PRs" },

  // Multi-Tool (3)
  { id: "dual-wielder",    name: "Dual Lens",          category: "multi",      icon: "🔍", conditionKo: "2개 도구 사용",          conditionEn: "2 tools used" },
  { id: "triple-threat",   name: "Swiss Knife",        category: "multi",      icon: "🔧", conditionKo: "3개 도구 모두 사용",     conditionEn: "All 3 tools used" },
  { id: "polyglot",        name: "Polyglot",           category: "multi",      icon: "🌐", conditionKo: "3개 이상 모델 사용",     conditionEn: "3+ models used" },

  // Expedition Lead (4)
  { id: "weekly-champ-1",  name: "Point Person",       category: "champion",   icon: "🎯", conditionKo: "주간 1위 1회",           conditionEn: "Weekly #1 once" },
  { id: "weekly-champ-3",  name: "Lead Scout",         category: "champion",   icon: "🏅", conditionKo: "주간 1위 3회 연속",      conditionEn: "Weekly #1 3x consecutive" },
  { id: "weekly-champ-10", name: "Chief Explorer",     category: "champion",   icon: "⭐", conditionKo: "주간 1위 누적 10회",     conditionEn: "Weekly #1 10x total" },
  { id: "weekly-champ-20", name: "Grand Navigator",    category: "champion",   icon: "👑", conditionKo: "주간 1위 누적 20회",     conditionEn: "Weekly #1 20x total" },

  // Night Watch (3)
  { id: "night-owl",       name: "Midnight Recon",     category: "time",       icon: "🌙", conditionKo: "자정~6시 활동",          conditionEn: "Activity 00:00-06:00" },
  { id: "early-bird",      name: "Dawn Watch",         category: "time",       icon: "🌅", conditionKo: "6시~8시 활동",           conditionEn: "Activity 06:00-08:00" },
  { id: "weekend-warrior", name: "Off-Grid Expedition", category: "time",      icon: "🏕️", conditionKo: "주말 활동",              conditionEn: "Weekend activity" },

  // Transformation (2)
  { id: "wizard-class",    name: "Awakening",          category: "milestone",  icon: "☄️", conditionKo: "Lv.5 파이오니어 달성",   conditionEn: "Reach Lv.5 Pioneer" },
  { id: "transcendence",   name: "AI Native",          category: "milestone",  icon: "✦",  conditionKo: "Lv.8 AI Native 달성",    conditionEn: "Reach Lv.8 AI Native" },
];

// Category display order & labels
export const ACHIEVEMENT_CATEGORIES = [
  { key: "onboarding",  labelKo: "첫 발자국",   labelEn: "First Steps" },
  { key: "streak",       labelKo: "탐사 일지",   labelEn: "Field Log" },
  { key: "volume",       labelKo: "에너지원",    labelEn: "Energy Source" },
  { key: "cumulative",   labelKo: "탐사 성과",   labelEn: "Discoveries" },
  { key: "multi",        labelKo: "멀티툴",      labelEn: "Multi-Tool" },
  { key: "champion",     labelKo: "선봉대장",    labelEn: "Expedition Lead" },
  { key: "time",         labelKo: "야간 탐사",   labelEn: "Night Watch" },
  { key: "milestone",    labelKo: "변환점",      labelEn: "Transformation" },
] as const;

// === Manual Promotion ===
// Lv.7(Trailblazer), Lv.8(AI Native)는 XP 충족 + 심사 통과 필요
// 심사 기준: AI로 만든 프로덕트 결과물 평가 + 팀 동료 추천
//   - Lv.7: AI 활용 프로덕트 1개 이상 완성 + 팀 내 발표/데모
//   - Lv.8: AI 활용 프로덕트 3개 이상 + 외부 공유 가능 수준 + 팀 투표 과반
const PROMOTED_USERS: Record<string, number> = {
  // "email@eoeoeo.net": 7,  // Lv.7 심사 통과
  // "email@eoeoeo.net": 8,  // Lv.8 심사 통과
};

// XP만으로 자동 도달 가능한 최대 레벨
export const AUTO_LEVEL_CAP = 6;

// === XP Decay ===
// 7일 유예 후 매일 현재 XP의 1%씩 감소 (복리)
const DECAY_GRACE_DAYS = 7;
const DECAY_RATE_PER_DAY = 0.01;

function applyDecay(xp: number, daysSinceLastActivity: number): { decayedXp: number; decayDays: number } {
  if (daysSinceLastActivity <= DECAY_GRACE_DAYS) return { decayedXp: xp, decayDays: 0 };
  const decayDays = daysSinceLastActivity - DECAY_GRACE_DAYS;
  const decayedXp = Math.floor(xp * Math.pow(1 - DECAY_RATE_PER_DAY, decayDays));
  return { decayedXp, decayDays };
}

// === Tool Detection ===
function detectTool(model: string): "claude" | "codex" | "gemini" {
  if (model.startsWith("gpt")) return "codex";
  if (model.startsWith("gemini")) return "gemini";
  return "claude";
}

// === Level Resolver ===
export function getLevel(xp: number, email?: string): LevelInfo {
  const promotedLevel = email ? PROMOTED_USERS[email.toLowerCase()] ?? 0 : 0;
  let result = LEVELS[0];
  for (const lv of LEVELS) {
    if (xp < lv.requiredXp) break;
    // Lv.7+ requires manual promotion
    if (lv.level > AUTO_LEVEL_CAP && lv.level > promotedLevel) break;
    result = lv;
  }
  return result;
}

export function getNextLevel(currentLevel: LevelInfo): LevelInfo | null {
  const idx = LEVELS.findIndex((l) => l.level === currentLevel.level);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

// === Streak Calculator ===
function calcStreak(activeDates: string[]): { current: number; max: number } {
  if (activeDates.length === 0) return { current: 0, max: 0 };
  const sorted = [...new Set(activeDates)].sort();
  let max = 1, current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 1;
    }
  }
  return { current, max };
}

// === Daily Output Max ===
function maxDailyOutput(data: ClaudeCodeDataPoint[], email: string): number {
  const dailyMap = new Map<string, number>();
  for (const d of data) {
    if ((d.actor.email_address ?? d.actor.id).toLowerCase() !== email) continue;
    dailyMap.set(d.date, (dailyMap.get(d.date) ?? 0) + d.output_tokens);
  }
  return dailyMap.size > 0 ? Math.max(...dailyMap.values()) : 0;
}

// === Weekly Champions ===
function getWeeklyChampionHistory(data: ClaudeCodeDataPoint[]): Map<string, string> {
  const weekUserMap = new Map<string, Map<string, number>>();
  for (const d of data) {
    if (!d.date) continue;
    const weekStart = startOfWeek(parseISO(d.date), { weekStartsOn: 1 });
    const weekKey = format(weekStart, "yyyy-MM-dd");
    const name = resolveActorName(d.actor);
    const tokens = d.input_tokens + d.output_tokens;
    if (!weekUserMap.has(weekKey)) weekUserMap.set(weekKey, new Map());
    const userMap = weekUserMap.get(weekKey)!;
    userMap.set(name, (userMap.get(name) ?? 0) + tokens);
  }
  const winners = new Map<string, string>();
  for (const [weekKey, userMap] of weekUserMap) {
    let topName = "", topTokens = 0;
    for (const [name, tokens] of userMap) {
      if (tokens > topTokens) { topName = name; topTokens = tokens; }
    }
    if (topName) winners.set(weekKey, topName);
  }
  return winners;
}

// === Achievement Evaluator ===
function evaluateAchievements(profile: {
  totalTokens: number; totalCommits: number; totalPRs: number;
  maxStreak: number; level: number; tools: Set<string>; models: Set<string>;
  maxDailyOutput: number; weeklyChampWins: number; weeklyChampConsecutive: number;
  hasWeekendActivity: boolean; hasNightActivity: boolean; hasEarlyActivity: boolean;
}): string[] {
  const earned: string[] = [];
  const p = profile;

  // Onboarding
  if (p.totalTokens > 0) earned.push("first-light");
  if (p.totalCommits > 0) earned.push("first-commit");
  if (p.totalPRs > 0) earned.push("first-pr");
  if (p.level >= 2) earned.push("level-up");

  // Streak
  const streakThresholds = [2,3,5,7,14,30,60,100,150,200,365,500,1000];
  const streakIds = ["streak-2","streak-3","streak-5","streak-7","streak-14","streak-30","streak-60","streak-100","streak-150","streak-200","streak-365","streak-500","streak-1000"];
  for (let i = 0; i < streakThresholds.length; i++) {
    if (p.maxStreak >= streakThresholds[i]) earned.push(streakIds[i]);
  }

  // Volume
  if (p.maxDailyOutput >= 100_000) earned.push("vol-100k");
  if (p.maxDailyOutput >= 1_000_000) earned.push("vol-1m");
  if (p.maxDailyOutput >= 5_000_000) earned.push("vol-5m");
  if (p.maxDailyOutput >= 10_000_000) earned.push("vol-10m");
  if (p.maxDailyOutput >= 20_000_000) earned.push("vol-20m");

  // Cumulative
  if (p.totalCommits >= 50) earned.push("commits-50");
  if (p.totalCommits >= 200) earned.push("commits-200");
  if (p.totalCommits >= 500) earned.push("commits-500");
  if (p.totalPRs >= 50) earned.push("prs-50");

  // Multi-tool
  if (p.tools.size >= 2) earned.push("dual-wielder");
  if (p.tools.size >= 3) earned.push("triple-threat");
  if (p.models.size >= 3) earned.push("polyglot");

  // Champion
  if (p.weeklyChampWins >= 1) earned.push("weekly-champ-1");
  if (p.weeklyChampConsecutive >= 3) earned.push("weekly-champ-3");
  if (p.weeklyChampWins >= 10) earned.push("weekly-champ-10");
  if (p.weeklyChampWins >= 20) earned.push("weekly-champ-20");

  // Time-based
  if (p.hasNightActivity) earned.push("night-owl");
  if (p.hasEarlyActivity) earned.push("early-bird");
  if (p.hasWeekendActivity) earned.push("weekend-warrior");

  // Level milestones
  if (p.level >= 5) earned.push("wizard-class");
  if (p.level >= 8) earned.push("transcendence");

  return earned;
}

// === Achievement Date Tracker ===
// 데이터를 시간순으로 리플레이하여 각 업적이 처음 달성된 날짜를 계산
function computeAchievementDates(
  points: ClaudeCodeDataPoint[],
  championHistory: Map<string, string>,
  userName: string,
  email: string,
): Record<string, string> {
  const achievedAt: Record<string, string> = {};

  // 날짜별 집계
  const dailyAgg = new Map<string, { tokens: number; commits: number; prs: number; output: number; tools: Set<string>; models: Set<string> }>();
  for (const d of points) {
    if (!d.date) continue;
    let day = dailyAgg.get(d.date);
    if (!day) {
      day = { tokens: 0, commits: 0, prs: 0, output: 0, tools: new Set(), models: new Set() };
      dailyAgg.set(d.date, day);
    }
    day.tokens += d.input_tokens + d.output_tokens;
    day.commits += d.commits;
    day.prs += d.pull_requests;
    day.output += d.output_tokens;
    day.tools.add(detectTool(d.model));
    day.models.add(d.model);
  }

  const sortedDates = [...dailyAgg.keys()].sort();
  let runningTokens = 0, runningCommits = 0, runningPRs = 0;
  const allTools = new Set<string>();
  const allModels = new Set<string>();

  // 스트릭 증분 추적
  let currentStreak = 0, maxStreak = 0;
  let prevDate: string | null = null;

  const mark = (id: string, date: string) => {
    if (!achievedAt[id]) achievedAt[id] = date;
  };

  for (const date of sortedDates) {
    const day = dailyAgg.get(date)!;
    runningTokens += day.tokens;
    runningCommits += day.commits;
    runningPRs += day.prs;
    for (const t of day.tools) allTools.add(t);
    for (const m of day.models) allModels.add(m);

    // 스트릭 계산 (증분)
    if (prevDate) {
      const diffMs = new Date(date).getTime() - new Date(prevDate).getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
    } else {
      currentStreak = 1;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    prevDate = date;

    // XP → 레벨 (decay 제외, 달성 시점 기준)
    const tokenXp = Math.floor(runningTokens / 10_000);
    const activeDays = new Set(sortedDates.slice(0, sortedDates.indexOf(date) + 1)).size;
    const dayXp = activeDays * 50;
    const commitXp = runningCommits * 10;
    const prXp = runningPRs * 30;
    const streakBonusDays = Math.max(0, maxStreak - 2);
    const streakBonus = Math.floor(streakBonusDays * 50 * 0.5);
    const xp = tokenXp + dayXp + commitXp + prXp + streakBonus;
    const level = getLevel(xp, email);

    // --- 업적 체크 ---
    // Onboarding
    mark("first-light", date);
    if (runningCommits > 0) mark("first-commit", date);
    if (runningPRs > 0) mark("first-pr", date);
    if (level.level >= 2) mark("level-up", date);

    // Streak
    const sThresh = [2,3,5,7,14,30,60,100,150,200,365,500,1000];
    const sIds = ["streak-2","streak-3","streak-5","streak-7","streak-14","streak-30","streak-60","streak-100","streak-150","streak-200","streak-365","streak-500","streak-1000"];
    for (let i = 0; i < sThresh.length; i++) {
      if (maxStreak >= sThresh[i]) mark(sIds[i], date);
    }

    // Volume (일일 output)
    const vThresh = [100_000, 1_000_000, 5_000_000, 10_000_000, 20_000_000];
    const vIds = ["vol-100k", "vol-1m", "vol-5m", "vol-10m", "vol-20m"];
    for (let i = 0; i < vThresh.length; i++) {
      if (day.output >= vThresh[i]) mark(vIds[i], date);
    }

    // Cumulative
    if (runningCommits >= 50) mark("commits-50", date);
    if (runningCommits >= 200) mark("commits-200", date);
    if (runningCommits >= 500) mark("commits-500", date);
    if (runningPRs >= 50) mark("prs-50", date);

    // Multi-tool
    if (allTools.size >= 2) mark("dual-wielder", date);
    if (allTools.size >= 3) mark("triple-threat", date);
    if (allModels.size >= 3) mark("polyglot", date);

    // Weekend
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) mark("weekend-warrior", date);

    // Level milestones
    if (level.level >= 5) mark("wizard-class", date);
    if (level.level >= 8) mark("transcendence", date);
  }

  // Champion 업적 — 주차별 시간순 처리
  const sortedWeeks = [...championHistory.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  let champWins = 0, champConsecutive = 0, tempConsecutive = 0;
  for (const [weekKey, winner] of sortedWeeks) {
    if (winner === userName) {
      champWins++;
      tempConsecutive++;
      champConsecutive = Math.max(champConsecutive, tempConsecutive);
    } else {
      tempConsecutive = 0;
    }
    if (champWins >= 1) mark("weekly-champ-1", weekKey);
    if (champConsecutive >= 3) mark("weekly-champ-3", weekKey);
    if (champWins >= 10) mark("weekly-champ-10", weekKey);
    if (champWins >= 20) mark("weekly-champ-20", weekKey);
  }

  // Night/Early — 현재 데이터에 시간 정보 없음 (hardcoded false)

  return achievedAt;
}

// === Main: Build All Profiles ===
export function buildProfiles(data: ClaudeCodeDataPoint[]): UserProfile[] {
  const userDataMap = new Map<string, ClaudeCodeDataPoint[]>();
  for (const d of data) {
    const email = (d.actor.email_address ?? d.actor.id).toLowerCase();
    if (!userDataMap.has(email)) userDataMap.set(email, []);
    userDataMap.get(email)!.push(d);
  }

  const champions = getWeeklyChampionHistory(data);

  const profiles: UserProfile[] = [];
  for (const [email, points] of userDataMap) {
    const name = resolveActorName(points[0].actor);
    const member = TEAM_MEMBERS.find((m) => m.email.toLowerCase() === email);

    let totalTokens = 0, totalCommits = 0, totalPRs = 0;
    const activeDates: string[] = [];
    const tools = new Set<string>();
    const models = new Set<string>();

    for (const d of points) {
      totalTokens += d.input_tokens + d.output_tokens;
      totalCommits += d.commits;
      totalPRs += d.pull_requests;
      if (d.date) activeDates.push(d.date);
      tools.add(detectTool(d.model));
      models.add(d.model);
    }

    const activeDays = new Set(activeDates).size;
    const { current: currentStreak, max: maxStreak } = calcStreak(activeDates);

    // XP calculation
    const tokenXp = Math.floor(totalTokens / 10_000);
    const dayXp = activeDays * 50;
    const commitXp = totalCommits * 10;
    const prXp = totalPRs * 30;
    const streakBonusDays = Math.max(0, maxStreak - 2);
    const streakBonus = Math.floor(streakBonusDays * 50 * 0.5);
    const rawXp = tokenXp + dayXp + commitXp + prXp + streakBonus;

    // XP Decay: 마지막 활동 후 7일 유예, 이후 일 1% 감소
    const sortedDates = [...new Set(activeDates)].sort();
    const lastActiveDate = sortedDates[sortedDates.length - 1];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysSinceLastActivity = lastActiveDate
      ? Math.floor((today.getTime() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const { decayedXp, decayDays } = applyDecay(rawXp, daysSinceLastActivity);
    const xp = decayedXp;

    const level = getLevel(xp, email);
    const nextLevel = getNextLevel(level);
    const xpInLevel = xp - level.requiredXp;
    const xpToNext = nextLevel ? nextLevel.requiredXp - level.requiredXp : 0;
    const progressPercent = xpToNext > 0 ? Math.min(100, Math.round((xpInLevel / xpToNext) * 100)) : 100;

    // Weekly champion stats
    let weeklyChampWins = 0, weeklyChampConsecutive = 0, tempConsecutive = 0;
    const sortedWeeks = [...champions.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [, winner] of sortedWeeks) {
      if (winner === name) { weeklyChampWins++; tempConsecutive++; weeklyChampConsecutive = Math.max(weeklyChampConsecutive, tempConsecutive); }
      else { tempConsecutive = 0; }
    }

    const hasWeekendActivity = activeDates.some((d) => { const day = new Date(d).getDay(); return day === 0 || day === 6; });
    const dailyOutput = maxDailyOutput(data, email);

    const earnedAchievements = evaluateAchievements({
      totalTokens, totalCommits, totalPRs, maxStreak,
      level: level.level, tools, models, maxDailyOutput: dailyOutput,
      weeklyChampWins, weeklyChampConsecutive,
      hasWeekendActivity, hasNightActivity: false, hasEarlyActivity: false,
    });

    const achievedAt = computeAchievementDates(points, champions, name, email);

    profiles.push({
      email, name, avatar: member?.avatar,
      xp, level, nextLevel, xpInLevel, xpToNext, progressPercent,
      totalTokens, activeDays, totalCommits, totalPRs,
      currentStreak, maxStreak, earnedAchievements, achievedAt, tools, models,
      rawXp, decayDays, daysSinceLastActivity,
    });
  }

  return profiles.sort((a, b) => b.xp - a.xp);
}

// === Achievement Progress Helper ===
function prog(current: number, target: number) {
  return { current: Math.min(current, target), target, percent: Math.min(100, Math.round((current / target) * 100)) };
}

// === Rarity ===
export type Rarity = "common" | "rare" | "epic" | "legendary";

// 전체 프로필 배열에서 각 업적의 달성률을 계산하여 레어도를 반환
export function getAchievementRarity(achievementId: string, allProfiles: UserProfile[]): Rarity {
  if (allProfiles.length === 0) return "common";
  const earnedCount = allProfiles.filter(p => p.earnedAchievements.includes(achievementId)).length;
  const rate = earnedCount / allProfiles.length;
  if (rate < 0.1) return "legendary";
  if (rate < 0.3) return "epic";
  if (rate < 0.6) return "rare";
  return "common";
}

export const RARITY_COLORS: Record<Rarity, string> = {
  common: "",
  rare: "#C0C0C0",
  epic: "#A855F7",
  legendary: "#F59E0B",
};

export function getAchievementProgress(achievementId: string, profile: UserProfile): { current: number; target: number; percent: number } | null {
  const streakMatch = achievementId.match(/^streak-(\d+)$/);
  if (streakMatch) { const t = Number(streakMatch[1]); return prog(profile.maxStreak, t); }
  if (achievementId === "commits-50") return prog(profile.totalCommits, 50);
  if (achievementId === "commits-200") return prog(profile.totalCommits, 200);
  if (achievementId === "commits-500") return prog(profile.totalCommits, 500);
  if (achievementId === "prs-50") return prog(profile.totalPRs, 50);
  if (achievementId === "first-light") return prog(profile.totalTokens > 0 ? 1 : 0, 1);
  if (achievementId === "first-commit") return prog(profile.totalCommits > 0 ? 1 : 0, 1);
  if (achievementId === "first-pr") return prog(profile.totalPRs > 0 ? 1 : 0, 1);
  if (achievementId === "level-up") return prog(profile.level.level >= 2 ? 1 : 0, 1);
  if (achievementId === "dual-wielder") return prog(profile.tools.size, 2);
  if (achievementId === "triple-threat") return prog(profile.tools.size, 3);
  if (achievementId === "polyglot") return prog(profile.models.size, 3);
  if (achievementId === "wizard-class") return prog(profile.level.level, 5);
  if (achievementId === "transcendence") return prog(profile.level.level, 8);
  return null;
}

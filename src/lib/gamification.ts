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
  tools: Set<string>;
  models: Set<string>;
}

// === Level Table ===
export const LEVELS: LevelInfo[] = [
  { level: 1, requiredXp: 0,         titleKo: "코드 새싹",   titleEn: "Code Sprout",  icon: "🌱" },
  { level: 2, requiredXp: 100,       titleKo: "견습 코더",   titleEn: "Apprentice",   icon: "⚡" },
  { level: 3, requiredXp: 500,       titleKo: "코드 기사",   titleEn: "Code Knight",  icon: "⚔️" },
  { level: 4, requiredXp: 2_000,     titleKo: "마법 개발자", titleEn: "Arcane Dev",   icon: "🔮" },
  { level: 5, requiredXp: 10_000,    titleKo: "코드 마법사", titleEn: "Code Wizard",  icon: "🧙" },
  { level: 6, requiredXp: 50_000,    titleKo: "대마법사",    titleEn: "Archmage",     icon: "🌟" },
  { level: 7, requiredXp: 200_000,   titleKo: "전설의 코더", titleEn: "Legendary",    icon: "👑" },
  { level: 8, requiredXp: 1_000_000, titleKo: "AI 네이티브", titleEn: "AI Native",    icon: "🐉" },
];

// === Achievements (38) ===
export const ACHIEVEMENTS: Achievement[] = [
  // Onboarding (4)
  { id: "first-light",     name: "First Light",        category: "onboarding", icon: "🌅", conditionKo: "첫 토큰 사용",          conditionEn: "First token usage" },
  { id: "first-commit",    name: "First Commit",       category: "onboarding", icon: "📝", conditionKo: "AI로 첫 커밋",          conditionEn: "First AI commit" },
  { id: "first-pr",        name: "First PR",           category: "onboarding", icon: "🔀", conditionKo: "AI로 첫 PR",            conditionEn: "First AI PR" },
  { id: "level-up",        name: "Level Up!",          category: "onboarding", icon: "🎓", conditionKo: "Lv.2 달성",             conditionEn: "Reach Lv.2" },

  // Streak (13)
  { id: "streak-2",        name: "Spark",              category: "streak",     icon: "🕯️", conditionKo: "2일 연속 사용",          conditionEn: "2 consecutive days" },
  { id: "streak-3",        name: "On Fire",            category: "streak",     icon: "🔥", conditionKo: "3일 연속 사용",          conditionEn: "3 consecutive days" },
  { id: "streak-5",        name: "Blazing",            category: "streak",     icon: "🔥🔥", conditionKo: "5일 연속 사용",        conditionEn: "5 consecutive days" },
  { id: "streak-7",        name: "Unstoppable",        category: "streak",     icon: "☄️", conditionKo: "7일 연속 사용",          conditionEn: "7 consecutive days" },
  { id: "streak-14",       name: "Two Weeks Strong",   category: "streak",     icon: "🌟", conditionKo: "14일 연속 사용",         conditionEn: "14 consecutive days" },
  { id: "streak-30",       name: "Diamond Streak",     category: "streak",     icon: "💎", conditionKo: "30일 연속 사용",         conditionEn: "30 consecutive days" },
  { id: "streak-60",       name: "Iron Will",          category: "streak",     icon: "🏔️", conditionKo: "60일 연속 사용",         conditionEn: "60 consecutive days" },
  { id: "streak-100",      name: "Eternal Flame",      category: "streak",     icon: "🐉", conditionKo: "100일 연속 사용",        conditionEn: "100 consecutive days" },
  { id: "streak-150",      name: "Alchemist",          category: "streak",     icon: "⚗️", conditionKo: "150일 연속 사용",        conditionEn: "150 consecutive days" },
  { id: "streak-200",      name: "Monolith",           category: "streak",     icon: "🗿", conditionKo: "200일 연속 사용",        conditionEn: "200 consecutive days" },
  { id: "streak-365",      name: "Event Horizon",      category: "streak",     icon: "🌌", conditionKo: "365일 연속 사용",        conditionEn: "365 consecutive days" },
  { id: "streak-500",      name: "Immortal",           category: "streak",     icon: "🪬", conditionKo: "500일 연속 사용",        conditionEn: "500 consecutive days" },
  { id: "streak-1000",     name: "Millennium",         category: "streak",     icon: "🏆∞", conditionKo: "1000일 연속 사용",      conditionEn: "1000 consecutive days" },

  // Volume (5)
  { id: "vol-100k",        name: "Chatty",             category: "volume",     icon: "💬", conditionKo: "일일 output 100K",       conditionEn: "Daily output 100K" },
  { id: "vol-1m",          name: "Token Flood",        category: "volume",     icon: "🌊", conditionKo: "일일 output 1M",         conditionEn: "Daily output 1M" },
  { id: "vol-5m",          name: "Eruption",           category: "volume",     icon: "🌋", conditionKo: "일일 output 5M",         conditionEn: "Daily output 5M" },
  { id: "vol-10m",         name: "Thunder",            category: "volume",     icon: "⚡", conditionKo: "일일 output 10M",        conditionEn: "Daily output 10M" },
  { id: "vol-20m",         name: "Supernova",          category: "volume",     icon: "🪐", conditionKo: "일일 output 20M",        conditionEn: "Daily output 20M" },

  // Cumulative (4)
  { id: "commits-50",      name: "Builder",            category: "cumulative", icon: "🧱", conditionKo: "누적 커밋 50건",         conditionEn: "50 cumulative commits" },
  { id: "commits-200",     name: "Architect",          category: "cumulative", icon: "🏗️", conditionKo: "누적 커밋 200건",        conditionEn: "200 cumulative commits" },
  { id: "commits-500",     name: "Monument",           category: "cumulative", icon: "🏛️", conditionKo: "누적 커밋 500건",        conditionEn: "500 cumulative commits" },
  { id: "prs-50",          name: "City Planner",       category: "cumulative", icon: "🌆", conditionKo: "누적 PR 50건",           conditionEn: "50 cumulative PRs" },

  // Multi-tool (3)
  { id: "dual-wielder",    name: "Dual Wielder",       category: "multi",      icon: "🤖", conditionKo: "2개 도구 사용",          conditionEn: "2 tools used" },
  { id: "triple-threat",   name: "Triple Threat",      category: "multi",      icon: "🎯", conditionKo: "3개 도구 모두 사용",     conditionEn: "All 3 tools used" },
  { id: "polyglot",        name: "Polyglot",           category: "multi",      icon: "🔄", conditionKo: "3개 이상 모델 사용",     conditionEn: "3+ models used" },

  // Champion (4)
  { id: "weekly-champ-1",  name: "Weekly Champion",    category: "champion",   icon: "🏆", conditionKo: "주간 1위 1회",           conditionEn: "Weekly #1 once" },
  { id: "weekly-champ-3",  name: "Reigning Champion",  category: "champion",   icon: "👑", conditionKo: "주간 1위 3회 연속",      conditionEn: "Weekly #1 3x consecutive" },
  { id: "weekly-champ-10", name: "Veteran Champion",   category: "champion",   icon: "🎖️", conditionKo: "주간 1위 누적 10회",     conditionEn: "Weekly #1 10x total" },
  { id: "weekly-champ-20", name: "GOAT",               category: "champion",   icon: "🐐", conditionKo: "주간 1위 누적 20회",     conditionEn: "Weekly #1 20x total" },

  // Time-based (3)
  { id: "night-owl",       name: "Night Owl",          category: "time",       icon: "🌙", conditionKo: "자정~6시 활동",          conditionEn: "Activity 00:00-06:00" },
  { id: "early-bird",      name: "Early Bird",         category: "time",       icon: "🌤️", conditionKo: "6시~8시 활동",           conditionEn: "Activity 06:00-08:00" },
  { id: "weekend-warrior", name: "Weekend Warrior",    category: "time",       icon: "🗓️", conditionKo: "주말 활동",              conditionEn: "Weekend activity" },

  // Level Milestone (2)
  { id: "wizard-class",    name: "Wizard Class",       category: "milestone",  icon: "🧙", conditionKo: "Lv.5 달성",             conditionEn: "Reach Lv.5" },
  { id: "transcendence",   name: "Transcendence",      category: "milestone",  icon: "🐉", conditionKo: "Lv.8 AI Native 달성",   conditionEn: "Reach Lv.8 AI Native" },
];

// Category display order & labels
export const ACHIEVEMENT_CATEGORIES = [
  { key: "onboarding",  labelKo: "입문",      labelEn: "Onboarding" },
  { key: "streak",       labelKo: "스트릭",    labelEn: "Streak" },
  { key: "volume",       labelKo: "볼륨",      labelEn: "Volume" },
  { key: "cumulative",   labelKo: "누적",      labelEn: "Cumulative" },
  { key: "multi",        labelKo: "멀티 도구", labelEn: "Multi-tool" },
  { key: "champion",     labelKo: "챔피언",    labelEn: "Champion" },
  { key: "time",         labelKo: "시간대",    labelEn: "Time" },
  { key: "milestone",    labelKo: "레벨",      labelEn: "Level" },
] as const;

// === Tool Detection ===
function detectTool(model: string): "claude" | "codex" | "gemini" {
  if (model.startsWith("gpt")) return "codex";
  if (model.startsWith("gemini")) return "gemini";
  return "claude";
}

// === Level Resolver ===
export function getLevel(xp: number): LevelInfo {
  let result = LEVELS[0];
  for (const lv of LEVELS) {
    if (xp >= lv.requiredXp) result = lv;
    else break;
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
    const tokens = d.input_tokens + d.output_tokens + d.cache_read_tokens;
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
      totalTokens += d.input_tokens + d.output_tokens + d.cache_read_tokens;
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
    const xp = tokenXp + dayXp + commitXp + prXp + streakBonus;

    const level = getLevel(xp);
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

    profiles.push({
      email, name, avatar: member?.avatar,
      xp, level, nextLevel, xpInLevel, xpToNext, progressPercent,
      totalTokens, activeDays, totalCommits, totalPRs,
      currentStreak, maxStreak, earnedAchievements, tools, models,
    });
  }

  return profiles.sort((a, b) => b.xp - a.xp);
}

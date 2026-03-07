import type { ClaudeCodeAnalyticsResponse } from "./types";
import { TEAM_MEMBERS, MODEL_CONFIG } from "./constants";

const MODELS = [
  "claude-sonnet-4-6",
  "claude-opus-4-6",
  "claude-haiku-4-5-20251001",
];

// 토큰 가중치: Sonnet 60%, Opus 25%, Haiku 15%
const MODEL_WEIGHTS = [0.6, 0.25, 0.15];

// 팀원별 가중치 (ash가 가장 많이 씀)
const USER_WEIGHTS = [0.35, 0.25, 0.20, 0.12, 0.08];

// 팀원별 수락률 특성 (베이스 값, 개인 스타일 반영)
const USER_ACCEPTANCE_BASE = [0.88, 0.82, 0.79, 0.75, 0.72];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getLast30Days(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function dayFactor(dateStr: string): number {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6 ? 0.4 : 1.0;
}

export function getMockAnalytics(): ClaudeCodeAnalyticsResponse {
  const dates = getLast30Days();
  const data = [];

  for (const date of dates) {
    const factor = dayFactor(date);
    const isWeekend = factor < 1;

    for (let ui = 0; ui < TEAM_MEMBERS.length; ui++) {
      const user = TEAM_MEMBERS[ui];
      const userWeight = USER_WEIGHTS[ui];
      const acceptanceBase = USER_ACCEPTANCE_BASE[ui];

      // lines_of_code, commits, PRs는 사용자×날짜 단위 지표 (모델 무관)
      const dailyLines = isWeekend ? 0 : randomBetween(
        Math.floor(30 * userWeight * 5),
        Math.floor(150 * userWeight * 5)
      );
      const dailyCommits = isWeekend ? 0 : randomBetween(0, Math.ceil(5 * userWeight * 3));
      const dailyPRs = isWeekend ? 0 : (Math.random() < userWeight * 2 ? randomBetween(0, 2) : 0);
      const dailyAcceptance = parseFloat(
        Math.min(0.98, acceptanceBase + (Math.random() - 0.5) * 0.1).toFixed(2)
      );

      for (let mi = 0; mi < MODELS.length; mi++) {
        const model = MODELS[mi];
        const modelWeight = MODEL_WEIGHTS[mi];
        const scale = 5_000_000 * userWeight * modelWeight * factor;

        const input_tokens = Math.floor(scale * randomBetween(70, 90) / 100);
        const output_tokens = Math.floor(scale * randomBetween(8, 15) / 100);
        const cache_read_tokens = Math.floor(scale * randomBetween(5, 15) / 100);
        const cache_creation_tokens = Math.floor(scale * randomBetween(1, 5) / 100);

        const modelConfig = MODEL_CONFIG[model];
        const inputPrice = modelConfig?.inputPricePerMillion ?? 3;
        const outputPrice = modelConfig?.outputPricePerMillion ?? 15;
        const estimated_cost_usd_cents = Math.floor(
          (input_tokens / 1_000_000) * inputPrice * 100 +
          (output_tokens / 1_000_000) * outputPrice * 100
        );

        if (input_tokens === 0) continue;

        data.push({
          actor: { type: "user" as const, id: `user-${ui}`, email_address: user.email },
          model,
          date,
          session_count: randomBetween(1, Math.ceil(8 * userWeight * 3)),
          // 사용자×날짜 지표는 첫 번째 모델(Sonnet)에만 실값, 나머지는 0
          lines_of_code: mi === 0 ? dailyLines : 0,
          commits: mi === 0 ? dailyCommits : 0,
          pull_requests: mi === 0 ? dailyPRs : 0,
          tool_acceptance_rate: dailyAcceptance,
          input_tokens,
          output_tokens,
          cache_read_tokens,
          cache_creation_tokens,
          estimated_cost_usd_cents,
        });
      }
    }
  }

  return { data };
}

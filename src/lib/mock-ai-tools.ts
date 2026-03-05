export interface AiMemberRow {
  name: string;
  initial: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  avgDailySessions: number;
  costTrend: number; // % vs 지난 달 (양수 = 증가, 음수 = 감소)
  acceptanceRate?: number; // Claude Code 전용
}

export function getMockGeminiData(): AiMemberRow[] {
  return [
    { name: "Jay",     initial: "J", inputTokens: 4_210_000, outputTokens: 630_000, totalTokens: 4_840_000, costUsd: 7.26,  avgDailySessions: 12, costTrend:  18.4 },
    { name: "Seohyun", initial: "S", inputTokens: 3_800_000, outputTokens: 720_000, totalTokens: 4_520_000, costUsd: 32.34, avgDailySessions:  9, costTrend: -5.2  },
    { name: "Alex",    initial: "A", inputTokens: 2_650_000, outputTokens: 410_000, totalTokens: 3_060_000, costUsd: 4.59,  avgDailySessions:  7, costTrend:  3.1  },
    { name: "Yuna",    initial: "Y", inputTokens: 2_940_000, outputTokens: 380_000, totalTokens: 3_320_000, costUsd: 2.49,  avgDailySessions:  5, costTrend:  41.0 },
    { name: "Chris",   initial: "C", inputTokens: 1_480_000, outputTokens: 210_000, totalTokens: 1_690_000, costUsd: 1.27,  avgDailySessions:  3, costTrend: -12.3 },
  ];
}

export function getMockGptData(): AiMemberRow[] {
  return [
    { name: "Seohyun", initial: "S", inputTokens: 2_100_000, outputTokens: 430_000, totalTokens: 2_530_000, costUsd: 18.42, avgDailySessions: 8, costTrend:  7.2  },
    { name: "Jay",     initial: "J", inputTokens: 1_540_000, outputTokens: 310_000, totalTokens: 1_850_000, costUsd: 13.47, avgDailySessions: 6, costTrend: -3.8  },
    { name: "Alex",    initial: "A", inputTokens: 3_800_000, outputTokens: 640_000, totalTokens: 4_440_000, costUsd: 2.66,  avgDailySessions: 14, costTrend: 22.5 },
    { name: "Yuna",    initial: "Y", inputTokens: 1_200_000, outputTokens: 190_000, totalTokens: 1_390_000, costUsd: 0.83,  avgDailySessions: 4, costTrend: -1.0  },
    { name: "Chris",   initial: "C", inputTokens:   620_000, outputTokens:  95_000, totalTokens:   715_000, costUsd: 0.43,  avgDailySessions: 2, costTrend:  0.0  },
  ];
}

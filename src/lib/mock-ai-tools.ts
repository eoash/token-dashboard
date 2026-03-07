export interface AiMemberRow {
  name: string;
  initial: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  avgDailySessions: number;
  acceptanceRate?: number; // Claude Code 전용
}

export function getMockGeminiData(): AiMemberRow[] {
  return [
    { name: "Jay",     initial: "J", inputTokens: 4_210_000, outputTokens: 630_000, totalTokens: 4_840_000, avgDailySessions: 12 },
    { name: "Seohyun", initial: "S", inputTokens: 3_800_000, outputTokens: 720_000, totalTokens: 4_520_000, avgDailySessions:  9 },
    { name: "Alex",    initial: "A", inputTokens: 2_650_000, outputTokens: 410_000, totalTokens: 3_060_000, avgDailySessions:  7 },
    { name: "Yuna",    initial: "Y", inputTokens: 2_940_000, outputTokens: 380_000, totalTokens: 3_320_000, avgDailySessions:  5 },
    { name: "Chris",   initial: "C", inputTokens: 1_480_000, outputTokens: 210_000, totalTokens: 1_690_000, avgDailySessions:  3 },
  ];
}

export function getMockGptData(): AiMemberRow[] {
  return [
    { name: "Seohyun", initial: "S", inputTokens: 2_100_000, outputTokens: 430_000, totalTokens: 2_530_000, avgDailySessions: 8 },
    { name: "Jay",     initial: "J", inputTokens: 1_540_000, outputTokens: 310_000, totalTokens: 1_850_000, avgDailySessions: 6 },
    { name: "Alex",    initial: "A", inputTokens: 3_800_000, outputTokens: 640_000, totalTokens: 4_440_000, avgDailySessions: 14 },
    { name: "Yuna",    initial: "Y", inputTokens: 1_200_000, outputTokens: 190_000, totalTokens: 1_390_000, avgDailySessions: 4 },
    { name: "Chris",   initial: "C", inputTokens:   620_000, outputTokens:  95_000, totalTokens:   715_000, avgDailySessions: 2 },
  ];
}

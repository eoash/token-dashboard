import { describe, it, expect } from "vitest";
import { computeDailyIncrease, tsToDate, MAX_HOURLY_DELTA } from "../prometheus";

// --- Helper: KST 날짜 → Unix timestamp (정오 KST = 03:00 UTC) ---
function kstNoon(dateStr: string): number {
  // tsToDate 역산: tsToDate(ts) = new Date((ts + 9*3600) * 1000).toISOString().slice(0,10)
  // 원하는 날짜 D의 정오 KST = D 03:00 UTC
  return new Date(`${dateStr}T03:00:00Z`).getTime() / 1000;
}

// 시리즈 데이터 생성 헬퍼
function makeSeries(
  email: string,
  model: string,
  values: [string, number][] // [date, cumulative_value]
): { metric: Record<string, string>; values: [number, string][] } {
  return {
    metric: { user_email: email, model },
    values: values.map(([d, v]) => [kstNoon(d), String(v)]),
  };
}

// ============================================================
// tsToDate
// ============================================================
describe("tsToDate", () => {
  it("UTC 03:00 → KST 정오 → 같은 날짜", () => {
    const ts = new Date("2026-03-10T03:00:00Z").getTime() / 1000;
    expect(tsToDate(ts)).toBe("2026-03-10");
  });

  it("UTC 14:59 → KST 23:59 → 같은 날짜", () => {
    const ts = new Date("2026-03-10T14:59:00Z").getTime() / 1000;
    expect(tsToDate(ts)).toBe("2026-03-10");
  });

  it("UTC 15:00 → KST 00:00 → 다음 날짜 (자정 경계)", () => {
    const ts = new Date("2026-03-10T15:00:00Z").getTime() / 1000;
    expect(tsToDate(ts)).toBe("2026-03-11");
  });
});

// ============================================================
// computeDailyIncrease — 정상 증가
// ============================================================
describe("computeDailyIncrease — 정상 증가", () => {
  it("연속 양의 delta → 일별 합산", () => {
    const series = [
      makeSeries("a@test.com", "sonnet", [
        ["2026-03-08", 100],  // padding (baseline)
        ["2026-03-09", 300],  // +200
        ["2026-03-09", 500],  // +200 (같은 날 다른 시간대)
        ["2026-03-10", 800],  // +300
      ]),
    ];

    const result = computeDailyIncrease(series, "2026-03-09");
    expect(result).toHaveLength(1);

    const values = result[0].values;
    const dayMap = new Map(values.map(([ts, v]) => [tsToDate(ts), Number(v)]));

    expect(dayMap.get("2026-03-09")).toBe(400); // 200 + 200
    expect(dayMap.get("2026-03-10")).toBe(300);
    expect(dayMap.has("2026-03-08")).toBe(false); // 패딩 제외
  });

  it("증가 없으면 빈 결과", () => {
    const series = [
      makeSeries("a@test.com", "sonnet", [
        ["2026-03-08", 100],
        ["2026-03-09", 100], // delta = 0
        ["2026-03-10", 100], // delta = 0
      ]),
    ];

    const result = computeDailyIncrease(series, "2026-03-09");
    expect(result).toHaveLength(0); // 값 없으면 시리즈 제외
  });
});

// ============================================================
// computeDailyIncrease — 카운터 리셋 (OTel Collector 재시작)
// ============================================================
describe("computeDailyIncrease — 카운터 리셋", () => {
  it("리셋 후 양의 delta만 집계 (recovery 안 함)", () => {
    const series = [
      makeSeries("a@test.com", "sonnet", [
        ["2026-03-08", 1000],   // padding baseline
        ["2026-03-09", 1500],   // +500
        ["2026-03-09", 200],    // 리셋! (1500 → 200, delta = -1300) → skip
        ["2026-03-09", 700],    // +500 (리셋 후 새 baseline 200에서)
        ["2026-03-10", 900],    // +200
      ]),
    ];

    const result = computeDailyIncrease(series, "2026-03-09");
    expect(result).toHaveLength(1);

    const dayMap = new Map(result[0].values.map(([ts, v]) => [tsToDate(ts), Number(v)]));

    // 3/9: +500 (정상) + 0 (리셋 skip) + 500 (리셋 후 증가) = 1000
    expect(dayMap.get("2026-03-09")).toBe(1000);
    expect(dayMap.get("2026-03-10")).toBe(200);
  });

  it("연속 리셋도 안전하게 처리", () => {
    const series = [
      makeSeries("a@test.com", "haiku", [
        ["2026-03-08", 5000],
        ["2026-03-09", 100],    // 리셋1
        ["2026-03-09", 50],     // 리셋2
        ["2026-03-09", 150],    // +100
      ]),
    ];

    const result = computeDailyIncrease(series, "2026-03-09");
    const dayMap = new Map(result[0].values.map(([ts, v]) => [tsToDate(ts), Number(v)]));

    expect(dayMap.get("2026-03-09")).toBe(100); // 50 → 150 = +100만 집계
  });
});

// ============================================================
// computeDailyIncrease — 첫 데이터포인트 (항상 baseline)
// ============================================================
describe("computeDailyIncrease — 첫 데이터포인트", () => {
  it("첫 데이터는 항상 baseline (신규/기존 구분 없음)", () => {
    const series = [
      makeSeries("new@test.com", "sonnet", [
        // 패딩 기간에 데이터 없어도 첫 값은 baseline
        ["2026-03-09", 500],   // baseline (스킵)
        ["2026-03-09", 800],   // +300
        ["2026-03-10", 1200],  // +400
      ]),
    ];

    const result = computeDailyIncrease(series, "2026-03-09");
    expect(result).toHaveLength(1);

    const dayMap = new Map(result[0].values.map(([ts, v]) => [tsToDate(ts), Number(v)]));

    // 첫 500은 baseline → 300 + 400 = 700
    expect(dayMap.get("2026-03-09")).toBe(300);
    expect(dayMap.get("2026-03-10")).toBe(400);
  });

  it("패딩 기간 첫 데이터 → baseline (초기값 제외)", () => {
    const series = [
      makeSeries("old@test.com", "sonnet", [
        ["2026-03-08", 5000],  // baseline
        ["2026-03-09", 5500],  // +500
        ["2026-03-10", 6000],  // +500
      ]),
    ];

    const result = computeDailyIncrease(series, "2026-03-09");
    const dayMap = new Map(result[0].values.map(([ts, v]) => [tsToDate(ts), Number(v)]));

    expect(dayMap.get("2026-03-09")).toBe(500);
    expect(dayMap.get("2026-03-10")).toBe(500);
  });
});

// ============================================================
// computeDailyIncrease — 여러 시리즈
// ============================================================
describe("computeDailyIncrease — 여러 시리즈", () => {
  it("유저별×모델별 독립 처리", () => {
    const series = [
      makeSeries("a@test.com", "sonnet", [
        ["2026-03-08", 100],
        ["2026-03-09", 200],  // +100
      ]),
      makeSeries("a@test.com", "haiku", [
        ["2026-03-08", 50],
        ["2026-03-09", 150],  // +100
      ]),
      makeSeries("b@test.com", "sonnet", [
        ["2026-03-08", 300],
        ["2026-03-09", 1000], // +700
      ]),
    ];

    const result = computeDailyIncrease(series, "2026-03-09");
    expect(result).toHaveLength(3);

    // 각 시리즈 독립 확인
    const find = (email: string, model: string) =>
      result.find((s) => s.metric.user_email === email && s.metric.model === model);

    const aSonnet = find("a@test.com", "sonnet")!;
    expect(Number(aSonnet.values[0][1])).toBe(100);

    const aHaiku = find("a@test.com", "haiku")!;
    expect(Number(aHaiku.values[0][1])).toBe(100);

    const bSonnet = find("b@test.com", "sonnet")!;
    expect(Number(bSonnet.values[0][1])).toBe(700);
  });

  it("빈 시리즈는 결과에서 제외", () => {
    const series = [
      makeSeries("a@test.com", "sonnet", []), // 빈 데이터
    ];

    const result = computeDailyIncrease(series, "2026-03-09");
    expect(result).toHaveLength(0);
  });
});

// ============================================================
// 엣지 케이스
// ============================================================
describe("computeDailyIncrease — 엣지 케이스", () => {
  it("단일 데이터포인트 → baseline만, 결과 없음", () => {
    const series = [
      makeSeries("solo@test.com", "sonnet", [
        ["2026-03-09", 1000], // baseline (항상 스킵)
      ]),
    ];

    const result = computeDailyIncrease(series, "2026-03-09");
    expect(result).toHaveLength(0); // baseline만 있으면 결과 없음
  });

  it("패딩 기간 단일 데이터포인트 → 결과 없음", () => {
    const series = [
      makeSeries("solo@test.com", "sonnet", [
        ["2026-03-08", 1000], // 패딩 기간, baseline
      ]),
    ];

    const result = computeDailyIncrease(series, "2026-03-09");
    expect(result).toHaveLength(0);
  });

  it("리셋 직후 0이면 skip (delta=0)", () => {
    const series = [
      makeSeries("a@test.com", "sonnet", [
        ["2026-03-08", 500],
        ["2026-03-09", 0],    // 리셋
        ["2026-03-09", 0],    // delta=0, skip
        ["2026-03-09", 100],  // +100
      ]),
    ];

    const result = computeDailyIncrease(series, "2026-03-09");
    const dayMap = new Map(result[0].values.map(([ts, v]) => [tsToDate(ts), Number(v)]));
    expect(dayMap.get("2026-03-09")).toBe(100);
  });
});

// ============================================================
// computeDailyIncrease — 시간당 delta 상한 (otel_push 이중 전송 방어)
// ============================================================
describe("computeDailyIncrease — MAX_HOURLY_DELTA cap", () => {
  it("정상 delta는 cap에 걸리지 않음", () => {
    const series = [
      makeSeries("a@test.com", "haiku", [
        ["2026-03-08", 0],
        ["2026-03-09", 500_000],  // +500K (정상)
        ["2026-03-09", 1_200_000], // +700K (정상)
      ]),
    ];

    const result = computeDailyIncrease(series, "2026-03-09");
    const dayMap = new Map(result[0].values.map(([ts, v]) => [tsToDate(ts), Number(v)]));
    expect(dayMap.get("2026-03-09")).toBe(1_200_000); // 500K + 700K
  });

  it("팽창 delta는 MAX_HOURLY_DELTA로 cap", () => {
    const inflated = MAX_HOURLY_DELTA * 5; // 10M — otel_push 이중 전송
    const series = [
      makeSeries("chiri@test.com", "haiku", [
        ["2026-03-08", 0],
        ["2026-03-09", inflated],         // +10M → capped to 2M
        ["2026-03-09", inflated * 2],     // +10M → capped to 2M
        ["2026-03-10", inflated * 2 + 500_000], // +500K (정상)
      ]),
    ];

    const result = computeDailyIncrease(series, "2026-03-09");
    const dayMap = new Map(result[0].values.map(([ts, v]) => [tsToDate(ts), Number(v)]));

    // 3/9: 2M + 2M = 4M (원래 20M이 cap 됨)
    expect(dayMap.get("2026-03-09")).toBe(MAX_HOURLY_DELTA * 2);
    // 3/10: 500K (정상 범위, cap 안 걸림)
    expect(dayMap.get("2026-03-10")).toBe(500_000);
  });

  it("cap 경계값 (정확히 MAX_HOURLY_DELTA)은 통과", () => {
    const series = [
      makeSeries("a@test.com", "haiku", [
        ["2026-03-08", 0],
        ["2026-03-09", MAX_HOURLY_DELTA], // 정확히 cap = 통과
      ]),
    ];

    const result = computeDailyIncrease(series, "2026-03-09");
    const dayMap = new Map(result[0].values.map(([ts, v]) => [tsToDate(ts), Number(v)]));
    expect(dayMap.get("2026-03-09")).toBe(MAX_HOURLY_DELTA);
  });

  it("리셋 후 팽창 delta도 cap 적용", () => {
    const series = [
      makeSeries("a@test.com", "haiku", [
        ["2026-03-08", 5_000_000],
        ["2026-03-09", 100],             // 리셋 → skip
        ["2026-03-09", 8_000_000],       // +7,999,900 → capped to 2M
        ["2026-03-09", 8_500_000],       // +500K (정상)
      ]),
    ];

    const result = computeDailyIncrease(series, "2026-03-09");
    const dayMap = new Map(result[0].values.map(([ts, v]) => [tsToDate(ts), Number(v)]));
    expect(dayMap.get("2026-03-09")).toBe(MAX_HOURLY_DELTA + 500_000);
  });
});

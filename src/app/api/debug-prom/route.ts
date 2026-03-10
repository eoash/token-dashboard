import { NextRequest, NextResponse } from "next/server";

const PROM_URL = process.env.PROMETHEUS_URL || "http://localhost:9090";

/**
 * Debug API: Prometheus raw counter 직접 조회
 *
 * GET /api/debug-prom?email=chiri@eoeoeo.net&hours=48&token_type=cache_read
 *
 * 1) sum by 없이 개별 시리즈 전체 반환 — 시리즈 수, stale 여부 확인
 * 2) sum by 결과도 함께 반환 — 비교용
 * 3) 각 시리즈의 max value, 마지막 값, stale 여부
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const email = sp.get("email") || "";
  const hours = parseInt(sp.get("hours") || "48", 10);
  const tokenType = sp.get("token_type") || "cache_read";

  if (!email) {
    return NextResponse.json({ error: "email param required" }, { status: 400 });
  }

  const now = new Date();
  const end = now.toISOString();
  const start = new Date(now.getTime() - hours * 3600 * 1000).toISOString();
  const step = "3600"; // 1h

  // 1) 개별 시리즈 (sum by 없음)
  const rawQuery = `claude_code_tokens_total{token_type="${tokenType}", user_email="${email}"}`;
  // 2) sum by 결과
  const sumQuery = `sum by (user_email, model) (claude_code_tokens_total{token_type="${tokenType}", user_email="${email}"})`;

  const [rawResult, sumResult] = await Promise.all([
    queryRange(rawQuery, start, end, step),
    queryRange(sumQuery, start, end, step),
  ]);

  // 각 시리즈 분석
  const rawAnalysis = rawResult.map((s: PromSeries) => {
    const vals = s.values.map(([ts, v]: [number, string]) => ({
      time: new Date(ts * 1000).toISOString().slice(0, 19),
      value: parseFloat(v),
    }));
    const maxVal = Math.max(...vals.map((v: { value: number }) => v.value));
    const lastVal = vals.length > 0 ? vals[vals.length - 1] : null;
    const firstVal = vals.length > 0 ? vals[0] : null;

    // stale 감지: 연속된 값 사이에 gap이 있는지
    const gaps: string[] = [];
    for (let i = 1; i < s.values.length; i++) {
      const timeDiff = s.values[i][0] - s.values[i - 1][0];
      if (timeDiff > 7200) {
        // 2시간 이상 gap
        gaps.push(
          `${new Date(s.values[i - 1][0] * 1000).toISOString().slice(0, 19)} → ${new Date(s.values[i][0] * 1000).toISOString().slice(0, 19)} (${Math.round(timeDiff / 3600)}h gap)`
        );
      }
    }

    // delta 분석: 비정상적으로 큰 양의 delta
    const bigDeltas: { time: string; delta: number; from: number; to: number }[] = [];
    for (let i = 1; i < vals.length; i++) {
      const delta = vals[i].value - vals[i - 1].value;
      if (delta > 1_000_000) {
        // 1M 이상 delta
        bigDeltas.push({
          time: vals[i].time,
          delta: Math.round(delta),
          from: Math.round(vals[i - 1].value),
          to: Math.round(vals[i].value),
        });
      }
    }

    // 음의 delta (리셋/stale 탈락)
    const negDeltas: { time: string; delta: number; from: number; to: number }[] = [];
    for (let i = 1; i < vals.length; i++) {
      const delta = vals[i].value - vals[i - 1].value;
      if (delta < 0) {
        negDeltas.push({
          time: vals[i].time,
          delta: Math.round(delta),
          from: Math.round(vals[i - 1].value),
          to: Math.round(vals[i].value),
        });
      }
    }

    return {
      labels: s.metric,
      dataPoints: vals.length,
      firstVal,
      lastVal,
      maxVal: Math.round(maxVal),
      gaps,
      bigDeltas: bigDeltas.slice(0, 20), // 최대 20개
      negDeltas: negDeltas.slice(0, 20),
    };
  });

  // sum by 분석
  const sumAnalysis = sumResult.map((s: PromSeries) => {
    const vals = s.values.map(([ts, v]: [number, string]) => ({
      time: new Date(ts * 1000).toISOString().slice(0, 19),
      value: parseFloat(v),
    }));

    const bigDeltas: { time: string; delta: number; from: number; to: number }[] = [];
    const negDeltas: { time: string; delta: number; from: number; to: number }[] = [];
    for (let i = 1; i < vals.length; i++) {
      const delta = vals[i].value - vals[i - 1].value;
      if (delta > 1_000_000) {
        bigDeltas.push({
          time: vals[i].time,
          delta: Math.round(delta),
          from: Math.round(vals[i - 1].value),
          to: Math.round(vals[i].value),
        });
      }
      if (delta < 0) {
        negDeltas.push({
          time: vals[i].time,
          delta: Math.round(delta),
          from: Math.round(vals[i - 1].value),
          to: Math.round(vals[i].value),
        });
      }
    }

    return {
      labels: s.metric,
      dataPoints: vals.length,
      first: vals[0],
      last: vals[vals.length - 1],
      bigDeltas: bigDeltas.slice(0, 20),
      negDeltas: negDeltas.slice(0, 20),
    };
  });

  return NextResponse.json({
    query: { email, tokenType, hours, start, end },
    rawSeriesCount: rawResult.length,
    sumSeriesCount: sumResult.length,
    rawSeries: rawAnalysis,
    sumSeries: sumAnalysis,
  });
}

// --- helpers ---

interface PromSeries {
  metric: Record<string, string>;
  values: [number, string][];
}

async function queryRange(
  query: string,
  start: string,
  end: string,
  step: string
): Promise<PromSeries[]> {
  const url = new URL(`${PROM_URL}/api/v1/query_range`);
  url.searchParams.set("query", query);
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  url.searchParams.set("step", step);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Prometheus ${res.status}: ${await res.text()}`);

  const json = await res.json();
  if (json.status !== "success") throw new Error("Prometheus query error");
  return json.data.result;
}

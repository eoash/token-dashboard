import { NextResponse } from "next/server";

const PROM_URL = process.env.PROMETHEUS_URL || "http://localhost:9090";

interface HealthCheck {
  status: "healthy" | "degraded" | "down";
  checks: {
    prometheus: { ok: boolean; message: string };
    collector: { ok: boolean; message: string };
    resets: { ok: boolean; count: number; message: string };
    freshness: { ok: boolean; lastDataAge: number; message: string };
    activeUsers: { ok: boolean; count: number; message: string };
  };
  timestamp: string;
}

async function promQuery(query: string): Promise<unknown[]> {
  const url = new URL(`${PROM_URL}/api/v1/query`);
  url.searchParams.set("query", query);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Prometheus ${res.status}`);
  const json = await res.json();
  return json.data?.result ?? [];
}

export async function GET() {
  const checks: HealthCheck["checks"] = {
    prometheus: { ok: false, message: "" },
    collector: { ok: false, message: "" },
    resets: { ok: true, count: 0, message: "" },
    freshness: { ok: false, lastDataAge: -1, message: "" },
    activeUsers: { ok: false, count: 0, message: "" },
  };

  // 1. Prometheus 접속
  try {
    const res = await fetch(`${PROM_URL}/api/v1/status/config`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    checks.prometheus = { ok: res.ok, message: res.ok ? "reachable" : `status ${res.status}` };
  } catch {
    checks.prometheus = { ok: false, message: "unreachable" };
  }

  if (!checks.prometheus.ok) {
    return NextResponse.json({
      status: "down",
      checks,
      timestamp: new Date().toISOString(),
    } satisfies HealthCheck);
  }

  // 2. OTel Collector (up 메트릭)
  try {
    const result = await promQuery('up{job="otel-collector"}') as { value: [number, string] }[];
    const isUp = result.some((r) => r.value[1] === "1");
    checks.collector = { ok: isUp, message: isUp ? "up" : "down or not scraped" };
  } catch {
    checks.collector = { ok: false, message: "query failed" };
  }

  // 3. 카운터 리셋 감지 (최근 6시간)
  try {
    const result = await promQuery(
      "sum(resets(claude_code_tokens_total[6h]))"
    ) as { value: [number, string] }[];
    const resetCount = result.length > 0 ? Math.round(parseFloat(result[0].value[1])) : 0;
    checks.resets = {
      ok: resetCount === 0,
      count: resetCount,
      message: resetCount === 0 ? "no resets in 6h" : `${resetCount} counter resets in 6h`,
    };
  } catch {
    // resets() 미지원 시 fallback — 무시
    checks.resets = { ok: true, count: 0, message: "reset check skipped" };
  }

  // 4. 데이터 신선도 (마지막 데이터 시점)
  try {
    const result = await promQuery(
      "max(timestamp(claude_code_session_count_total))"
    ) as { value: [number, string] }[];
    if (result.length > 0) {
      const lastTs = parseFloat(result[0].value[1]);
      const ageMinutes = Math.round((Date.now() / 1000 - lastTs) / 60);
      checks.freshness = {
        ok: ageMinutes < 60,
        lastDataAge: ageMinutes,
        message: ageMinutes < 60 ? `${ageMinutes}m ago` : `stale — last data ${ageMinutes}m ago`,
      };
    } else {
      checks.freshness = { ok: false, lastDataAge: -1, message: "no session data found" };
    }
  } catch {
    checks.freshness = { ok: false, lastDataAge: -1, message: "query failed" };
  }

  // 5. 활성 유저 수 (최근 24시간)
  try {
    const result = await promQuery(
      'count(count by (user_email) (increase(claude_code_session_count_total[24h]) > 0))'
    ) as { value: [number, string] }[];
    const count = result.length > 0 ? Math.round(parseFloat(result[0].value[1])) : 0;
    checks.activeUsers = {
      ok: count >= 1,
      count,
      message: `${count} users active in 24h`,
    };
  } catch {
    checks.activeUsers = { ok: false, count: 0, message: "query failed" };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  const anyDown = !checks.prometheus.ok || !checks.collector.ok;

  return NextResponse.json({
    status: anyDown ? "down" : allOk ? "healthy" : "degraded",
    checks,
    timestamp: new Date().toISOString(),
  } satisfies HealthCheck);
}

import { NextResponse } from "next/server";
import { EMAIL_TO_NAME } from "@/lib/constants";

const PROM_URL = process.env.PROMETHEUS_URL || "http://localhost:9090";

// Gemini CLI OTel 메트릭: gemini_cli_token_usage_total
// labels: user_email, model, type (input/output/cache/thought/tool)

interface PromInstantResult {
  metric: Record<string, string>;
  value: [number, string]; // [unix_ts, value_string]
}

interface PromInstantResponse {
  status: "success" | "error";
  data: {
    resultType: "vector";
    result: PromInstantResult[];
  };
}

export interface GeminiMemberRow {
  name: string;
  email: string;
  input: number;
  output: number;
  cache: number;
  thought: number;
  total: number;
}

async function queryInstant(query: string): Promise<PromInstantResult[]> {
  const url = new URL(`${PROM_URL}/api/v1/query`);
  url.searchParams.set("query", query);

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Prometheus ${res.status}: ${await res.text()}`);

  const json: PromInstantResponse = await res.json();
  if (json.status !== "success") throw new Error("Prometheus query error");

  return json.data.result;
}

export async function GET() {
  try {
    // 전체 누적값 조회 (instant query — counter 총합)
    const results = await queryInstant(
      'sum by (user_email, type) (gemini_cli_token_usage_total)'
    );

    // user_email별로 type 합산
    const userMap = new Map<string, { input: number; output: number; cache: number; thought: number }>();

    for (const r of results) {
      const email = r.metric.user_email || "unknown";
      const type = r.metric.type || "unknown";
      const val = Math.round(parseFloat(r.value[1]) || 0);

      if (!userMap.has(email)) {
        userMap.set(email, { input: 0, output: 0, cache: 0, thought: 0 });
      }
      const entry = userMap.get(email)!;

      if (type === "input") entry.input += val;
      else if (type === "output") entry.output += val;
      else if (type === "cache") entry.cache += val;
      else if (type === "thought") entry.thought += val;
      // tool 등 다른 type은 total에만 포함
    }

    // 응답 데이터 구성
    const data: GeminiMemberRow[] = [];
    for (const [email, tokens] of userMap.entries()) {
      const name = EMAIL_TO_NAME[email] ?? email.split("@")[0];
      const total = tokens.input + tokens.output + tokens.cache + tokens.thought;
      if (total === 0) continue; // 토큰 0인 유저 제외

      data.push({
        name,
        email,
        input: tokens.input,
        output: tokens.output,
        cache: tokens.cache,
        thought: tokens.thought,
        total,
      });
    }

    // total 기준 내림차순 정렬
    data.sort((a, b) => b.total - a.total);

    return NextResponse.json({ data });
  } catch (error) {
    console.warn("gemini-usage API error:", error);
    return NextResponse.json({ data: [] });
  }
}

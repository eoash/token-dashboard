import { NextResponse } from "next/server";
import { EMAIL_TO_NAME } from "@/lib/constants";
import fs from "fs";
import path from "path";

export interface CodexMemberRow {
  name: string;
  email: string;
  input: number;
  output: number;
  cached: number;
  reasoning: number;
  total: number;
}

interface BackfillEntry {
  date: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens?: number;
  cache_creation_tokens?: number;
  model?: string;
}

export async function GET() {
  try {
    const memberMap = new Map<string, { input: number; output: number; cached: number; reasoning: number }>();

    // backfill/*.json에서 Codex 모델(gpt-*) 레코드 추출
    const backfillDir = path.join(process.cwd(), "src/lib/backfill");
    for (const file of fs.readdirSync(backfillDir).filter((f) => f.endsWith(".json"))) {
      const username = file.replace(".json", "");
      const email = `${username}@eoeoeo.net`;
      const raw = JSON.parse(fs.readFileSync(path.join(backfillDir, file), "utf-8"));
      const entries: BackfillEntry[] = (raw.data ?? []).filter(
        (e: BackfillEntry) => e.model && e.model.startsWith("gpt-")
      );
      if (entries.length === 0) continue;

      const m = memberMap.get(email) ?? { input: 0, output: 0, cached: 0, reasoning: 0 };
      for (const e of entries) {
        m.input += e.input_tokens ?? 0;
        m.output += e.output_tokens ?? 0;
        m.cached += e.cache_read_tokens ?? 0;
        m.reasoning += e.cache_creation_tokens ?? 0;
      }
      memberMap.set(email, m);
    }

    const data: CodexMemberRow[] = [];
    for (const [email, m] of memberMap) {
      const total = m.input + m.output + m.cached + m.reasoning;
      if (total === 0) continue;
      const name = EMAIL_TO_NAME[email] ?? email.split("@")[0];
      data.push({ name, email, ...m, total });
    }

    data.sort((a, b) => b.total - a.total);
    return NextResponse.json({ data });
  } catch (error) {
    console.warn("codex-usage API error:", error);
    return NextResponse.json({ data: [] });
  }
}

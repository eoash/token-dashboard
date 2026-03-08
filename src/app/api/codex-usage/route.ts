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
  cached_input_tokens: number;
  reasoning_output_tokens: number;
  sessions?: number;
  model?: string;
}

export async function GET() {
  try {
    const codexDir = path.join(process.cwd(), "src/lib/backfill/codex");

    if (!fs.existsSync(codexDir)) {
      return NextResponse.json({ data: [] });
    }

    const files = fs.readdirSync(codexDir).filter((f) => f.endsWith(".json"));
    const data: CodexMemberRow[] = [];

    for (const file of files) {
      const username = file.replace(".json", "");
      const raw = JSON.parse(fs.readFileSync(path.join(codexDir, file), "utf-8"));
      const entries: BackfillEntry[] = raw.data ?? [];

      let input = 0, output = 0, cached = 0, reasoning = 0;
      for (const e of entries) {
        input += e.input_tokens ?? 0;
        output += e.output_tokens ?? 0;
        cached += e.cached_input_tokens ?? 0;
        reasoning += e.reasoning_output_tokens ?? 0;
      }

      const total = input + output + cached + reasoning;
      if (total === 0) continue;

      // username → email → name 매핑
      const email = `${username}@eoeoeo.net`;
      const name = EMAIL_TO_NAME[email] ?? username;

      data.push({ name, email, input, output, cached, reasoning, total });
    }

    data.sort((a, b) => b.total - a.total);

    return NextResponse.json({ data });
  } catch (error) {
    console.warn("codex-usage API error:", error);
    return NextResponse.json({ data: [] });
  }
}

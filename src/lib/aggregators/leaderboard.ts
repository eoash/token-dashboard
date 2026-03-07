import { resolveActorName } from "@/lib/constants";
import type { ClaudeCodeDataPoint } from "@/lib/types";

export interface ClaudeMemberRow {
  name: string;
  initial: string;
  input: number;
  output: number;
  cacheRead: number;
  total: number;
  cacheHitRate: number;
  acceptanceRate: number;
  avgDailySessions: number;
}

export function aggregateMembers(data: ClaudeCodeDataPoint[]): ClaudeMemberRow[] {
  const map = new Map<string, {
    input: number; output: number; cacheRead: number; cacheCreation: number; total: number;
    acceptSum: number; acceptCount: number; sessions: number; days: Set<string>;
  }>();

  for (const d of data) {
    const name = resolveActorName(d.actor);
    const e = map.get(name) ?? { input: 0, output: 0, cacheRead: 0, cacheCreation: 0, total: 0, acceptSum: 0, acceptCount: 0, sessions: 0, days: new Set() };
    e.input += d.input_tokens;
    e.output += d.output_tokens;
    e.cacheRead += d.cache_read_tokens;
    e.cacheCreation += d.cache_creation_tokens;
    e.sessions += d.session_count;
    if (d.tool_acceptance_rate != null) { e.acceptSum += d.tool_acceptance_rate * d.session_count; e.acceptCount += d.session_count; }
    e.days.add(d.date);
    e.total = e.input + e.output + e.cacheRead;
    map.set(name, e);
  }

  return Array.from(map.entries())
    .map(([name, v]) => {
      const allInput = v.input + v.cacheRead + v.cacheCreation;
      return {
        name,
        initial: name[0].toUpperCase(),
        input: v.input, output: v.output, cacheRead: v.cacheRead, total: v.total,
        cacheHitRate: allInput > 0 ? v.cacheRead / allInput : 0,
        acceptanceRate: v.acceptCount > 0 ? v.acceptSum / v.acceptCount : 0,
        avgDailySessions: v.days.size > 0 ? Math.round(v.sessions / v.days.size) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

interface TeamMemberRank {
  name: string;
  tokens: number;
  cacheHitRate?: number;
  lines?: number;
  commits?: number;
  prs?: number;
  acceptanceRate?: number;
}

interface TeamRankingCardProps {
  data: TeamMemberRank[];
}

const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_COLORS = ["#00E87A", "#C0C0C0", "#CD7F32", "#6B7280", "#6B7280"];

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function TeamRankingCard({ data }: TeamRankingCardProps) {
  const total = data.reduce((sum, m) => sum + m.tokens, 0);
  const max = data[0]?.tokens ?? 1;

  return (
    <div className="rounded-xl bg-[#111111] border border-[#222] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Team Ranking</h3>
        <span className="text-xs text-neutral-500">Last 30 days</span>
      </div>

      {/* 가로 카드 레이아웃 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {data.map((member, i) => {
          const pct = Math.round((member.tokens / total) * 100);
          const barWidth = Math.round((member.tokens / max) * 100);
          const color = RANK_COLORS[i] ?? "#6B7280";

          return (
            <div
              key={member.name}
              className="rounded-lg bg-[#181818] border border-[#2a2a2a] p-4 flex flex-col gap-2"
            >
              {/* 순위 + 이름 */}
              <div className="flex items-center gap-1.5">
                <span className="text-lg leading-none">{MEDALS[i] ?? `#${i + 1}`}</span>
                <span className="text-sm font-semibold text-white">{member.name}</span>
              </div>

              {/* 토큰 */}
              <div>
                <span className="text-xl font-bold font-mono" style={{ color }}>
                  {formatTokens(member.tokens)}
                </span>
                <span className="ml-1 text-xs text-neutral-500">tokens</span>
              </div>

              {/* Progress bar */}
              <div className="h-1 w-full rounded-full bg-[#2a2a2a]">
                <div
                  className="h-1 rounded-full transition-all"
                  style={{ width: `${barWidth}%`, backgroundColor: color, opacity: 0.8 }}
                />
              </div>

              {/* 점유율 + cache hit */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-medium">{pct}%</span>
                <span className="text-neutral-500">cache {member.cacheHitRate != null ? `${(member.cacheHitRate * 100).toFixed(1)}%` : "—"}</span>
              </div>

              {/* 생산성 지표 */}
              <div className="mt-1 pt-2 border-t border-[#2a2a2a] grid grid-cols-3 gap-1 text-center">
                <div>
                  <p className="text-xs font-mono text-neutral-300">
                    {member.acceptanceRate != null
                      ? `${(member.acceptanceRate * 100).toFixed(0)}%`
                      : "—"}
                  </p>
                  <p className="text-[10px] text-neutral-600">accept</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-neutral-300">
                    {member.commits ?? "—"}
                  </p>
                  <p className="text-[10px] text-neutral-600">commits</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-neutral-300">
                    {member.prs ?? "—"}
                  </p>
                  <p className="text-[10px] text-neutral-600">PRs</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 합계 스택 바 */}
      <div className="pt-4 border-t border-[#222]">
        <div className="flex justify-between text-xs text-neutral-500 mb-2">
          <span>Team Total</span>
          <span>{formatTokens(total)} tokens</span>
        </div>
        <div className="flex h-2 w-full rounded-full overflow-hidden gap-0.5">
          {data.map((member, i) => {
            const pct = (member.tokens / total) * 100;
            return (
              <div
                key={member.name}
                className="h-full rounded-sm transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: RANK_COLORS[i] ?? "#6B7280",
                  opacity: 0.7,
                }}
                title={`${member.name}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          {data.map((member, i) => (
            <span key={member.name} className="text-xs" style={{ color: RANK_COLORS[i] ?? "#6B7280" }}>
              {member.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

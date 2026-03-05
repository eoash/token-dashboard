import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

export default function LeaderboardPage() {
  const isMock = !process.env.ANTHROPIC_ADMIN_API_KEY;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <span className="text-xs text-gray-500">Developer rankings</span>
      </div>

      {isMock && (
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 flex items-center gap-3">
          <span className="text-yellow-400 text-sm font-medium">Mock Mode</span>
          <span className="text-yellow-500/70 text-xs">샘플 데이터로 표시 중 — ANTHROPIC_ADMIN_API_KEY 설정 후 실제 데이터를 확인하세요</span>
        </div>
      )}

      <LeaderboardTable />
    </div>
  );
}

"use client";

import { useState } from "react";
import KpiCard from "@/components/cards/KpiCard";
import DailyUsageChart from "@/components/charts/DailyUsageChart";
import ModelPieChart from "@/components/charts/ModelPieChart";
import DateRangePicker from "@/components/layout/DateRangePicker";
import { UNIQUE_MEMBERS } from "@/lib/constants";
import { formatTokens, formatPercent } from "@/lib/utils";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { aggregateMember } from "@/lib/aggregators/team";

export default function TeamPage() {
  const [selectedName, setSelectedName] = useState(UNIQUE_MEMBERS[0]?.name ?? "");
  const { data: rawData, loading, error } = useAnalytics();

  const memberData = aggregateMember(rawData, selectedName);
  const memberName = selectedName;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Team</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker />
          <select
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            className="bg-[#111111] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#E8FF47]"
          >
            {UNIQUE_MEMBERS.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard title="Total Tokens" value={formatTokens(memberData.totalTokens)} tooltip="이 팀원이 사용한 전체 토큰(입력+출력+캐시) 합계입니다." />
            <KpiCard title="Cache Hit Rate" value={formatPercent(memberData.cacheHitRate)} tooltip="이 팀원의 캐시 재활용 비율. 높을수록 동일 컨텍스트 재전송이 줄어 효율적입니다." />
            <KpiCard title="Sessions" value={String(memberData.sessions)} unavailable tooltip="Claude 세션 수. 현재 OTel 메트릭에서 세션 카운트를 지원하지 않아 미추적 상태입니다." />
            <KpiCard
              title="Tool Accept Rate"
              value={formatPercent(memberData.toolAcceptanceRate)}
              unavailable
              tooltip="Claude의 도구 호출(편집·생성 등) 중 이 팀원이 승인한 비율. 현재 미추적 상태입니다."
            />
          </div>

          {/* Productivity */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <KpiCard
              title="Lines of Code"
              value={memberData.linesOfCode.toLocaleString()}
              subtitle={`by ${memberName}`}
              unavailable
              tooltip="Claude가 제안한 코드 중 이 팀원이 수락한 라인 수. 현재 미추적 상태입니다."
            />
            <KpiCard
              title="Commits"
              value={String(memberData.commits)}
              subtitle={`by ${memberName}`}
              unavailable
              tooltip="이 팀원의 Claude 세션에서 발생한 Git 커밋 수. 현재 미추적 상태입니다."
            />
            <KpiCard
              title="Pull Requests"
              value={String(memberData.pullRequests)}
              subtitle={`by ${memberName}`}
              unavailable
              tooltip="이 팀원이 Claude 지원으로 머지한 PR 수. 현재 미추적 상태입니다."
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DailyUsageChart data={memberData.daily} />
            </div>
            <div>
              <ModelPieChart data={memberData.models} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

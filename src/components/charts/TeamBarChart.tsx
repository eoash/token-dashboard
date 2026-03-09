"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";

interface TeamData {
  name: string;
  tokens: number;
}

interface TeamBarChartProps {
  data: TeamData[];
}

function formatTokenAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function CustomTooltip({ active, payload, label }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-lg">
      <p className="mb-1 text-sm font-medium text-white">{label}</p>
      <p className="text-sm text-[#00E87A]">
        Tokens: {Number(entry.value).toLocaleString()}
      </p>
    </div>
  );
}

export default function TeamBarChart({ data }: TeamBarChartProps) {
  return (
    <div className="rounded-xl bg-[#111111] p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Team Usage</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, bottom: 5, left: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={formatTokenAxis}
              stroke="#666"
              tick={{ fill: "#999", fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#666"
              tick={{ fill: "#999", fontSize: 12 }}
              width={50}
            />
            <Tooltip content={CustomTooltip} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Bar dataKey="tokens" fill="#00E87A" radius={[0, 4, 4, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

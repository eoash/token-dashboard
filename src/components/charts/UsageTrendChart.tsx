"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface UsageTrendData {
  date: string;
  input: number;
  output: number;
  cache_read: number;
}

interface UsageTrendChartProps {
  data: UsageTrendData[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function formatTokens(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(0) + "K";
  return String(v);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-lg">
      <p className="mb-2 text-sm text-neutral-400">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatTokens(Number(entry.value))}
        </p>
      ))}
    </div>
  );
}

export default function UsageTrendChart({ data }: UsageTrendChartProps) {
  return (
    <div className="rounded-xl bg-[#111111] p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Daily Token Usage</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#666"
              tick={{ fill: "#999", fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatTokens}
              stroke="#666"
              tick={{ fill: "#999", fontSize: 12 }}
            />
            <Tooltip content={CustomTooltip} />
            <Area
              type="monotone"
              dataKey="cache_read"
              stackId="1"
              stroke="#4ADE80"
              fill="#4ADE8030"
              name="Cache Read"
            />
            <Area
              type="monotone"
              dataKey="input"
              stackId="1"
              stroke="#60A5FA"
              fill="#60A5FA30"
              name="Input"
            />
            <Area
              type="monotone"
              dataKey="output"
              stackId="1"
              stroke="#00E87A"
              fill="#00E87A30"
              name="Output"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

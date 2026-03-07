"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";

interface TokenTrendData {
  date: string;
  tokens: number;
}

interface TokenTrendChartProps {
  data: TokenTrendData[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}/${day}`;
}

function formatTokenAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function CustomTooltip({ active, payload, label }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-lg">
      <p className="mb-2 text-sm text-neutral-400">{label}</p>
      {payload.map((entry: { dataKey?: string; name?: string; value?: number; color?: string }) => (
        <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {Number(entry.value).toLocaleString()} tokens
        </p>
      ))}
    </div>
  );
}

export default function CostTrendChart({ data }: TokenTrendChartProps) {
  return (
    <div className="rounded-xl bg-[#111111] p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Token Trend</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#666"
              tick={{ fill: "#999", fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatTokenAxis}
              stroke="#666"
              tick={{ fill: "#999", fontSize: 12 }}
            />
            <Tooltip content={CustomTooltip} />
            <Line
              type="monotone"
              dataKey="tokens"
              stroke="#E8FF47"
              strokeWidth={2}
              dot={{ fill: "#E8FF47", r: 3 }}
              activeDot={{ r: 5 }}
              name="Tokens"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";

interface ModelData {
  name: string;
  value: number;
  color: string;
}

interface ModelPieChartProps {
  data: ModelData[];
}

function CustomTooltip({ active, payload }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-lg">
      <p className="text-sm text-white">
        {entry.name}: {Number(entry.value).toLocaleString()} tokens
      </p>
    </div>
  );
}

export default function ModelPieChart({ data }: ModelPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  function formatTotal(val: number): string {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return String(val);
  }

  return (
    <div className="rounded-xl bg-[#111111] p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Model Distribution</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={CustomTooltip} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              formatter={(value: string) => (
                <span className="text-sm text-neutral-300">{value}</span>
              )}
            />
            {/* Center text */}
            <text
              x="50%"
              y="42%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white text-xl font-bold"
            >
              {formatTotal(total)}
            </text>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-neutral-500 text-xs"
            >
              total tokens
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

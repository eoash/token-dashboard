interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  unavailable?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function KpiCard({ title, value, subtitle, unavailable, trend }: KpiCardProps) {
  return (
    <div className={`rounded-xl bg-[#111111] border border-[#222] p-5${unavailable ? " opacity-40" : ""}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {title}
      </p>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-2xl font-bold text-white">
          {unavailable ? "N/A" : value}
        </span>
        {!unavailable && trend && (
          <span
            className={`flex items-center text-sm font-medium ${
              trend.isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {trend.isPositive ? "\u2191" : "\u2193"}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-500">
          {unavailable ? "not yet tracked" : subtitle}
        </p>
      )}
    </div>
  );
}

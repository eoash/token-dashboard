import InfoTip from "@/components/InfoTip";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  unavailable?: boolean;
  tooltip?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function KpiCard({ title, value, subtitle, unavailable, tooltip, trend }: KpiCardProps) {
  return (
    <div className={`relative rounded-xl bg-[#111111] border border-[#222] p-3 md:p-5${unavailable ? " opacity-40" : ""}`}>
      <div className="flex items-center gap-1">
        <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide">
          {title}
        </p>
        {tooltip && <InfoTip text={tooltip} />}
      </div>
      <div className="mt-1 md:mt-2 flex items-end gap-2">
        <span className="text-lg md:text-2xl font-bold text-white">
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

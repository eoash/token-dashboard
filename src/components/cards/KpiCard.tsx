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
    <div className={`group/kpi relative rounded-xl bg-[#111111] border border-[#222] p-5${unavailable ? " opacity-40" : ""}`}>
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {title}
        </p>
        {tooltip && (
          <div className="relative">
            <svg className="w-3.5 h-3.5 text-gray-600 cursor-help peer outline-none" tabIndex={0} viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm1 12H7V7h2v5zM8 6a1 1 0 110-2 1 1 0 010 2z"/>
            </svg>
            <div className="invisible peer-hover:visible peer-focus:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-lg bg-[#1a1a1a] border border-[#333] px-3 py-2 text-xs text-gray-300 leading-relaxed shadow-xl z-50">
              {tooltip}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-[#333]"/>
            </div>
          </div>
        )}
      </div>
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

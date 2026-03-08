"use client";

import { format, subDays } from "date-fns";
import { useDateRange } from "@/lib/contexts/DateRangeContext";
import { useT } from "@/lib/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

const today = format(new Date(), "yyyy-MM-dd");

const PRESETS: { labelKey: TranslationKey; days: number }[] = [
  { labelKey: "date.7d", days: 7 },
  { labelKey: "date.30d", days: 30 },
  { labelKey: "date.90d", days: 90 },
];

export default function DateRangePicker() {
  const { range, setRange } = useDateRange();
  const { t } = useT();

  const applyPreset = (days: number, label: string) => {
    setRange({
      start: format(subDays(new Date(), days), "yyyy-MM-dd"),
      end: today,
      label,
    });
  };

  const isPresetActive = (days: number) => {
    const expected = format(subDays(new Date(), days), "yyyy-MM-dd");
    return range.start === expected && range.end === today;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-0.5 gap-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.days}
            onClick={() => applyPreset(p.days, `Last ${p.days} days`)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              isPresetActive(p.days)
                ? "bg-[#E8FF47] text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={range.start}
          max={range.end}
          onChange={(e) => setRange({ start: e.target.value, end: range.end, label: "Custom" })}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-[#E8FF47] [color-scheme:dark]"
        />
        <span className="text-xs text-gray-600">~</span>
        <input
          type="date"
          value={range.end}
          min={range.start}
          max={today}
          onChange={(e) => setRange({ start: range.start, end: e.target.value, label: "Custom" })}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-[#E8FF47] [color-scheme:dark]"
        />
      </div>
      <span className="text-xs text-gray-500">{range.label}</span>
    </div>
  );
}

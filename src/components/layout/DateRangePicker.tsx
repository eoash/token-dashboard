"use client";

import { format, subDays } from "date-fns";
import { useDateRange } from "@/lib/contexts/DateRangeContext";

const today = format(new Date(), "yyyy-MM-dd");

const PRESETS = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

export default function DateRangePicker() {
  const { range, setRange } = useDateRange();

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
      {/* Preset buttons */}
      <div className="flex rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-0.5 gap-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.days, `Last ${p.days} days`)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              isPresetActive(p.days)
                ? "bg-[#E8FF47] text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={range.start}
          max={range.end}
          onChange={(e) =>
            setRange({ start: e.target.value, end: range.end, label: "Custom" })
          }
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-[#E8FF47] [color-scheme:dark]"
        />
        <span className="text-xs text-gray-600">~</span>
        <input
          type="date"
          value={range.end}
          min={range.start}
          max={today}
          onChange={(e) =>
            setRange({ start: range.start, end: e.target.value, label: "Custom" })
          }
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-[#E8FF47] [color-scheme:dark]"
        />
      </div>

      {/* Current range label */}
      <span className="text-xs text-gray-500">{range.label}</span>
    </div>
  );
}

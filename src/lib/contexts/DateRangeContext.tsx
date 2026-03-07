"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { format, subDays } from "date-fns";

interface DateRange {
  start: string; // yyyy-MM-dd
  end: string;
  label: string;
}

interface DateRangeContextValue {
  range: DateRange;
  setRange: (range: DateRange) => void;
  days: number;
}

const today = format(new Date(), "yyyy-MM-dd");
const defaultRange: DateRange = {
  start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  end: today,
  label: "Last 30 days",
};

const DateRangeContext = createContext<DateRangeContextValue>({
  range: defaultRange,
  setRange: () => {},
  days: 30,
});

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<DateRange>(defaultRange);

  const days = Math.max(
    1,
    Math.round(
      (new Date(range.end).getTime() - new Date(range.start).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  return (
    <DateRangeContext.Provider value={{ range, setRange, days }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  return useContext(DateRangeContext);
}

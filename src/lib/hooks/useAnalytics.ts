"use client";

import { useState, useEffect } from "react";
import type { ClaudeCodeDataPoint } from "@/lib/types";

interface UseAnalyticsResult {
  data: ClaudeCodeDataPoint[];
  loading: boolean;
  error: string | null;
}

export function useAnalytics(days: number = 30): UseAnalyticsResult {
  const [data, setData] = useState<ClaudeCodeDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/analytics?days=${days}`)
      .then((res) => {
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json.data ?? []);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          console.error("analytics fetch failed:", e);
          setError("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [days]);

  return { data, loading, error };
}

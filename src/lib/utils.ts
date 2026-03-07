import { format, subDays, parseISO } from "date-fns";

/** 토큰 수를 읽기 쉽게 포맷 (1234567 → "1.23M") */
export function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

/** USD 비용 포맷 ($12.34) */
export function formatUSD(cents: number): string {
  const dollars = cents / 100;
  return "$" + dollars.toFixed(2);
}

/** USD 달러 단위 포맷 */
export function formatDollars(usd: number): string {
  return "$" + usd.toFixed(2);
}

/** 날짜 포맷 (MM/dd) */
export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "MM/dd");
}

/** 날짜 포맷 (yyyy-MM-dd) */
export function formatDateFull(dateStr: string): string {
  return format(parseISO(dateStr), "yyyy-MM-dd");
}

/** N일 전부터 오늘까지 날짜 범위 */
export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = subDays(end, days);
  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  };
}

/** 숫자를 쉼표로 포맷 */
export function formatNumber(n: number): string {
  return n.toLocaleString();
}

/** 퍼센트 포맷 */
export function formatPercent(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

/** cents → dollars */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/** 현재 월의 총 일수 */
export function getDaysInCurrentMonth(): number {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
}

/** 월말 예상 비용 계산 */
export function projectMonthlyCost(
  dailyCosts: { date: string; cost: number }[]
): number {
  if (dailyCosts.length === 0) return 0;
  const totalCost = dailyCosts.reduce((sum, d) => sum + d.cost, 0);
  const avgDaily = totalCost / dailyCosts.length;
  return avgDaily * getDaysInCurrentMonth();
}

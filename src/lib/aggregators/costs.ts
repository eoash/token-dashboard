import { EMAIL_TO_NAME, getModelLabel, getModelColor } from "@/lib/constants";
import { projectMonthlyCost } from "@/lib/utils";
import type { ClaudeCodeDataPoint } from "@/lib/types";

export interface CostAggregation {
  totalCostUsd: number;
  avgDailyCost: number;
  projectedMonthly: number;
  daily: { date: string; cost: number; projected?: number }[];
  memberCosts: { name: string; tokens: number; cost: number }[];
  modelCosts: { name: string; value: number; color: string }[];
}

export function aggregateCosts(data: ClaudeCodeDataPoint[]): CostAggregation {
  let totalCostCents = 0;
  const dailyMap = new Map<string, number>();
  const memberMap = new Map<string, number>();
  const modelMap = new Map<string, number>();

  for (const d of data) {
    totalCostCents += d.estimated_cost_usd_cents;

    if (d.date) {
      dailyMap.set(d.date, (dailyMap.get(d.date) ?? 0) + d.estimated_cost_usd_cents / 100);
    }

    if (d.actor?.email_address) {
      const name = EMAIL_TO_NAME[d.actor.email_address] ?? d.actor.email_address;
      memberMap.set(name, (memberMap.get(name) ?? 0) + d.estimated_cost_usd_cents / 100);
    }

    if (d.model) {
      modelMap.set(d.model, (modelMap.get(d.model) ?? 0) + d.estimated_cost_usd_cents / 100);
    }
  }

  const dailyCosts = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, cost]) => ({ date, cost }));

  const projected = projectMonthlyCost(dailyCosts);

  // M-7 fix: 하드코딩 30 → 해당 월의 실제 일수 사용
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const daysInCurrentMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();

  const dailyWithProjection = dailyCosts.map((d) => ({
    ...d,
    projected: d.date >= todayStr ? projected / daysInCurrentMonth : undefined,
  }));

  const memberCosts = Array.from(memberMap.entries())
    .map(([name, cost]) => ({ name, tokens: 0, cost }))
    .sort((a, b) => b.cost - a.cost);

  const modelCosts = Array.from(modelMap.entries())
    .map(([model, cost]) => ({
      name: getModelLabel(model),
      value: cost,
      color: getModelColor(model),
    }))
    .sort((a, b) => b.value - a.value);

  const days = dailyMap.size || 1;
  const avgDaily = totalCostCents / 100 / days;

  return {
    totalCostUsd: totalCostCents / 100,
    avgDailyCost: avgDaily,
    projectedMonthly: projected,
    daily: dailyWithProjection,
    memberCosts,
    modelCosts,
  };
}

// lib/points.ts
export type StepName = 'outline' | 'draft' | 'feedback' | 'rewrite' | 'final' | 'refs';

/** 每次使用固定扣 1 分 */
export const USE_COST = 1;

export const MODE_COST: Record<StepName, Record<string, number>> = {
  outline: { free: 1, flash: 1, pro: 1 },
  draft:   { free: 1, pro: 1 },
  feedback:{ free: 1, flash: 1 },
  rewrite: { free: 1, pro: 1 },
  final:   { free: 1, undetectable: 1 },
  refs:    { free: 1, web: 1 },
};

export function getCost(step: StepName, mode: string) {
  const t = MODE_COST[step] || {};
  return t[mode] ?? USE_COST;
}

export type BpClass = 'optimal' | 'normal' | 'stage1' | 'stage2';

export function classifyBP(sys: number, dia: number): BpClass {
  if (sys >= 160 || dia >= 100) return 'stage2';
  if (sys >= 140 || dia >= 90)  return 'stage1';
  if (sys >= 120 || dia >= 80)  return 'normal';
  return 'optimal';
}

export const BP_CLASS_COLOR: Record<BpClass, string> = {
  optimal: 'var(--zone-optimal)',
  normal:  'var(--zone-normal)',
  stage1:  'var(--zone-stage1)',
  stage2:  'var(--zone-stage2)',
};

export const BP_CLASS_BG: Record<BpClass, string> = {
  optimal: 'var(--zone-optimal-bg)',
  normal:  'var(--zone-normal-bg)',
  stage1:  'var(--zone-stage1-bg)',
  stage2:  'var(--zone-stage2-bg)',
};

/** Категорії, що вважаються «у межах норми» для KPI. */
export const NORMAL_CLASSES: ReadonlySet<BpClass> =
  new Set(['optimal', 'normal']);

export type BpRange = { sys: string; dia: string };

/** Текстові діапазони для UI. Мають збігатися з порогами у classifyBP. */
export const BP_CLASS_RANGE: Record<BpClass, BpRange> = {
  optimal: { sys: '< 120',   dia: '< 80'  },
  normal:  { sys: '120–139', dia: '80–89' },
  stage1:  { sys: '140–159', dia: '90–99' },
  stage2:  { sys: '≥ 160',   dia: '≥ 100' },
};

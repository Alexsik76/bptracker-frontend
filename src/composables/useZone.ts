export type Zone = {
  key: 'optimal' | 'normal' | 'stage1' | 'stage2';
  label: string;
  color: string;
  bg: string;
};

export const DEFAULT_ZONE: Zone = {
  key: 'optimal',
  label: 'Оптимальний',
  color: '#22c55e',
  bg: 'rgba(34,197,94,0.12)',
};

export function getZone(sys: number, dia: number): Zone {
  if (sys < 120 && dia < 80)
    return { key: 'optimal', label: 'Оптимальний', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' };
  if (sys < 130 && dia < 80)
    return { key: 'normal', label: 'Норма', color: '#84cc16', bg: 'rgba(132,204,22,0.12)' };
  if (sys < 140 || dia < 90)
    return { key: 'stage1', label: 'Ступінь I', color: '#f97316', bg: 'rgba(249,115,22,0.12)' };
  return { key: 'stage2', label: 'Ступінь II', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
}

export function zoneProgressPct(sys: number): number {
  return Math.round(Math.max(0, Math.min(100, ((Math.max(90, sys) - 90) / 90) * 100)));
}

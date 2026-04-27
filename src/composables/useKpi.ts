import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { classifyBP } from '../utils/bp';
import type { BpClass } from '../utils/bp';
import type { Measurement } from '../types/api';

export interface KpiData {
  last: Measurement;
  lastClass: BpClass;
  avgSys: number | null;
  avgDia: number | null;
  avgPulse: number | null;
  normalShare: number | null;
  normalCount: number;
  totalLast7: number;
  deltaSys: number | null;
  deltaDia: number | null;
  deltaIcon: '↑' | '↓' | '→' | '—';
  deltaColor: string;
}

export function useKpi(source: MaybeRefOrGetter<Measurement[]>) {
  return computed((): KpiData | null => {
    const all = [...toValue(source)].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    );
    if (!all.length) return null;

    const now = Date.now();
    const week = 7 * 86400000;
    const last7 = all.filter((m) => now - new Date(m.recordedAt).getTime() < week);
    const prev7 = all.filter((m) => {
      const age = now - new Date(m.recordedAt).getTime();
      return age >= week && age < 2 * week;
    });

    const avgNum = (arr: number[]): number | null =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    const last = all[0];
    const lastClass = classifyBP(last.sys, last.dia);
    const avgSys = avgNum(last7.map((m) => m.sys));
    const avgDia = avgNum(last7.map((m) => m.dia));
    const avgPulse = avgNum(last7.map((m) => m.pulse));

    const normalCount = last7.filter((m) => classifyBP(m.sys, m.dia) === 'normal').length;
    const totalLast7 = last7.length;
    const normalShare = totalLast7 > 0 ? normalCount / totalLast7 : null;

    let deltaSys: number | null = null;
    let deltaDia: number | null = null;
    if (last7.length >= 3 && prev7.length >= 3) {
      const prevSys = avgNum(prev7.map((m) => m.sys));
      const prevDia = avgNum(prev7.map((m) => m.dia));
      if (avgSys !== null && prevSys !== null) deltaSys = avgSys - prevSys;
      if (avgDia !== null && prevDia !== null) deltaDia = avgDia - prevDia;
    }

    const deltaIcon: '↑' | '↓' | '→' | '—' =
      deltaSys === null ? '—' : deltaSys > 0 ? '↑' : deltaSys < 0 ? '↓' : '→';
    const deltaColor =
      deltaSys === null || deltaSys === 0
        ? 'var(--color-text-muted)'
        : deltaSys > 0
          ? 'var(--color-danger)'
          : 'var(--color-success)';

    return {
      last,
      lastClass,
      avgSys,
      avgDia,
      avgPulse,
      normalShare,
      normalCount,
      totalLast7,
      deltaSys,
      deltaDia,
      deltaIcon,
      deltaColor,
    };
  });
}

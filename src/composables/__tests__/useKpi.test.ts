import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useKpi } from '../useKpi';
import type { Measurement } from '../../types/api';

// Pin "now" so all time-window assertions are deterministic.
const FIXED_NOW = new Date('2024-06-15T12:00:00.000Z').getTime();
const DAY = 86_400_000;

let uid = 0;

beforeEach(() => {
  uid = 0;
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function m(sys: number, dia: number, pulse: number, msAgo: number): Measurement {
  return {
    id: String(++uid),
    recordedAt: new Date(FIXED_NOW - msAgo).toISOString(),
    sys,
    dia,
    pulse,
  };
}

// ─── Empty / null ─────────────────────────────────────────────────────────────

describe('empty array', () => {
  it('returns null — no throw, no NaN', () => {
    expect(() => useKpi([])).not.toThrow();
    expect(useKpi([]).value).toBeNull();
  });
});

// ─── Single measurement ───────────────────────────────────────────────────────

describe('single measurement', () => {
  it('sets last to the only item', () => {
    const item = m(125, 82, 72, DAY);
    expect(useKpi([item]).value!.last).toBe(item);
  });

  it('avg fields equal the single value', () => {
    const v = useKpi([m(125, 82, 72, DAY)]).value!;
    expect(v.avgSys).toBe(125);
    expect(v.avgDia).toBe(82);
    expect(v.avgPulse).toBe(72);
  });

  it('delta is null, icon is —, color is muted', () => {
    const v = useKpi([m(120, 80, 70, DAY)]).value!;
    expect(v.deltaSys).toBeNull();
    expect(v.deltaDia).toBeNull();
    expect(v.deltaIcon).toBe('—');
    expect(v.deltaColor).toBe('var(--color-text-muted)');
  });

  it('totalLast7 is 1 when measurement is within 7 days', () => {
    expect(useKpi([m(120, 80, 70, DAY)]).value!.totalLast7).toBe(1);
  });
});

// ─── Standard dataset (5 measurements in last 7 days) ────────────────────────

describe('standard dataset — 5 measurements, all in last 7 days', () => {
  // sys: 120+130+125+115+135 = 625 / 5 = 125
  // dia: 80+85+82+78+88      = 413 / 5 = 82.6 → 83
  // pulse: 70+75+72+68+78    = 363 / 5 = 72.6 → 73
  const data = () => [
    m(120, 80, 70, 1 * DAY),
    m(130, 85, 75, 2 * DAY),
    m(125, 82, 72, 3 * DAY),
    m(115, 78, 68, 4 * DAY),
    m(135, 88, 78, 5 * DAY),
  ];

  it('computes correct averages (matches manual calculation)', () => {
    const v = useKpi(data()).value!;
    expect(v.avgSys).toBe(125);
    expect(v.avgDia).toBe(83);
    expect(v.avgPulse).toBe(73);
    expect(v.totalLast7).toBe(5);
  });

  it('last is the most recent measurement', () => {
    const items = [
      m(120, 80, 70, 3 * DAY),
      m(130, 85, 75, 1 * DAY), // most recent
      m(125, 82, 72, 2 * DAY),
    ];
    expect(useKpi(items).value!.last.sys).toBe(130);
  });

  it('normalShare counts only "normal" BP measurements', () => {
    const items = [
      m(115, 75, 70, 1 * DAY), // normal  (sys<120, dia<80)
      m(125, 78, 72, 2 * DAY), // elevated (sys>=120)
      m(135, 88, 75, 3 * DAY), // stage1  (sys>=130)
    ];
    const v = useKpi(items).value!;
    expect(v.normalCount).toBe(1);
    expect(v.normalShare).toBeCloseTo(1 / 3);
  });

  it('classifies last measurement correctly', () => {
    expect(useKpi([m(145, 95, 80, DAY)]).value!.lastClass).toBe('stage2');
    expect(useKpi([m(115, 75, 70, DAY)]).value!.lastClass).toBe('normal');
  });
});

// ─── Measurements outside both windows ───────────────────────────────────────

describe('all measurements older than 14 days', () => {
  it('last is set but last7 is empty → avgSys/Dia/Pulse null, normalShare null', () => {
    const v = useKpi([m(120, 80, 70, 15 * DAY)]).value!;
    expect(v.last.sys).toBe(120);
    expect(v.avgSys).toBeNull();
    expect(v.avgDia).toBeNull();
    expect(v.avgPulse).toBeNull();
    expect(v.normalShare).toBeNull();
    expect(v.totalLast7).toBe(0);
  });
});

// ─── Delta computation ────────────────────────────────────────────────────────

describe('delta computation', () => {
  it('computes deltaSys and deltaDia when both windows have ≥3 items', () => {
    const items = [
      // last 7 days — avg sys=130, dia=85
      m(130, 85, 75, 1 * DAY),
      m(130, 85, 75, 2 * DAY),
      m(130, 85, 75, 3 * DAY),
      // prev 7 days — avg sys=120, dia=80
      m(120, 80, 70, 8 * DAY),
      m(120, 80, 70, 9 * DAY),
      m(120, 80, 70, 10 * DAY),
    ];
    const v = useKpi(items).value!;
    expect(v.deltaSys).toBe(10); // 130 − 120
    expect(v.deltaDia).toBe(5); // 85 − 80
  });

  it('deltaIcon ↑ and color danger when sys increased', () => {
    const items = [
      m(130, 85, 75, 1 * DAY),
      m(130, 85, 75, 2 * DAY),
      m(130, 85, 75, 3 * DAY),
      m(120, 80, 70, 8 * DAY),
      m(120, 80, 70, 9 * DAY),
      m(120, 80, 70, 10 * DAY),
    ];
    const v = useKpi(items).value!;
    expect(v.deltaIcon).toBe('↑');
    expect(v.deltaColor).toBe('var(--color-danger)');
  });

  it('deltaIcon ↓ and color success when sys decreased', () => {
    const items = [
      m(110, 75, 65, 1 * DAY),
      m(110, 75, 65, 2 * DAY),
      m(110, 75, 65, 3 * DAY),
      m(130, 85, 75, 8 * DAY),
      m(130, 85, 75, 9 * DAY),
      m(130, 85, 75, 10 * DAY),
    ];
    const v = useKpi(items).value!;
    expect(v.deltaIcon).toBe('↓');
    expect(v.deltaColor).toBe('var(--color-success)');
  });

  it('deltaIcon → when deltaSys is exactly 0', () => {
    const items = [
      m(120, 80, 70, 1 * DAY),
      m(120, 80, 70, 2 * DAY),
      m(120, 80, 70, 3 * DAY),
      m(120, 80, 70, 8 * DAY),
      m(120, 80, 70, 9 * DAY),
      m(120, 80, 70, 10 * DAY),
    ];
    const v = useKpi(items).value!;
    expect(v.deltaSys).toBe(0);
    expect(v.deltaIcon).toBe('→');
    expect(v.deltaColor).toBe('var(--color-text-muted)');
  });

  it('delta is null when fewer than 3 items in either window', () => {
    const items = [
      // only 2 in last7
      m(130, 85, 75, 1 * DAY),
      m(130, 85, 75, 2 * DAY),
      // 3 in prev7
      m(120, 80, 70, 8 * DAY),
      m(120, 80, 70, 9 * DAY),
      m(120, 80, 70, 10 * DAY),
    ];
    expect(useKpi(items).value!.deltaSys).toBeNull();
  });
});

// ─── 7-day boundary (timezone-safe, millisecond-based) ────────────────────────

describe('7-day boundary', () => {
  it('includes measurement at 7*DAY − 1 ms, excludes at exactly 7*DAY', () => {
    // useKpi condition: (now - time) < 7*DAY
    const inside = m(120, 80, 70, 7 * DAY - 1); // just inside
    const outside = m(125, 82, 72, 7 * DAY); // exactly at boundary → excluded
    const v = useKpi([inside, outside]).value!;
    expect(v.totalLast7).toBe(1);
    expect(v.avgSys).toBe(120); // only inside contributes
  });

  it('two measurements near a UTC midnight boundary are both counted if within 7 days', () => {
    // Timestamps 30 min apart straddling a local midnight are still both within 7 days
    const before = m(120, 80, 70, 1 * DAY - 30 * 60_000); // ~23:30 relative
    const after = m(125, 82, 72, 1 * DAY + 30 * 60_000); // ~00:30 relative
    expect(useKpi([before, after]).value!.totalLast7).toBe(2);
  });
});

// ─── Stability / P7 (no duplicate computation, no NaN) ───────────────────────

describe('stability (P7)', () => {
  it('repeated .value access returns identical result', () => {
    const items = Array.from({ length: 5 }, (_, i) => m(120 + i, 80 + i, 70 + i, (i + 1) * DAY));
    const kpi = useKpi(items);
    expect(JSON.stringify(kpi.value)).toBe(JSON.stringify(kpi.value));
  });

  it('no NaN in any numeric field', () => {
    const v = useKpi([m(120, 80, 70, DAY)]).value!;
    const numericFields = [
      v.avgSys,
      v.avgDia,
      v.avgPulse,
      v.normalShare,
      v.deltaSys,
      v.deltaDia,
    ] as const;
    for (const field of numericFields) {
      if (field !== null) expect(field).not.toBeNaN();
    }
  });
});

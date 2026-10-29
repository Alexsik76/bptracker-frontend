import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getBrowserUtcOffset } from '../utils/datetime';

export type PeriodKey = 'today' | '7d' | '30d' | '90d' | 'custom';

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'custom', label: 'Custom' },
];

const PERIOD_DAYS: Record<Exclude<PeriodKey, 'custom'>, number> = {
  today: 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const DEFAULT_PERIOD: PeriodKey = '7d';

type QueryPatch = Record<string, string | number | null | undefined>;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Full ISO moment in local time with the browser's UTC offset. */
function toIsoWithOffset(d: Date): string {
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${date}T${time}${getBrowserUtcOffset(d)}`;
}

function parseDay(value: string | undefined, endOfDay: boolean): Date | null {
  const m = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  if (!m) return null;
  const [y, mo, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return endOfDay ? new Date(y, mo - 1, day, 23, 59, 59) : new Date(y, mo - 1, day, 0, 0, 0);
}

/**
 * Route-query backed state shared by the Statistics and Logs views:
 * the period plus a generic patch helper for the other filters.
 */
export function useActivityQuery() {
  const route = useRoute();
  const router = useRouter();

  function str(key: string): string | undefined {
    const v = route.query[key];
    const s = Array.isArray(v) ? v[0] : v;
    return s ? s : undefined;
  }

  function num(key: string): number | undefined {
    const s = str(key);
    const n = s === undefined ? NaN : Number(s);
    return Number.isFinite(n) ? n : undefined;
  }

  /** Merges the patch into the route query; any change except `page` resets the page. */
  function patch(changes: QueryPatch) {
    const next: Record<string, string> = {};
    for (const [key, value] of Object.entries(route.query)) {
      const s = Array.isArray(value) ? value[0] : value;
      if (s) next[key] = s;
    }
    if (!('page' in changes)) delete next.page;
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === undefined || value === '') {
        delete next[key];
      } else {
        next[key] = String(value);
      }
    }
    router.replace({ query: next });
  }

  const period = computed<PeriodKey>(() => {
    const p = str('period');
    return PERIOD_OPTIONS.some((o) => o.value === p) ? (p as PeriodKey) : DEFAULT_PERIOD;
  });
  const customFrom = computed(() => str('from'));
  const customTo = computed(() => str('to'));

  /** date_from / date_to as full ISO moments with the browser's UTC offset. */
  const range = computed<{ date_from?: string; date_to?: string }>(() => {
    if (period.value === 'custom') {
      const from = parseDay(customFrom.value, false);
      const to = parseDay(customTo.value, true);
      return {
        date_from: from ? toIsoWithOffset(from) : undefined,
        date_to: to ? toIsoWithOffset(to) : undefined,
      };
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (PERIOD_DAYS[period.value] - 1));
    const end = new Date();
    end.setHours(23, 59, 59, 0);
    return { date_from: toIsoWithOffset(start), date_to: toIsoWithOffset(end) };
  });

  function setPeriod(value: PeriodKey) {
    patch({
      period: value === DEFAULT_PERIOD ? null : value,
      from: value === 'custom' ? customFrom.value : null,
      to: value === 'custom' ? customTo.value : null,
    });
  }

  return { str, num, patch, period, customFrom, customTo, range, setPeriod };
}

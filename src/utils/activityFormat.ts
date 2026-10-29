import { formatNumber } from './datetime';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Formats an ISO moment in the browser's local time: "DD.MM.YYYY HH:MM" (+ ":SS").
 */
export function formatDateTime(isoStr: string | null | undefined, withSeconds = false): string {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return String(isoStr);
  const base = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return withSeconds ? `${base}:${pad(d.getSeconds())}` : base;
}

/**
 * Formats a "YYYY-MM-DD" key as "DD.MM.YYYY" without any time zone conversion.
 */
export function formatDayKey(key: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : key;
}

/**
 * Formats a duration: "184 ms" below one second, "20,0 s" above.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${formatNumber(Math.round(ms))} ms`;
  return `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
}

/**
 * Extracts a readable message from a thrown value (ApiError carries the server detail).
 */
export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Unexpected error';
}

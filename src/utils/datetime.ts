/**
 * Date and time formatting utilities
 */

/**
 * Returns the browser's current UTC offset string, e.g. "+02:00" or "-05:00".
 */
export function getBrowserUtcOffset(d: Date = new Date()): string {
  const offsetMinutes = -d.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
  const mins = String(absMinutes % 60).padStart(2, '0');
  return `${sign}${hours}:${mins}`;
}

/**
 * Formats an ISO datetime string into local time with browser UTC offset:
 * e.g. "29.10.2026 14:12 (+02:00)"
 */
export function formatLocalDateTimeWithOffset(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return String(isoStr);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const offset = getBrowserUtcOffset(d);

  return `${day}.${month}.${year} ${hours}:${minutes} (${offset})`;
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into "DD.MM.YYYY".
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}.${month}.${year}`;
}

/**
 * Converts an ISO string into datetime-local input format: "YYYY-MM-DDTHH:mm"
 */
export function toDatetimeLocal(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a datetime-local input value ("YYYY-MM-DDTHH:mm") into a full ISO string
 * with the browser's UTC offset, e.g. "2026-10-29T14:12:00+02:00".
 */
export function fromDatetimeLocal(localStr: string): string {
  if (!localStr) return '';
  // Ensure seconds are included
  const base = localStr.length === 16 ? `${localStr}:00` : localStr;
  const d = new Date(localStr);
  const offset = isNaN(d.getTime()) ? getBrowserUtcOffset() : getBrowserUtcOffset(d);
  return `${base}${offset}`;
}

/**
 * Formats a number with thin space thousands grouping, e.g. 1 248.
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

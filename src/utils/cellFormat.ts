import {
  formatLocalDateTimeWithOffset,
  formatDate,
  formatNumber,
} from './datetime';

/**
 * Format a cell value according to its column type.
 */
export function formatCellValue(val: unknown, type: string): string {
  if (val === null || val === undefined) return '—';
  if (type === 'datetime') {
    return formatLocalDateTimeWithOffset(String(val));
  }
  if (type === 'date') {
    return formatDate(String(val));
  }
  if (type === 'boolean') {
    return val ? '✓ yes' : '× no';
  }
  if (type === 'json') {
    return typeof val === 'string' ? val : JSON.stringify(val);
  }
  if (type === 'integer' || type === 'number') {
    return typeof val === 'number' ? formatNumber(val) : String(val);
  }
  return String(val);
}

/**
 * Truncate a string to maxLen characters with an ellipsis.
 */
export function truncate(str: string, maxLen = 45): string {
  if (!str) return '';
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;
}

/**
 * Shorten an ID or UUID string for display, preserving readability.
 */
export function formatIdOrUuid(val: unknown, maxLen = 14): string {
  if (val === null || val === undefined) return '—';
  return truncate(String(val), maxLen);
}

/**
 * Parse a foreign key string (format: 'tableName.columnName') into its components.
 */
export function parseFk(fkStr: string | null): { table: string; column: string } | null {
  if (!fkStr) return null;
  const parts = fkStr.split('.');
  return { table: parts[0], column: parts[1] || 'id' };
}

/**
 * Generate full tooltip text for a cell value.
 */
export function getFullCellTooltip(val: unknown, type: string): string {
  if (val === null || val === undefined) return 'null';
  if (type === 'datetime') {
    return `${val} (${formatLocalDateTimeWithOffset(String(val))})`;
  }
  if (type === 'json') {
    return typeof val === 'string' ? val : JSON.stringify(val, null, 2);
  }
  return String(val);
}

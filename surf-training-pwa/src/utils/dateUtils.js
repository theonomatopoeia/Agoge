// ═══════════════════════════════════════════════════════════════
// DATE UTILITIES
// ═══════════════════════════════════════════════════════════════
// All dates normalized to midnight local time to prevent
// timezone-shift bugs when traveling for surf trips.

/**
 * Create a date at midnight local time (strips time component)
 */
export function normalizeDate(d) {
  const date = new Date(d);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Generate a stable string key for a date: "2026-03-23"
 */
export function dateKey(d) {
  const date = normalizeDate(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse a dateKey string back into a Date object
 */
export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format a date for display: "March 23"
 */
export function formatDateShort(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format: "March 2026"
 */
export function formatMonthYear(d) {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Day name abbreviation: "Mon", "Tue", etc.
 */
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function dayName(d) {
  return DAY_NAMES[d.getDay()];
}

/**
 * Check if two dates are the same calendar day
 */
export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/**
 * Format a Date to YYYY-MM-DD for <input type="date"> value
 */
export function toInputDateString(d) {
  const date = normalizeDate(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse YYYY-MM-DD from <input type="date"> into a Date
 */
export function fromInputDateString(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

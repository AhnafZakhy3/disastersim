/**
 * Lightweight HTML & Input Sanitization Utilities
 * Protects against DOM-based XSS and path traversal in client-side Leaflet renderings.
 */

/**
 * Safely escapes HTML special characters to prevent DOM-based XSS injection.
 */
export function escapeHtml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes a filename to prevent path traversal and control character exploits.
 */
export function sanitizeFilename(name: string, fallback: string = 'export'): string {
  const sanitized = name.replace(/[^a-zA-Z0-9_\-\.]/g, '_').slice(0, 100);
  return sanitized.length > 0 ? sanitized : fallback;
}

/**
 * Safely clamps and validates a numerical input, providing a fallback if NaN or infinite.
 */
export function sanitizeNumeric(
  val: number | undefined | null,
  min: number,
  max: number,
  fallback: number
): number {
  if (val === undefined || val === null || typeof val !== 'number' || Number.isNaN(val)) {
    return fallback;
  }
  if (val === Infinity) return max;
  if (val === -Infinity) return min;
  return Math.min(Math.max(val, min), max);
}

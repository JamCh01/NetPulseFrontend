/**
 * Unified date/time formatting utilities.
 *
 * Backend and agents use UTC. The browser's `new Date()` automatically
 * converts UTC ISO strings and Unix timestamps to the user's local timezone.
 * These helpers ensure consistent locale-aware formatting across the app.
 */

function getLocale(language: string): string {
  return language === 'zh' ? 'zh-CN' : 'en-US'
}

/** Date only: "Jan 1, 2026" / "2026年1月1日" */
export function formatDate(iso: string, language: string): string {
  return new Date(iso).toLocaleDateString(getLocale(language), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Date + time: "Jan 1, 2026, 14:30" / "2026年1月1日 14:30" */
export function formatDateTime(iso: string, language: string): string {
  return new Date(iso).toLocaleString(getLocale(language), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Format a millisecond timestamp for chart tooltips: "2026-01-01 14:30" (local time) */
export function formatChartTime(tsMs: number): string {
  const d = new Date(tsMs)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

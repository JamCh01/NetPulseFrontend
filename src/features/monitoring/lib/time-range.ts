export type MonitoringGranularity = 'raw' | 'hourly' | 'daily'

export type MonitoringTimeRange = {
  start: number
  end: number
  granularity: MonitoringGranularity
  stepSec?: number
  relativeDurationMs?: number
  autoRefresh?: boolean
}

export const ONE_HOUR_MS = 60 * 60 * 1000
export const AUTO_REFRESH_INTERVAL_MS = 60 * 1000

export function granularityForTimeRange(start: number, end: number): MonitoringGranularity {
  const spanMs = end - start
  const spanHours = spanMs / (1000 * 60 * 60)
  const spanDays = spanHours / 24
  if (spanHours <= 24) return 'raw'
  if (spanDays <= 30) return 'hourly'
  return 'daily'
}

export function defaultStepForGranularity(granularity: MonitoringGranularity): number {
  if (granularity === 'raw') return 60
  if (granularity === 'hourly') return 3600
  return 86400
}

export function normalizeStep(stepSec: number | undefined, granularity: MonitoringGranularity): number {
  const value = stepSec ?? defaultStepForGranularity(granularity)
  return Math.min(Math.max(value, 60), 86400)
}

export function createRelativeTimeRange(
  durationMs = ONE_HOUR_MS,
  now = Date.now(),
  stepSec?: number,
): MonitoringTimeRange {
  const start = now - durationMs
  const end = now
  const granularity = granularityForTimeRange(start, end)
  return {
    start,
    end,
    granularity,
    stepSec: normalizeStep(stepSec ?? defaultStepForGranularity(granularity), granularity),
    relativeDurationMs: durationMs,
    autoRefresh: true,
  }
}

export function createAbsoluteTimeRange(start: number, end: number, stepSec?: number): MonitoringTimeRange {
  const granularity = granularityForTimeRange(start, end)
  return {
    start,
    end,
    granularity,
    stepSec: normalizeStep(stepSec ?? defaultStepForGranularity(granularity), granularity),
    autoRefresh: false,
  }
}

export function refreshRelativeTimeRange(range: MonitoringTimeRange, now = Date.now()): MonitoringTimeRange {
  if (!range.autoRefresh || !range.relativeDurationMs) return range
  const start = now - range.relativeDurationMs
  const end = now
  return {
    ...range,
    start,
    end,
    granularity: granularityForTimeRange(start, end),
  }
}

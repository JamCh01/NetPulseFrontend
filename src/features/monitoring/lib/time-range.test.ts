import { describe, expect, it } from 'vitest'
import {
  AUTO_REFRESH_INTERVAL_MS,
  createAbsoluteTimeRange,
  createRelativeTimeRange,
  ONE_HOUR_MS,
  refreshRelativeTimeRange,
} from './time-range'

describe('time-range', () => {
  it('creates the default relative range as the latest one hour with auto refresh enabled', () => {
    const now = Date.UTC(2026, 4, 23, 8, 0, 0)
    const range = createRelativeTimeRange(undefined, now)

    expect(range).toMatchObject({
      start: now - ONE_HOUR_MS,
      end: now,
      granularity: 'raw',
      stepSec: 60,
      relativeDurationMs: ONE_HOUR_MS,
      autoRefresh: true,
    })
  })

  it('moves a relative range forward on the refresh cadence while preserving duration', () => {
    const now = Date.UTC(2026, 4, 23, 8, 0, 0)
    const range = createRelativeTimeRange(ONE_HOUR_MS, now)
    const refreshed = refreshRelativeTimeRange(range, now + AUTO_REFRESH_INTERVAL_MS)

    expect(refreshed.start).toBe(now + AUTO_REFRESH_INTERVAL_MS - ONE_HOUR_MS)
    expect(refreshed.end).toBe(now + AUTO_REFRESH_INTERVAL_MS)
    expect(refreshed.end - refreshed.start).toBe(ONE_HOUR_MS)
    expect(refreshed.autoRefresh).toBe(true)
  })

  it('does not move an absolute range during auto refresh ticks', () => {
    const start = Date.UTC(2026, 4, 23, 7, 0, 0)
    const end = Date.UTC(2026, 4, 23, 8, 0, 0)
    const range = createAbsoluteTimeRange(start, end, 60)

    expect(refreshRelativeTimeRange(range, end + AUTO_REFRESH_INTERVAL_MS)).toBe(range)
  })
})

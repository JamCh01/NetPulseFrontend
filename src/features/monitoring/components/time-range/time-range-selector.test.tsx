import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GrafanaTimeRangeSelector, TimeRangeSelector } from './time-range-selector'
import { createRelativeTimeRange } from '@/features/monitoring/lib/time-range'

const DAY_MS = 24 * 60 * 60 * 1000

describe('GrafanaTimeRangeSelector', () => {
  it('hides granularity from event result trigger labels', () => {
    const value = createRelativeTimeRange(DAY_MS, Date.UTC(2026, 4, 23, 8, 0, 0))
    render(
      <GrafanaTimeRangeSelector
        value={value}
        onChange={vi.fn()}
        minPresetDurationMs={DAY_MS}
        showStep={false}
      />,
    )

    expect(screen.getByRole('button', { name: /^Last 24 hours$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Last 24 hours Raw/i })).not.toBeInTheDocument()
  })

  it('can hide quick ranges shorter than the minimum duration', async () => {
    const user = userEvent.setup()
    render(
      <GrafanaTimeRangeSelector
        value={createRelativeTimeRange(DAY_MS, Date.UTC(2026, 4, 23, 8, 0, 0))}
        onChange={vi.fn()}
        minPresetDurationMs={DAY_MS}
        showStep={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Last 24 hours/i }))

    expect(screen.queryByRole('button', { name: /Last 1 hour/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Last 6 hours/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Last 24 hours/i })).toHaveLength(2)
    expect(screen.getByRole('button', { name: /Last 7 days/i })).toBeInTheDocument()
  })

  it('can hide compact quick range pills shorter than the minimum duration', () => {
    render(
      <TimeRangeSelector
        value={createRelativeTimeRange(DAY_MS, Date.UTC(2026, 4, 23, 8, 0, 0))}
        onChange={vi.fn()}
        minPresetDurationMs={DAY_MS}
      />,
    )

    expect(screen.queryByRole('button', { name: '1h' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '6h' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '24h' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '7d' })).toBeInTheDocument()
  })

})

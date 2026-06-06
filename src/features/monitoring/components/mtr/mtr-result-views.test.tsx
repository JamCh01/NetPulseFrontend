import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { MtrResultViews } from './mtr-result-views'
import { renderWithProviders } from '@/test/utils'
import type { MonitoringTask, MtrResultSummaryView } from '@/features/monitoring/lib/monitoring-models'

const agentUuid = 'agent-tokyo'

const task: MonitoringTask = {
  task_uuid: 'task-mtr-1',
  name: 'Tokyo MTR',
  task_type: 'mtr',
  interval_sec: 600,
  is_enabled: true,
  probe_config: null,
  target: {
    target_uuid: 'target-1',
    name: 'Tokyo Target',
    target: 'hidden-target.example.com',
    is_anycast: false,
  },
  agent: {
    agent_uuid: agentUuid,
    name: 'Tokyo Agent',
  },
  latest_result: {
    exists: true,
  },
}

function result(index: number): MtrResultSummaryView {
  return {
    result_uuid: `result-${index}`,
    task_uuid: task.task_uuid,
    agent_uuid: agentUuid,
    timestamp: `2026-06-06T${String(index).padStart(2, '0')}:00:00Z`,
    target_reached: true,
    total_hops: 8,
  }
}

describe('MtrResultViews', () => {
  it('keeps the MTR result timeline horizontally scrollable inside its own panel', () => {
    renderWithProviders(
      <MtrResultViews
        tasks={[task]}
        results={Array.from({ length: 12 }, (_, index) => result(index))}
        total={12}
        selectedResultUuid="result-0"
        onSelectResult={vi.fn()}
      />,
    )

    const timelineScroller = screen.getByTestId('mtr-result-timeline-scroll')
    expect(timelineScroller).toHaveClass('max-w-full', 'overflow-x-auto')
    expect(timelineScroller.parentElement).toHaveClass('min-w-0', 'overflow-hidden')
  })
})

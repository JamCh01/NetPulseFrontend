import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'

import { Iperf3ResultViews } from './iperf3-result-views'
import { renderWithProviders } from '@/test/utils'
import type { Iperf3ResultSummaryView, MonitoringTask } from '@/features/monitoring/lib/monitoring-models'

const task: MonitoringTask = {
  task_uuid: 'task-1',
  name: 'Tokyo iperf3',
  task_type: 'iperf3',
  interval_sec: 86400,
  is_enabled: true,
  probe_config: null,
  target: {
    target_uuid: 'target-1',
    name: 'Tokyo Target',
    target: 'secret-iperf.example.com',
    is_anycast: false,
  },
  agent: {
    agent_uuid: 'agent-1',
    name: 'Tokyo Agent',
  },
  latest_result: {
    exists: true,
  },
}

const result: Iperf3ResultSummaryView = {
  result_uuid: 'result-1',
  execution_uuid: 'execution-1',
  task_uuid: 'task-1',
  agent_uuid: 'agent-1',
  timestamp: '2026-06-05T00:00:00Z',
  latest_sample_at: '2026-06-05T00:00:00Z',
  latest_run_status: 'ok',
  mode: 'single_thread',
  parallel: 1,
  port: 5201,
  duration_sec: 10,
  resolved_ip: '93.184.216.34',
  upload_bits_per_second: 900_000_000,
  upload_mbps: 900,
  upload_bytes: 112_500_000,
  upload_retransmits: 0,
  download_bits_per_second: 880_000_000,
  download_mbps: 880,
  download_bytes: 110_000_000,
  download_retransmits: 0,
  upload_intervals: [],
  download_intervals: [],
  upload_end: {},
  download_end: {},
  bits_per_second: 900_000_000,
  throughput_mbps: 900,
  bytes: 112_500_000,
  retransmits: 0,
  success: true,
}

describe('Iperf3ResultViews', () => {
  it('does not render Resolved IP values', () => {
    renderWithProviders(
      <Iperf3ResultViews
        tasks={[task]}
        results={[result]}
        total={1}
        selectedResultUuid="result-1"
        onSelectResult={() => undefined}
      />,
    )

    expect(screen.queryByText('Resolved IP')).not.toBeInTheDocument()
    expect(screen.queryByText('93.184.216.34')).not.toBeInTheDocument()
  })
})

import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MtrDetailTable } from './mtr-detail-table'
import type { MtrResultDetailView } from '@/features/monitoring/lib/monitoring-models'

const result: MtrResultDetailView = {
  result_uuid: 'result-1',
  task_uuid: 'task-1',
  agent_uuid: 'agent-1',
  timestamp: '2026-06-06T01:00:00Z',
  target_reached: true,
  total_hops: 2,
  resolved_ip: '[Target IP]',
  duration_ms: 123,
  as_path: ['17816', '4837', '17676'],
  hops: [
    {
      hop: 1,
      ip: '192.0.2.1',
      hostname: 'hop-1.example',
      asn: '17816',
      packets_sent: 10,
      packets_received: 10,
      packet_loss_pct: 0,
      avg_ms: 2.1,
      best_ms: 1.8,
      worst_ms: 3.0,
    },
    {
      hop: 2,
      ip: '[Target IP]',
      hostname: null,
      asn: '17676',
      packets_sent: 10,
      packets_received: 8,
      packet_loss_pct: 20,
      avg_ms: 20.2,
      best_ms: 18.5,
      worst_ms: 30.3,
    },
  ],
}

describe('MtrDetailTable', () => {
  it('renders AS Path as an arrow chain and includes sent and received columns', () => {
    render(<MtrDetailTable result={result} />)

    expect(screen.getByText('17816->4837->17676')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '发送' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '接收' })).toBeInTheDocument()

    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getAllByText('10')).toHaveLength(2)
    expect(within(rows[2]).getAllByText('10')).toHaveLength(1)
    expect(within(rows[2]).getByText('8')).toBeInTheDocument()
  })
})

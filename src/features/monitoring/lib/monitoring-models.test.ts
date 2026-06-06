import { describe, expect, it } from 'vitest'
import { normalizeMonitoringTask, normalizeMtrDetail } from './monitoring-models'

describe('monitoring models', () => {
  it('normalizes task ip_family for monitoring metric tables', () => {
    const task = normalizeMonitoringTask({
      task_uuid: 'task-1',
      name: 'IPv6 ICMP',
      task_type: 'icmp',
      ip_family: '6',
      target: {
        target_uuid: 'target-1',
        name: 'Target',
        target: 'example.com',
        is_anycast: false,
      },
      agent: {
        agent_uuid: 'agent-1',
        name: 'Osaka',
      },
      latest_result: {
        exists: true,
      },
    })

    expect(task.ip_family).toBe('6')
  })

  it('normalizes MTR hop sent and received packet counts', () => {
    const detail = normalizeMtrDetail({
      result_uuid: 'result-1',
      task_uuid: 'task-1',
      latest_sample_at: '2026-06-06T01:00:00Z',
      latest_run_status: 'success',
      as_path: ['17816', '4837', '17676'],
      hops: [{
        hop: 1,
        addresses: [{
          ip: '192.0.2.1',
          asn: '17816',
          packets_sent: 10,
          packets_received: 8,
          packet_loss_pct: 20,
          avg_ms: 12,
          best_ms: 10,
          worst_ms: 18,
          mpls: [],
        }],
      }],
    })

    expect(detail.hops[0]).toEqual(expect.objectContaining({
      packets_sent: 10,
      packets_received: 8,
    }))
  })
})

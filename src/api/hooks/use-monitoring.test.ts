import { describe, expect, it } from 'vitest'
import { monitoringTaskAgentDisplayName } from './use-monitoring'
import type { MonitoringTask } from '@/features/monitoring/lib/monitoring-models'

function task(overrides: Partial<MonitoringTask> = {}): MonitoringTask {
  return {
    task_uuid: 'task-1',
    name: 'TCP task',
    task_type: 'tcp',
    interval_sec: 60,
    is_enabled: true,
    probe_config: { port: 22 },
    target: {
      target_uuid: 'target-1',
      name: 'Target',
      target: 'example.com',
      is_anycast: false,
    },
    agent: {
      agent_uuid: 'agent-1',
      name: '宁波电信',
    },
    latest_result: {
      exists: true,
    },
    ...overrides,
  }
}

describe('monitoringTaskAgentDisplayName', () => {
  it('uses the agent name without appending the TCP port', () => {
    expect(monitoringTaskAgentDisplayName(task())).toBe('宁波电信')
  })

  it('falls back to task name when the task has no agent', () => {
    expect(monitoringTaskAgentDisplayName(task({ agent: null }))).toBe('TCP task')
  })
})

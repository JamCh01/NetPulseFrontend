import { describe, expect, it } from 'vitest'
import { buildAgentFilterOptions, filterTasksBySelectedAgents, labelForAgentSelection } from './agent-filter'
import type { MonitoringTask } from './monitoring-models'

function task(taskUuid: string, agentUuid: string, agentName: string): MonitoringTask {
  return {
    task_uuid: taskUuid,
    name: taskUuid,
    task_type: 'icmp',
    interval_sec: 60,
    is_enabled: true,
    probe_config: null,
    target: {
      target_uuid: 'target-1',
      name: 'Target',
      target: '8.8.8.8',
      is_anycast: true,
    },
    agent: {
      agent_uuid: agentUuid,
      name: agentName,
    },
    latest_result: {
      exists: true,
    },
  }
}

describe('agent-filter', () => {
  it('deduplicates agent options and sorts them by name', () => {
    const options = buildAgentFilterOptions([
      task('task-1', 'agent-b', 'Seoul'),
      task('task-2', 'agent-a', 'Tokyo'),
      task('task-3', 'agent-b', 'Seoul'),
    ])

    expect(options).toEqual([
      { agentUuid: 'agent-b', agentName: 'Seoul' },
      { agentUuid: 'agent-a', agentName: 'Tokyo' },
    ])
  })

  it('filters tasks to selected agent UUIDs before metrics queries are built', () => {
    const tasks = [
      task('task-1', 'agent-a', 'Tokyo'),
      task('task-2', 'agent-b', 'Seoul'),
      task('task-3', 'agent-c', 'Singapore'),
    ]

    expect(filterTasksBySelectedAgents(tasks, ['agent-a', 'agent-c']).map((item) => item.task_uuid)).toEqual([
      'task-1',
      'task-3',
    ])
  })

  it('formats the trigger label for all, partial, and empty selections', () => {
    expect(labelForAgentSelection(3, 3)).toBe('全部 Agent')
    expect(labelForAgentSelection(2, 3)).toBe('2/3 Agent')
    expect(labelForAgentSelection(0, 3)).toBe('未选择 Agent')
    expect(labelForAgentSelection(0, 0)).toBe('无 Agent')
  })
})

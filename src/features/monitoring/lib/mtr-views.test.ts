import { describe, expect, it } from 'vitest'
import { buildMtrAgentRows, buildMtrTimelineItems, colorForMtrAgent } from './mtr-views'
import type { MonitoringTask, MtrResultSummaryView } from './monitoring-models'

function task(taskUuid: string, agentUuid: string, agentName: string): MonitoringTask {
  return {
    task_uuid: taskUuid,
    name: taskUuid,
    task_type: 'mtr',
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

function result(resultUuid: string, taskUuid: string, agentUuid: string, timestamp: string, reached: boolean): MtrResultSummaryView {
  return {
    result_uuid: resultUuid,
    task_uuid: taskUuid,
    agent_uuid: agentUuid,
    timestamp,
    target_reached: reached,
    total_hops: reached ? 3 : 2,
  }
}

describe('mtr view helpers', () => {
  it('groups result summaries into latest-first agent rows', () => {
    const rows = buildMtrAgentRows(
      [task('task-a', 'agent-a', 'Tokyo'), task('task-b', 'agent-b', 'Seoul')],
      [
        result('old-a', 'task-a', 'agent-a', '2026-05-22T23:00:00Z', true),
        result('new-a', 'task-a', 'agent-a', '2026-05-23T00:00:00Z', false),
        result('new-b', 'task-b', 'agent-b', '2026-05-22T22:00:00Z', true),
      ],
    )

    expect(rows.map((row) => row.agentName)).toEqual(['Tokyo', 'Seoul'])
    expect(rows[0].latest?.result_uuid).toBe('new-a')
    expect(rows[0].reachedCount).toBe(1)
    expect(rows[0].failedCount).toBe(1)
  })

  it('builds timeline items in chronological order for the selected agents', () => {
    const items = buildMtrTimelineItems(
      [task('task-a', 'agent-a', 'Tokyo')],
      [
        result('bad-a', 'task-a', 'agent-a', '2026-05-23T00:01:00Z', false),
        result('ok-a', 'task-a', 'agent-a', '2026-05-23T00:00:00Z', true),
      ],
    )

    expect(items.map((item) => item.resultUuid)).toEqual(['ok-a', 'bad-a'])
    expect(items[1]).toMatchObject({ agentName: 'Tokyo', reached: false, totalHops: 2 })
  })

  it('assigns stable distinct colors by agent uuid', () => {
    const first = colorForMtrAgent('agent-a')
    const same = colorForMtrAgent('agent-a')
    const second = colorForMtrAgent('agent-b')

    expect(first).toBe(same)
    expect(first).not.toBe(second)
    expect(first).toMatch(/^#[0-9a-f]{6}$/)
  })
})

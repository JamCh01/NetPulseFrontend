import { describe, expect, it } from 'vitest'
import { buildIperf3TimelineItems, colorForIperf3Agent } from './iperf3-views'
import { normalizeIperf3ListItem, type Iperf3ResultSummaryView, type MonitoringTask } from './monitoring-models'

function task(taskUuid: string, agentUuid: string, agentName: string): MonitoringTask {
  return {
    task_uuid: taskUuid,
    name: taskUuid,
    task_type: 'iperf3',
    interval_sec: 86400,
    is_enabled: true,
    probe_config: null,
    target: {
      target_uuid: 'target-1',
      name: 'Target',
      target: 'iperf.example.com',
      is_anycast: false,
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

function result(resultUuid: string, taskUuid: string, agentUuid: string, timestamp: string, bps: number): Iperf3ResultSummaryView {
  return {
    result_uuid: resultUuid,
    execution_uuid: `exec-${resultUuid}`,
    task_uuid: taskUuid,
    agent_uuid: agentUuid,
    timestamp,
    latest_sample_at: timestamp,
    latest_run_status: 'ok',
    mode: 'single_thread',
    parallel: 1,
    port: 5201,
    duration_sec: 10,
    bits_per_second: bps,
    bytes: 12500000,
    retransmits: 0,
    success: true,
  }
}

describe('iperf3 view helpers', () => {
  it('normalizes backend list items with derived timestamps and throughput', () => {
    const item = normalizeIperf3ListItem({
      result_uuid: 'result-1',
      execution_uuid: 'exec-1',
      task_uuid: 'task-a',
      agent_uuid: 'agent-a',
      latest_sample_at: '2026-05-23T00:00:00Z',
      latest_run_status: 'ok',
      mode: 'multi_thread',
      parallel: 8,
      port: 5201,
      duration_sec: 15,
      bits_per_second: 987654321,
      bytes: 1851851852,
      retransmits: 2,
    })

    expect(item).toMatchObject({
      result_uuid: 'result-1',
      execution_uuid: 'exec-1',
      task_uuid: 'task-a',
      agent_uuid: 'agent-a',
      timestamp: '2026-05-23T00:00:00Z',
      mode: 'multi_thread',
      parallel: 8,
      throughput_mbps: 987.654321,
      success: true,
    })
  })

  it('builds iperf3 timeline items in chronological order', () => {
    const items = buildIperf3TimelineItems(
      [task('task-a', 'agent-a', 'Tokyo')],
      [
        result('new-a', 'task-a', 'agent-a', '2026-05-23T00:01:00Z', 900000000),
        result('old-a', 'task-a', 'agent-a', '2026-05-23T00:00:00Z', 800000000),
      ],
    )

    expect(items.map((item) => item.resultUuid)).toEqual(['old-a', 'new-a'])
    expect(items[1]).toMatchObject({ agentName: 'Tokyo', success: true, throughputMbps: 900 })
  })

  it('assigns stable distinct colors by agent uuid', () => {
    const first = colorForIperf3Agent('agent-a')
    const same = colorForIperf3Agent('agent-a')
    const second = colorForIperf3Agent('agent-b')

    expect(first).toBe(same)
    expect(first).not.toBe(second)
    expect(first).toMatch(/^#[0-9a-f]{6}$/)
  })
})

import type { Iperf3ResultSummaryView, MonitoringTask } from './monitoring-models'

export type Iperf3TimelineItem = {
  agentUuid: string
  agentName: string
  resultUuid: string
  timestamp: string
  success: boolean
  uploadMbps: number | null
  downloadMbps: number | null
  mode: string
}

const IPERF3_AGENT_COLORS = [
  '#14b8a6',
  '#f97316',
  '#3b82f6',
  '#eab308',
  '#ec4899',
  '#10b981',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
] as const

function taskAgentKey(task: MonitoringTask): string {
  return task.agent?.agent_uuid ?? task.task_uuid
}

function taskAgentName(task: MonitoringTask): string {
  return task.agent?.name ?? task.name
}

export function colorForIperf3Agent(agentUuid: string): string {
  let hash = 0
  for (let index = 0; index < agentUuid.length; index += 1) {
    hash = (hash * 31 + agentUuid.charCodeAt(index)) >>> 0
  }
  return IPERF3_AGENT_COLORS[hash % IPERF3_AGENT_COLORS.length]
}

export function buildIperf3TimelineItems(
  tasks: MonitoringTask[],
  results: Iperf3ResultSummaryView[],
): Iperf3TimelineItem[] {
  const taskByUuid = new Map(tasks.map((task) => [task.task_uuid, task]))

  return results
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((result) => {
      const task = taskByUuid.get(result.task_uuid)
      const agentUuid = result.agent_uuid ?? (task ? taskAgentKey(task) : result.task_uuid)
      return {
        agentUuid,
        agentName: task ? taskAgentName(task) : result.agent_uuid ?? result.task_uuid,
        resultUuid: result.result_uuid,
        timestamp: result.timestamp,
        success: result.success ?? ['completed', 'success', 'ok'].includes(result.latest_run_status?.toLowerCase?.() ?? ''),
        uploadMbps: result.upload_mbps ?? result.throughput_mbps ?? (typeof result.bits_per_second === 'number' ? result.bits_per_second / 1_000_000 : null),
        downloadMbps: result.download_mbps ?? null,
        mode: result.mode,
      }
    })
}

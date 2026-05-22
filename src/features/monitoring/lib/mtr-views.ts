import type { MonitoringTask, MtrResultSummaryView } from './monitoring-models'

export type MtrAgentRow = {
  agentUuid: string
  agentName: string
  taskUuid: string
  results: MtrResultSummaryView[]
  latest?: MtrResultSummaryView
  reachedCount: number
  failedCount: number
}

export type MtrTimelineItem = {
  agentUuid: string
  agentName: string
  resultUuid: string
  timestamp: string
  reached: boolean
  totalHops: number
}

const MTR_AGENT_COLORS = [
  '#38bdf8',
  '#a78bfa',
  '#f59e0b',
  '#34d399',
  '#f472b6',
  '#22c55e',
  '#fb7185',
  '#60a5fa',
  '#c084fc',
  '#2dd4bf',
] as const

function taskAgentKey(task: MonitoringTask): string {
  return task.agent?.agent_uuid ?? task.task_uuid
}

function taskAgentName(task: MonitoringTask): string {
  return task.agent?.name ?? task.name
}

export function colorForMtrAgent(agentUuid: string): string {
  let hash = 0
  for (let index = 0; index < agentUuid.length; index += 1) {
    hash = (hash * 31 + agentUuid.charCodeAt(index)) >>> 0
  }
  return MTR_AGENT_COLORS[hash % MTR_AGENT_COLORS.length]
}

export function buildMtrAgentRows(tasks: MonitoringTask[], results: MtrResultSummaryView[]): MtrAgentRow[] {
  const resultsByTask = new Map<string, MtrResultSummaryView[]>()
  for (const result of results) {
    const list = resultsByTask.get(result.task_uuid) ?? []
    list.push(result)
    resultsByTask.set(result.task_uuid, list)
  }

  return tasks.map((task) => {
    const taskResults = (resultsByTask.get(task.task_uuid) ?? [])
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return {
      agentUuid: taskAgentKey(task),
      agentName: taskAgentName(task),
      taskUuid: task.task_uuid,
      results: taskResults,
      latest: taskResults[0],
      reachedCount: taskResults.filter((result) => result.target_reached).length,
      failedCount: taskResults.filter((result) => !result.target_reached).length,
    }
  })
}

export function buildMtrTimelineItems(tasks: MonitoringTask[], results: MtrResultSummaryView[]): MtrTimelineItem[] {
  const taskByUuid = new Map(tasks.map((task) => [task.task_uuid, task]))

  return results
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((result) => {
      const task = taskByUuid.get(result.task_uuid)
      return {
        agentUuid: result.agent_uuid ?? task?.agent?.agent_uuid ?? result.task_uuid,
        agentName: task ? taskAgentName(task) : result.agent_uuid ?? result.task_uuid,
        resultUuid: result.result_uuid,
        timestamp: result.timestamp,
        reached: result.target_reached,
        totalHops: result.total_hops,
      }
    })
}

import type { MonitoringTask } from './monitoring-models'

export type AgentFilterOption = {
  agentUuid: string
  agentName: string
}

export function buildAgentFilterOptions(tasks: MonitoringTask[]): AgentFilterOption[] {
  const options = new Map<string, AgentFilterOption>()

  for (const task of tasks) {
    if (!task.agent?.agent_uuid) continue
    if (options.has(task.agent.agent_uuid)) continue
    options.set(task.agent.agent_uuid, {
      agentUuid: task.agent.agent_uuid,
      agentName: task.agent.name || task.agent.agent_uuid,
    })
  }

  return Array.from(options.values()).sort((a, b) => a.agentName.localeCompare(b.agentName))
}

export function filterTasksBySelectedAgents(tasks: MonitoringTask[], selectedAgentUuids: string[]): MonitoringTask[] {
  const selected = new Set(selectedAgentUuids)
  return tasks.filter((task) => task.agent?.agent_uuid && selected.has(task.agent.agent_uuid))
}

export function labelForAgentSelection(
  selectedCount: number,
  totalCount: number,
  labels: {
    noAgent?: string
    noneSelected?: string
    allAgents?: string
  } = {},
): string {
  if (totalCount === 0) return labels.noAgent ?? 'No Agent'
  if (selectedCount === 0) return labels.noneSelected ?? 'No Agent selected'
  if (selectedCount === totalCount) return labels.allAgents ?? 'All Agents'
  return `${selectedCount}/${totalCount} Agent`
}

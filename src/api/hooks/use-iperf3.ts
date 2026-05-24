import { keepPreviousData, useQueries } from '@tanstack/react-query'
import { monitoringKeys } from './keys'
import { buildApiUrl } from '@/api/base-url'
import {
  normalizeIperf3ListItem,
  type Iperf3ResultSummaryView,
  type MonitoringTask,
} from '@/features/monitoring/lib/monitoring-models'

interface TimeRange {
  start: number
  end: number
}

interface Iperf3ListEnvelope {
  data?: {
    task_uuid?: string
    items?: unknown[]
    results?: unknown[]
  }
}

export interface Iperf3ResultListView {
  task_uuid: string
  agent_uuid: string | null
  total: number
  results: Iperf3ResultSummaryView[]
}

interface Iperf3ListsResult {
  taskResults: Iperf3ResultListView[]
  combinedResults: Iperf3ResultSummaryView[]
  total: number
  isLoading: boolean
  error: Error | null
}

export function useIperf3ListsForTasks(tasks: MonitoringTask[], timeRange: TimeRange) {
  const startSec = Math.floor(timeRange.start / 1000)
  const endSec = Math.floor(timeRange.end / 1000)

  return useQueries({
    queries: tasks.map((task) => ({
      queryKey: monitoringKeys.iperf3List({
        task_uuid: task.task_uuid,
        agent_uuid: task.agent?.agent_uuid ?? null,
        start: startSec,
        end: endSec,
      }),
      queryFn: async (): Promise<Iperf3ResultListView> => {
        const startIso = new Date(startSec * 1000).toISOString()
        const endIso = new Date(endSec * 1000).toISOString()
        const params = new URLSearchParams({
          start: startIso,
          end: endIso,
        })
        if (task.agent?.agent_uuid) params.set('agent_uuid', task.agent.agent_uuid)

        const res = await fetch(buildApiUrl(`/api/v1/monitoring/tasks/${task.task_uuid}/iperf3-results?${params.toString()}`))
        if (!res.ok) {
          throw new Error(`Failed to load iperf3 results: ${res.status}`)
        }
        const body = (await res.json()) as Iperf3ListEnvelope
        const data = body.data
        const rawResults = data?.items ?? data?.results ?? []

        return {
          task_uuid: data?.task_uuid ?? task.task_uuid,
          agent_uuid: task.agent?.agent_uuid ?? null,
          total: rawResults.length,
          results: rawResults.map(normalizeIperf3ListItem).filter((result) => result.result_uuid),
        }
      },
      enabled: !!task.task_uuid,
      placeholderData: keepPreviousData,
      staleTime: 30 * 1000,
    })),
    combine: (results): Iperf3ListsResult => {
      const taskResults = results
        .filter((result) => result.data)
        .map((result) => result.data!)
      return {
        taskResults,
        isLoading: results.some((result) => result.isLoading),
        error: results.find((result) => result.error)?.error as Error | null,
        combinedResults: taskResults
          .flatMap((item) => item.results)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        total: taskResults.reduce((sum, item) => sum + item.total, 0),
      }
    },
  })
}

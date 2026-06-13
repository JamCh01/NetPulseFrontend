import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'
import { buildApiUrl } from '@/api/base-url'
import { monitoringKeys } from './keys'
import {
  normalizeRouteTraceResult,
  type MonitoringTask,
  type MtrResultDetailView,
  type RouteTraceResultListView,
} from '@/features/monitoring/lib/monitoring-models'

interface RouteTraceListEnvelope {
  data?: {
    task_uuid?: string
    items?: unknown[]
  }
}

interface TimeRange {
  start: number
  end: number
}

interface RouteTraceListsResult {
  taskResults: RouteTraceResultListView[]
  combinedResults: MtrResultDetailView[]
  total: number
  isLoading: boolean
  error: Error | null
}

export function useRouteTraceResults(taskUuid: string, timeRange: TimeRange) {
  const startSec = Math.floor(timeRange.start / 1000)
  const endSec = Math.floor(timeRange.end / 1000)

  return useQuery({
    queryKey: monitoringKeys.routeTraceList({ task_uuid: taskUuid, start: startSec, end: endSec }),
    queryFn: async (): Promise<RouteTraceResultListView> => {
      const params = new URLSearchParams({
        start: new Date(startSec * 1000).toISOString(),
        end: new Date(endSec * 1000).toISOString(),
      })
      const res = await fetch(buildApiUrl(`/api/v1/monitoring/tasks/${taskUuid}/route-trace-results?${params.toString()}`))
      if (!res.ok) {
        throw new Error(`Failed to load route trace results: ${res.status}`)
      }
      const body = (await res.json()) as RouteTraceListEnvelope
      const data = body.data
      const rawResults = data?.items ?? []
      const results = rawResults
        .map(normalizeRouteTraceResult)
        .filter((result) => result.result_uuid)

      return {
        task_uuid: data?.task_uuid ?? taskUuid,
        total: results.length,
        results,
      }
    },
    enabled: !!taskUuid,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}

export function useRouteTraceListsForTasks(tasks: MonitoringTask[], timeRange: TimeRange) {
  const startSec = Math.floor(timeRange.start / 1000)
  const endSec = Math.floor(timeRange.end / 1000)

  return useQueries({
    queries: tasks.map((task) => ({
      queryKey: monitoringKeys.routeTraceList({
        task_uuid: task.task_uuid,
        start: startSec,
        end: endSec,
      }),
      queryFn: async (): Promise<RouteTraceResultListView> => {
        const params = new URLSearchParams({
          start: new Date(startSec * 1000).toISOString(),
          end: new Date(endSec * 1000).toISOString(),
        })
        const res = await fetch(buildApiUrl(`/api/v1/monitoring/tasks/${task.task_uuid}/route-trace-results?${params.toString()}`))
        if (!res.ok) {
          throw new Error(`Failed to load route trace results: ${res.status}`)
        }
        const body = (await res.json()) as RouteTraceListEnvelope
        const data = body.data
        const rawResults = data?.items ?? []
        const results = rawResults
          .map(normalizeRouteTraceResult)
          .filter((result) => result.result_uuid)

        return {
          task_uuid: data?.task_uuid ?? task.task_uuid,
          total: results.length,
          results,
        }
      },
      enabled: !!task.task_uuid,
      placeholderData: keepPreviousData,
      staleTime: 30 * 1000,
    })),
    combine: (results): RouteTraceListsResult => {
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

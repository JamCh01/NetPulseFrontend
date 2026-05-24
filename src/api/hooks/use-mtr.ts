import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'
import { monitoringKeys } from './keys'
import { buildApiUrl } from '@/api/base-url'
import {
  normalizeMtrDetail,
  normalizeMtrListItem,
  type MonitoringTask,
  type MtrResultDetailView,
  type MtrResultSummaryView,
} from '@/features/monitoring/lib/monitoring-models'

interface TimeRange {
  start: number
  end: number
}

interface MtrListEnvelope {
  data?: {
    task_uuid?: string
    items?: unknown[]
    results?: unknown[]
    pagination?: {
      total?: number
    }
  }
}

interface MtrDetailEnvelope {
  data?: unknown
}

export interface MtrResultListView {
  task_uuid: string
  agent_uuid: string | null
  total: number
  results: MtrResultSummaryView[]
}

interface MtrListsResult {
  taskResults: MtrResultListView[]
  combinedResults: MtrResultSummaryView[]
  total: number
  isLoading: boolean
  error: Error | null
}

export function useMtrList(
  taskUuid: string,
  agentUuid: string | undefined,
  timeRange: TimeRange
) {
  // Convert ms timestamps to seconds for the API
  const startSec = Math.floor(timeRange.start / 1000)
  const endSec = Math.floor(timeRange.end / 1000)

  return useQuery({
    queryKey: monitoringKeys.mtrList({
      task_uuid: taskUuid,
      agent_uuid: agentUuid ?? null,
      start: startSec,
      end: endSec,
    }),
    queryFn: async (): Promise<MtrResultListView> => {
      const params = new URLSearchParams({
        start: String(startSec),
        end: String(endSec),
      })
      if (agentUuid) params.set('agent_uuid', agentUuid)

      const res = await fetch(buildApiUrl(`/api/v1/monitoring/tasks/${taskUuid}/mtr-results?${params.toString()}`))
      if (!res.ok) {
        throw new Error(`Failed to load MTR results: ${res.status}`)
      }
      const body = (await res.json()) as MtrListEnvelope
      const data = body.data
      const rawResults = data?.items ?? data?.results ?? []

      return {
        task_uuid: data?.task_uuid ?? taskUuid,
        agent_uuid: agentUuid ?? null,
        total: data?.pagination?.total ?? rawResults.length,
        results: rawResults.map(normalizeMtrListItem).filter((result) => result.result_uuid),
      }
    },
    enabled: !!taskUuid,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}

export function useMtrDetail(resultUuid: string) {
  return useQuery({
    queryKey: monitoringKeys.mtrDetail(resultUuid),
    queryFn: async (): Promise<MtrResultDetailView> => {
      const res = await fetch(buildApiUrl(`/api/v1/monitoring/mtr-results/${resultUuid}`))
      if (!res.ok) {
        throw new Error(`Failed to load MTR result: ${res.status}`)
      }
      const body = (await res.json()) as MtrDetailEnvelope
      if (!body.data) {
        throw new Error('No data returned')
      }
      return normalizeMtrDetail(body.data)
    },
    enabled: !!resultUuid,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMtrListsForTasks(tasks: MonitoringTask[], timeRange: TimeRange) {
  const startSec = Math.floor(timeRange.start / 1000)
  const endSec = Math.floor(timeRange.end / 1000)

  return useQueries({
    queries: tasks.map((task) => ({
      queryKey: monitoringKeys.mtrList({
        task_uuid: task.task_uuid,
        agent_uuid: task.agent?.agent_uuid ?? null,
        start: startSec,
        end: endSec,
      }),
      queryFn: async (): Promise<MtrResultListView> => {
        const params = new URLSearchParams({
          start: String(startSec),
          end: String(endSec),
          page: '1',
          page_size: '50',
        })
        if (task.agent?.agent_uuid) params.set('agent_uuid', task.agent.agent_uuid)

        const res = await fetch(buildApiUrl(`/api/v1/monitoring/tasks/${task.task_uuid}/mtr-results?${params.toString()}`))
        if (!res.ok) {
          throw new Error(`Failed to load MTR results: ${res.status}`)
        }
        const body = (await res.json()) as MtrListEnvelope
        const data = body.data
        const rawResults = data?.items ?? data?.results ?? []

        return {
          task_uuid: data?.task_uuid ?? task.task_uuid,
          agent_uuid: task.agent?.agent_uuid ?? null,
          total: data?.pagination?.total ?? rawResults.length,
          results: rawResults.map(normalizeMtrListItem).filter((result) => result.result_uuid),
        }
      },
      enabled: !!task.task_uuid,
      placeholderData: keepPreviousData,
      staleTime: 30 * 1000,
    })),
    combine: (results): MtrListsResult => {
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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { taskKeys } from './keys'
import type { TaskCreate, TaskUpdate } from '@/api/generated/types.gen'
import { buildApiUrl } from '@/api/base-url'
import { useAuthStore } from '@/stores/auth-store'

type ApiEnvelope<T> = {
  data?: T
}

type TaskListResponse = {
  items?: unknown[]
}

function normalizeTask(raw: unknown) {
  if (!raw || typeof raw !== 'object') return raw
  const item = raw as Record<string, unknown>
  const probeConfig = (item.probe_config && typeof item.probe_config === 'object')
    ? item.probe_config as Record<string, unknown>
    : {}
  const mtrRetryConfig = (item.mtr_retry_config && typeof item.mtr_retry_config === 'object')
    ? item.mtr_retry_config as Record<string, unknown>
    : {}

  return {
    ...item,
    task_name: item.task_name ?? item.name,
    protocol: item.protocol ?? item.task_type,
    target: typeof item.target === 'string'
      ? item.target
      : (item.target && typeof item.target === 'object' ? (item.target as Record<string, unknown>).target : undefined),
    port: item.port ?? probeConfig.port ?? null,
    max_hops: item.max_hops ?? probeConfig.max_hops ?? null,
    loss_threshold: item.loss_threshold ?? mtrRetryConfig.loss_threshold_pct ?? null,
    cooldown_secs: item.cooldown_secs ?? mtrRetryConfig.cooldown_duration_sec ?? null,
    max_retries: item.max_retries ?? mtrRetryConfig.max_retry_count ?? null,
    is_active: item.is_active ?? item.is_enabled,
  }
}

function getAuthHeaders() {
  const token = useAuthStore.getState().accessToken
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = await response.json() as ApiEnvelope<T> | T
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as ApiEnvelope<T>).data as T
  }
  return body as T
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  const auth = getAuthHeaders()
  if (auth.Authorization) {
    headers.set('Authorization', auth.Authorization)
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
  })
  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status}`) as Error & { status?: number }
    error.status = response.status
    throw error
  }
  return parseApiResponse<T>(response)
}

export function useTasks(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: async () => {
      const query = new URLSearchParams()
      if (typeof params?.is_active === 'boolean') query.set('is_active', String(params.is_active))
      const suffix = query.toString() ? `?${query.toString()}` : ''
      const response = await requestJson<TaskListResponse>(`/api/v1/tasks${suffix}`)
      return {
        ...response,
        items: (response.items ?? []).map(normalizeTask),
      }
    },
  })
}

export function useTask(uuid: string) {
  return useQuery({
    queryKey: taskKeys.detail(uuid),
    queryFn: async () => {
      const response = await requestJson(`/api/v1/tasks/${uuid}`)
      return normalizeTask(response)
    },
    enabled: !!uuid,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: TaskCreate) => {
      const response = await requestJson('/api/v1/tasks', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      return normalizeTask(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ uuid, data: body }: { uuid: string; data: TaskUpdate }) => {
      try {
        return await requestJson(`/api/v1/tasks/${uuid}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      } catch (error) {
        // Compatibility: some deployments expose active toggle via /enable and /disable only.
        const status = (error as { status?: number }).status
        if (status === 404 && typeof body.is_active === 'boolean') {
          const action = body.is_active ? 'enable' : 'disable'
          return requestJson(`/api/v1/tasks/${uuid}/${action}`, { method: 'POST' })
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useDisableTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (uuid: string) => {
      try {
        return await requestJson(`/api/v1/tasks/${uuid}/disable`, { method: 'POST' })
      } catch (error) {
        // Backward compatibility: some older deployments may still use DELETE /tasks/{uuid}.
        const status = (error as { status?: number }).status
        if (status === 404 || status === 405) {
          return requestJson(`/api/v1/tasks/${uuid}`, { method: 'DELETE' })
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

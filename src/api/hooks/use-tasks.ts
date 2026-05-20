import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { taskKeys } from './keys'
import type { TaskCreate, TaskUpdate } from '@/api/generated/types.gen'
import { buildApiUrl } from '@/api/base-url'
import { useAuthStore } from '@/stores/auth-store'

type ApiEnvelope<T> = {
  data?: T
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

export function useTasks(params?: { skip?: number; limit?: number; is_active?: boolean }) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: async () => {
      const query = new URLSearchParams()
      if (typeof params?.skip === 'number') query.set('skip', String(params.skip))
      if (typeof params?.limit === 'number') query.set('limit', String(params.limit))
      if (typeof params?.is_active === 'boolean') query.set('is_active', String(params.is_active))
      const suffix = query.toString() ? `?${query.toString()}` : ''
      return requestJson(`/api/v1/tasks${suffix}`)
    },
  })
}

export function useTask(uuid: string) {
  return useQuery({
    queryKey: taskKeys.detail(uuid),
    queryFn: async () => {
      return requestJson(`/api/v1/tasks/${uuid}`)
    },
    enabled: !!uuid,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: TaskCreate) => {
      return requestJson('/api/v1/tasks', {
        method: 'POST',
        body: JSON.stringify(body),
      })
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

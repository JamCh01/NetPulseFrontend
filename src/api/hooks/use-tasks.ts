import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { taskKeys } from './keys'
import {
  listTasksEndpointApiV1TasksGet,
  getTaskEndpointApiV1TasksTaskUuidGet,
  createTaskEndpointApiV1TasksPost,
  updateTaskEndpointApiV1TasksTaskUuidPatch,
  deleteTaskEndpointApiV1TasksTaskUuidDelete,
} from '@/api/generated/sdk.gen'
import type { TaskCreate, TaskUpdate } from '@/api/generated/types.gen'

export function useTasks(params?: { skip?: number; limit?: number; is_active?: boolean }) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: async () => {
      const { data, error } = await listTasksEndpointApiV1TasksGet({ query: params })
      if (error) throw error
      return data
    },
  })
}

export function useTask(uuid: string) {
  return useQuery({
    queryKey: taskKeys.detail(uuid),
    queryFn: async () => {
      const { data, error } = await getTaskEndpointApiV1TasksTaskUuidGet({ path: { task_uuid: uuid } })
      if (error) throw error
      return data
    },
    enabled: !!uuid,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: TaskCreate) => {
      const { data, error } = await createTaskEndpointApiV1TasksPost({ body })
      if (error) throw error
      return data
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
      const { data, error } = await updateTaskEndpointApiV1TasksTaskUuidPatch({ path: { task_uuid: uuid }, body })
      if (error) throw error
      return data
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
      const { data, error } = await deleteTaskEndpointApiV1TasksTaskUuidDelete({ path: { task_uuid: uuid } })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

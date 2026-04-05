import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { groupKeys } from './keys'
import {
  listGroupsRouteApiV1UsersGroupsGet,
  createGroupRouteApiV1UsersGroupsPost,
  updateGroupRouteApiV1UsersGroupsGroupUuidPatch,
  deleteGroupRouteApiV1UsersGroupsGroupUuidDelete,
} from '@/api/generated/sdk.gen'
import type { GroupCreate, GroupUpdate } from '@/api/generated/types.gen'

export function useGroups(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: groupKeys.list(params),
    queryFn: async () => {
      const { data, error } = await listGroupsRouteApiV1UsersGroupsGet({ query: params })
      if (error) throw error
      return data
    },
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: GroupCreate) => {
      const { data, error } = await createGroupRouteApiV1UsersGroupsPost({ body })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export function useUpdateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ uuid, data: body }: { uuid: string; data: GroupUpdate }) => {
      const { data, error } = await updateGroupRouteApiV1UsersGroupsGroupUuidPatch({ path: { group_uuid: uuid }, body })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data, error } = await deleteGroupRouteApiV1UsersGroupsGroupUuidDelete({ path: { group_uuid: uuid } })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

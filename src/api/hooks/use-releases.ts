import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { releaseKeys } from './keys'
import {
  listReleasesApiV1AgentsReleasesGet,
  uploadReleaseApiV1AgentsReleasesUploadPost,
  deleteReleaseApiV1AgentsReleasesReleaseUuidDelete,
  pushUpdateApiV1AgentsReleasesReleaseUuidPushPost,
} from '@/api/generated/sdk.gen'
import type { BodyUploadReleaseApiV1AgentsReleasesUploadPost } from '@/api/generated/types.gen'

export function useReleases(platform?: string | null) {
  return useQuery({
    queryKey: releaseKeys.list(platform),
    queryFn: async () => {
      const { data, error } = await listReleasesApiV1AgentsReleasesGet({
        query: platform ? { platform } : undefined,
      })
      if (error) throw error
      return data
    },
  })
}

export function useUploadRelease() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: BodyUploadReleaseApiV1AgentsReleasesUploadPost) => {
      const { data, error } = await uploadReleaseApiV1AgentsReleasesUploadPost({
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: releaseKeys.all })
    },
  })
}

export function useDeleteRelease() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (releaseUuid: string) => {
      const { data, error } = await deleteReleaseApiV1AgentsReleasesReleaseUuidDelete({
        path: { release_uuid: releaseUuid },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: releaseKeys.all })
    },
  })
}

export function usePushUpdate() {
  return useMutation({
    mutationFn: async (releaseUuid: string) => {
      const { data, error } = await pushUpdateApiV1AgentsReleasesReleaseUuidPushPost({
        path: { release_uuid: releaseUuid },
      })
      if (error) throw error
      return data
    },
  })
}

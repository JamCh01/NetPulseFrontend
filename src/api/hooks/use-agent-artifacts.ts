import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { artifactKeys } from './keys'
import {
  downloadAgentArtifactApiV1ArtifactsAgentsArtifactUuidDownloadGet,
  getAgentArtifactsApiV1ArtifactsAgentsGet,
  patchAgentArtifactApiV1ArtifactsAgentsArtifactUuidPatch,
  postAgentArtifactApiV1ArtifactsAgentsPost,
  removeAgentArtifactApiV1ArtifactsAgentsArtifactUuidDelete,
} from '@/api/generated/sdk.gen'
import type {
  AgentArtifactListEnvelope,
  AgentArtifactUpdate,
  BodyPostAgentArtifactApiV1ArtifactsAgentsPost,
} from '@/api/generated/types.gen'

export interface AgentArtifactFilters {
  version?: string
  os?: string
  arch?: string
  is_active?: boolean
  include_deleted?: boolean
}

function cleanFilters(filters: AgentArtifactFilters = {}) {
  return {
    version: filters.version?.trim() || undefined,
    os: filters.os?.trim() || undefined,
    arch: filters.arch?.trim() || undefined,
    is_active: filters.is_active,
    include_deleted: filters.include_deleted,
  }
}

export function useAgentArtifacts(filters: AgentArtifactFilters = {}) {
  const query = cleanFilters(filters)
  return useQuery({
    queryKey: artifactKeys.agents(query),
    queryFn: async () => {
      const { data, error } = await getAgentArtifactsApiV1ArtifactsAgentsGet({
        query,
      })
      if (error) throw error
      return data as AgentArtifactListEnvelope
    },
  })
}

export function useUploadAgentArtifact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: BodyPostAgentArtifactApiV1ArtifactsAgentsPost) => {
      const { data, error } = await postAgentArtifactApiV1ArtifactsAgentsPost({ body })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.all })
    },
  })
}

export function useUpdateAgentArtifact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ artifactUuid, body }: { artifactUuid: string; body: AgentArtifactUpdate }) => {
      const { data, error } = await patchAgentArtifactApiV1ArtifactsAgentsArtifactUuidPatch({
        path: { artifact_uuid: artifactUuid },
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.all })
    },
  })
}

export function useDeleteAgentArtifact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (artifactUuid: string) => {
      const { data, error } = await removeAgentArtifactApiV1ArtifactsAgentsArtifactUuidDelete({
        path: { artifact_uuid: artifactUuid },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.all })
    },
  })
}

export function useDownloadAgentArtifact() {
  return useMutation({
    mutationFn: async (artifactUuid: string) => {
      const { data, error } = await downloadAgentArtifactApiV1ArtifactsAgentsArtifactUuidDownloadGet({
        path: { artifact_uuid: artifactUuid },
      })
      if (error) throw error
      return data
    },
  })
}

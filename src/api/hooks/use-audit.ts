import { useQuery } from '@tanstack/react-query'
import { auditKeys } from './keys'
import { listAuditLogsApiV1AuditLogsGet } from '@/api/generated/sdk.gen'

interface AuditLogParams {
  skip?: number
  limit?: number
  actor_uuid?: string | null
  resource_type?: string | null
  action?: string | null
}

export function useAuditLogs(params?: AuditLogParams) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: async () => {
      const { data, error } = await listAuditLogsApiV1AuditLogsGet({ query: params })
      if (error) throw error
      return data
    },
  })
}

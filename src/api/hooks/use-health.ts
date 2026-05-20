import { useQuery } from '@tanstack/react-query'
import { healthKeys } from './keys'
import { healthApiV1HealthGet } from '@/api/generated/sdk.gen'
import { buildApiUrl } from '@/api/base-url'
import { reportMissingApi } from '@/lib/api-compat'

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const obj = error as Record<string, unknown>
  if (obj.status === 404) return true
  const nestedError = obj.error
  if (nestedError && typeof nestedError === 'object') {
    const nested = nestedError as Record<string, unknown>
    if (nested.status === 404) return true
    if (nested.code === 'NOT_FOUND') return true
  }
  return Boolean(
    obj.code === 'NOT_FOUND' ||
    obj.message === 'Not Found',
  )
}

async function fetchRootHealth() {
  const res = await fetch(buildApiUrl('/health'))
  if (!res.ok) {
    throw new Error(`Failed to load health: ${res.status}`)
  }
  const body = await res.json() as { status?: string; data?: { status?: string } }
  const rawStatus = body.status ?? body.data?.status
  const status = rawStatus === 'ok' ? 'ok' : 'error'
  return {
    status,
    components: {
      postgres: status,
      redis: status,
      nats: status,
      victoriametrics: status,
    },
    timestamp: new Date().toISOString(),
    __unsupported: true,
  }
}

export function useHealth() {
  return useQuery({
    queryKey: healthKeys.status(),
    queryFn: async () => {
      const { data, error } = await healthApiV1HealthGet()
      if (error) {
        // Some environments expose only `/health` and not `/api/v1/health`.
        // Always attempt root-health fallback before failing.
        try {
          reportMissingApi('/api/v1/health')
          return await fetchRootHealth()
        } catch {
          if (isNotFoundError(error)) {
            throw error
          }
          throw error
        }
      }
      return data
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: (failureCount, error) => {
      if (isNotFoundError(error)) return false
      return failureCount < 2
    },
  })
}

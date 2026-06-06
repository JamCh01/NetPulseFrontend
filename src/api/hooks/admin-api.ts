import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { buildApiUrl } from '@/api/base-url'
import { useAuthStore } from '@/stores/auth-store'
import { agentKeys, geoKeys, resultKeys, targetKeys, taskKeys } from './keys'

export type IpVersion = '4' | '6' | '4+6'
export type IpFamily = '4' | '6'
export type TargetType = 'ip' | 'domain'
export type TaskType = 'icmp' | 'tcp' | 'mtr' | 'iperf3'
export type QuickAssociateTaskType = Exclude<TaskType, 'iperf3'>
export type TargetProtocol = TaskType
export type AgentStatus = 'online' | 'offline' | 'disabled'
export type SortOrder = 'asc' | 'desc'

export interface Pagination {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface AdminListResponse<T> {
  items: T[]
  pagination?: Pagination
}

export interface AdminTarget {
  target_uuid: string
  name: string
  target: string
  target_type: TargetType
  ip_version: IpVersion
  is_anycast: boolean
  continent?: string | null
  country?: string | null
  city?: string | null
  zip_code?: string | null
  carrier: string
  comment?: string | null
  tags: string[]
  supported_protocols: TargetProtocol[]
  is_enabled: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface AdminAgent {
  agent_uuid: string
  name: string
  ip_version: IpVersion
  continent: string
  country: string
  city: string
  zip_code: string
  carrier: string
  comment?: string | null
  tags: string[]
  is_enabled: boolean
  is_deleted: boolean
  status: AgentStatus
  last_heartbeat_at?: string | null
  last_reported_ip?: string | null
  hostname?: string | null
  version?: string | null
  os?: string | null
  arch?: string | null
  runtime_id?: string | null
  expected_config_version: number
  applied_config_version: number
  scheduler_stats?: Record<string, unknown> | null
  last_snapshot_sent_at?: string | null
  last_snapshot_ack_at?: string | null
  last_snapshot_ack_status?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  auth_token?: string
  nats_username?: string
  nats_password?: string
  install_command_available?: boolean
  install_command?: AgentInstallCommand
  agent_name: string
  agent_version?: string | null
  platform?: string | null
}

export interface AgentInstallCommand {
  agent_uuid: string
  nats_username: string
  service_name: string
  install_path: string
  env_file: string
  contains_secrets: boolean
  command: string
  install_url?: string | null
  script: string
  nats_config_snippet?: string
}

export interface AdminTask {
  task_uuid: string
  name: string
  description?: string | null
  target_uuid: string
  agent_uuid: string
  target?: {
    target_uuid: string
    name: string
    target: string
    target_type: TargetType
    is_anycast: boolean
  } | null
  agent?: {
    agent_uuid: string
    name: string
    status: AgentStatus
    city: string
  } | null
  task_type: TaskType
  ip_family: IpFamily
  interval: number
  timeout: number
  packet_count: number
  probe_config: Record<string, unknown>
  probe_config_hash?: string
  task_revision?: number
  mtr_retry_config?: Record<string, unknown> | null
  schedule_jitter_ms?: number
  is_enabled: boolean
  is_deleted: boolean
  created_by_relation?: boolean
  created_at: string
  updated_at: string
  deleted_at?: string | null
  task_name: string
  protocol: TaskType
  target_label: string
  port?: number | null
  is_active: boolean
}

export interface ResultIngestionEvent {
  event_uuid: string
  message_id?: string | null
  result_uuid?: string | null
  execution_uuid?: string | null
  message_type?: string | null
  agent_uuid?: string | null
  task_uuid?: string | null
  subject?: string | null
  status: string
  reason?: string | null
  error_message?: string | null
  received_at: string
  updated_at: string
}

export interface ResourceTag {
  tag: string
  resource_type: 'agent' | 'target'
  resource_count: number
}

export interface GeoContinent {
  continent_uuid: string
  name: string
  code?: string | null
  name_zh?: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface GeoCountry {
  country_uuid: string
  continent_uuid: string
  name: string
  code?: string | null
  name_zh?: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface GeoCity {
  city_uuid: string
  country_uuid: string
  name: string
  code?: string | null
  name_zh?: string | null
  is_capital: boolean
  popularity: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface GeoTreeCity {
  city_uuid: string
  country_uuid: string
  continent_uuid: string
  name: string
  code?: string | null
  name_zh?: string | null
  is_capital: boolean
  popularity: number
}

export interface GeoTreeCountry {
  country_uuid: string
  continent_uuid: string
  name: string
  code?: string | null
  name_zh?: string | null
  city_count: number
  cities: GeoTreeCity[]
}

export interface GeoTreeContinent {
  continent_uuid: string
  name: string
  code?: string | null
  name_zh?: string | null
  country_count: number
  city_count: number
  countries: GeoTreeCountry[]
}

export interface GeoTreeData {
  total_continent_count: number
  total_country_count: number
  total_city_count: number
  items: GeoTreeContinent[]
}

export interface TargetCreatePayload {
  name: string
  target: string
  ip_version?: IpVersion | null
  is_anycast?: boolean
  continent?: string | null
  country?: string | null
  city?: string | null
  zip_code?: string | null
  carrier: string
  comment?: string | null
  tags?: string[]
  supported_protocols?: TargetProtocol[]
}

export type TargetUpdatePayload = Partial<TargetCreatePayload>

export interface AgentCreatePayload {
  name: string
  ip_version: IpVersion
  continent: string
  country: string
  city: string
  zip_code: string
  carrier: string
  comment?: string | null
  tags?: string[]
}

export type AgentUpdatePayload = Partial<AgentCreatePayload>

export interface TaskCreatePayload {
  name?: string | null
  description?: string | null
  target_uuid: string
  agent_uuid: string
  task_type: TaskType
  ip_family: IpFamily
  interval?: number
  timeout?: number
  packet_count?: number
  probe_config?: Record<string, unknown>
  mtr_retry_config?: Record<string, unknown> | null
  schedule_jitter_ms?: number
}

export type TaskUpdatePayload = Partial<Omit<TaskCreatePayload, 'task_type'>>

export interface ListTargetsParams {
  page?: number
  page_size?: number
  keyword?: string
  target_type?: TargetType | 'all'
  is_anycast?: boolean | null
  is_enabled?: boolean | null
  sort_by?: string
  sort_order?: SortOrder
}

export interface ListAgentsParams {
  page?: number
  page_size?: number
  limit?: number
  skip?: number
  keyword?: string
  status?: AgentStatus | 'all'
  is_enabled?: boolean | null
  sort_by?: string
  sort_order?: SortOrder
}

export interface ListTasksParams {
  keyword?: string
  task_type?: TaskType | 'all'
  ip_family?: IpFamily | 'all'
  agent_uuid?: string
  target_uuid?: string
  is_enabled?: boolean | null
  sort_by?: string
  sort_order?: SortOrder
}

export interface ListResultEventsParams {
  page?: number
  page_size?: number
  message_id?: string
  result_uuid?: string
  execution_uuid?: string
  status?: string
}

export interface ListTagsParams {
  resource_type?: 'agent' | 'target'
  keyword?: string
  limit?: number
}

export interface ListGeoContinentsParams {
  keyword?: string
  include_deleted?: boolean
  limit?: number
  enabled?: boolean
}

export interface ListGeoCountriesParams {
  continent_uuid?: string
  keyword?: string
  include_deleted?: boolean
  limit?: number
}

export interface ListGeoCitiesParams {
  country_uuid?: string
  keyword?: string
  include_deleted?: boolean
  limit?: number
}

export interface GeoContinentPayload {
  name: string
  code?: string | null
  name_zh?: string | null
}

export type GeoContinentUpdatePayload = Partial<GeoContinentPayload & { is_deleted: boolean }>

export interface GeoCountryPayload {
  continent_uuid: string
  name: string
  code?: string | null
  name_zh?: string | null
}

export type GeoCountryUpdatePayload = Partial<GeoCountryPayload & { is_deleted: boolean }>

export interface GeoCityPayload {
  country_uuid: string
  name: string
  code?: string | null
  name_zh?: string | null
  is_capital?: boolean
  popularity?: number
}

export type GeoCityUpdatePayload = Partial<GeoCityPayload & { is_deleted: boolean }>

type ApiEnvelope<T> = {
  data?: T
  detail?: unknown
  message?: string
}

function getAuthHeaders() {
  const token = useAuthStore.getState().accessToken
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function appendParam(query: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null || value === '' || value === 'all') return
  query.set(key, String(value))
}

export function buildQuery(params?: object) {
  const query = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (key === 'enabled') return
    appendParam(query, key, value)
  })
  const text = query.toString()
  return text ? `?${text}` : ''
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T
  const body = (await response.json()) as ApiEnvelope<T> | T
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as ApiEnvelope<T>).data as T
  }
  return body as T
}

export async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const auth = getAuthHeaders()
  if (auth.Authorization) headers.set('Authorization', auth.Authorization)

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = `Request failed: ${response.status}`
    try {
      const body = (await response.json()) as ApiEnvelope<unknown>
      if (typeof body.detail === 'string') message = body.detail
      else if (typeof body.message === 'string') message = body.message
    } catch {
      // keep status message
    }
    const error = new Error(message) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  return parseApiResponse<T>(response)
}

export function normalizeAgent(raw: AdminAgent): AdminAgent {
  const platform = [raw.os, raw.arch].filter(Boolean).join('/')
  return {
    ...raw,
    agent_name: raw.agent_name ?? raw.name,
    agent_version: raw.agent_version ?? raw.version ?? null,
    platform: raw.platform ?? (platform || null),
  }
}

export function normalizeTask(raw: AdminTask): AdminTask {
  const probeConfig = raw.probe_config ?? {}
  const port = typeof probeConfig.port === 'number' ? probeConfig.port : raw.port
  return {
    ...raw,
    task_name: raw.task_name ?? raw.name,
    protocol: raw.protocol ?? raw.task_type,
    target_label: raw.target_label ?? raw.target?.target ?? raw.target_uuid,
    port: port ?? null,
    is_active: raw.is_active ?? raw.is_enabled,
  }
}

export function useTargets(params?: ListTargetsParams) {
  return useQuery({
    queryKey: targetKeys.list(params),
    queryFn: () => adminRequest<AdminListResponse<AdminTarget>>(`/api/v1/targets${buildQuery(params)}`),
  })
}

export function useTarget(uuid: string) {
  return useQuery({
    queryKey: targetKeys.detail(uuid),
    queryFn: () => adminRequest<AdminTarget>(`/api/v1/targets/${uuid}`),
    enabled: !!uuid,
  })
}

export function useCreateTarget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: TargetCreatePayload) => adminRequest<AdminTarget>('/api/v1/targets', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: targetKeys.all })
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useUpdateTarget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: TargetUpdatePayload }) =>
      adminRequest<AdminTarget>(`/api/v1/targets/${uuid}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: targetKeys.all })
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useSetTargetEnabled() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, enabled }: { uuid: string; enabled: boolean }) =>
      adminRequest<AdminTarget>(`/api/v1/targets/${uuid}/${enabled ? 'enable' : 'disable'}`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: targetKeys.all })
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useDeleteTarget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => adminRequest<AdminTarget>(`/api/v1/targets/${uuid}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: targetKeys.all })
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useAgents(params?: ListAgentsParams) {
  const queryParams = params
    ? {
        ...params,
        page: params.page ?? (params.skip && params.limit ? Math.floor(params.skip / params.limit) + 1 : undefined),
        page_size: params.page_size ?? params.limit,
        skip: undefined,
        limit: undefined,
      }
    : undefined
  return useQuery({
    queryKey: agentKeys.list(params),
    queryFn: async () => {
      const response = await adminRequest<AdminListResponse<AdminAgent>>(`/api/v1/agents${buildQuery(queryParams)}`)
      return { ...response, items: response.items.map(normalizeAgent) }
    },
  })
}

export function useAgent(uuid: string) {
  return useQuery({
    queryKey: agentKeys.detail(uuid),
    queryFn: async () => normalizeAgent(await adminRequest<AdminAgent>(`/api/v1/agents/${uuid}`)),
    enabled: !!uuid,
  })
}

export function useCreateAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: AgentCreatePayload) =>
      normalizeAgent(await adminRequest<AdminAgent>('/api/v1/agents', {
        method: 'POST',
        body: JSON.stringify(body),
      })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all })
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useUpdateAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ uuid, data }: { uuid: string; data: AgentUpdatePayload }) =>
      normalizeAgent(await adminRequest<AdminAgent>(`/api/v1/agents/${uuid}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all })
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useSetAgentEnabled() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { uuid: string; enabled: boolean } | string) => {
      const uuid = typeof input === 'string' ? input : input.uuid
      const enabled = typeof input === 'string' ? false : input.enabled
      return normalizeAgent(
        await adminRequest<AdminAgent>(`/api/v1/agents/${uuid}/${enabled ? 'enable' : 'disable'}`, { method: 'POST' }),
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all })
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useDeleteAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (uuid: string) => normalizeAgent(await adminRequest<AdminAgent>(`/api/v1/agents/${uuid}`, { method: 'DELETE' })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all })
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useTasks(params?: ListTasksParams) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: async () => {
      const response = await adminRequest<AdminListResponse<AdminTask>>(`/api/v1/tasks${buildQuery(params)}`)
      return { ...response, items: response.items.map(normalizeTask) }
    },
  })
}

export function useTask(uuid: string) {
  return useQuery({
    queryKey: taskKeys.detail(uuid),
    queryFn: async () => normalizeTask(await adminRequest<AdminTask>(`/api/v1/tasks/${uuid}`)),
    enabled: !!uuid,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: TaskCreatePayload) =>
      normalizeTask(await adminRequest<AdminTask>('/api/v1/tasks', {
        method: 'POST',
        body: JSON.stringify(body),
      })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ uuid, data }: { uuid: string; data: TaskUpdatePayload }) =>
      normalizeTask(await adminRequest<AdminTask>(`/api/v1/tasks/${uuid}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useSetTaskEnabled() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ uuid, enabled }: { uuid: string; enabled: boolean }) =>
      normalizeTask(await adminRequest<AdminTask>(`/api/v1/tasks/${uuid}/${enabled ? 'enable' : 'disable'}`, { method: 'POST' })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (uuid: string) => normalizeTask(await adminRequest<AdminTask>(`/api/v1/tasks/${uuid}`, { method: 'DELETE' })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export interface QuickAssociatePayload {
  target_uuid: string
  agent_uuid: string
  task_types?: QuickAssociateTaskType[]
  ip_families?: IpFamily[]
}

export function useQuickAssociate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: QuickAssociatePayload) =>
      adminRequest<AdminTask[]>('/api/v1/relations/quick-associate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: targetKeys.all })
      queryClient.invalidateQueries({ queryKey: agentKeys.all })
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useResultIngestionEvents(params?: ListResultEventsParams) {
  return useQuery({
    queryKey: resultKeys.ingestionEvents(params),
    queryFn: () => adminRequest<AdminListResponse<ResultIngestionEvent>>(`/api/v1/results/ingestion-events${buildQuery(params)}`),
  })
}

export function useTags(params?: ListTagsParams) {
  return useQuery({
    queryKey: ['tags', 'list', params] as const,
    queryFn: () => adminRequest<AdminListResponse<ResourceTag>>(`/api/v1/tags${buildQuery(params)}`),
  })
}

export function useGeoContinents(params?: ListGeoContinentsParams) {
  return useQuery({
    queryKey: geoKeys.continents(params),
    queryFn: () => adminRequest<AdminListResponse<GeoContinent>>(`/api/v1/geo/continents${buildQuery(params)}`),
    enabled: params?.enabled ?? true,
  })
}

export function useGeoCountries(params?: ListGeoCountriesParams) {
  return useQuery({
    queryKey: geoKeys.countries(params),
    queryFn: () => adminRequest<AdminListResponse<GeoCountry>>(`/api/v1/geo/countries${buildQuery(params)}`),
    enabled: !!params?.continent_uuid,
  })
}

export function useGeoCities(params?: ListGeoCitiesParams) {
  return useQuery({
    queryKey: geoKeys.cities(params),
    queryFn: () => adminRequest<AdminListResponse<GeoCity>>(`/api/v1/geo/cities${buildQuery(params)}`),
    enabled: !!params?.country_uuid,
  })
}

export function useGeoTree(params?: { keyword?: string; include_deleted?: boolean }) {
  return useQuery({
    queryKey: [...geoKeys.all, 'tree', params] as const,
    queryFn: () => adminRequest<GeoTreeData>(`/api/v1/geo/tree${buildQuery(params)}`),
  })
}

export function useCreateGeoContinent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: GeoContinentPayload) => adminRequest<GeoContinent>('/api/v1/geo/continents', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: geoKeys.all }),
  })
}

export function useUpdateGeoContinent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: GeoContinentUpdatePayload }) =>
      adminRequest<GeoContinent>(`/api/v1/geo/continents/${uuid}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: geoKeys.all }),
  })
}

export function useDeleteGeoContinent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => adminRequest<GeoContinent>(`/api/v1/geo/continents/${uuid}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: geoKeys.all }),
  })
}

export function useCreateGeoCountry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: GeoCountryPayload) => adminRequest<GeoCountry>('/api/v1/geo/countries', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: geoKeys.all }),
  })
}

export function useUpdateGeoCountry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: GeoCountryUpdatePayload }) =>
      adminRequest<GeoCountry>(`/api/v1/geo/countries/${uuid}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: geoKeys.all }),
  })
}

export function useDeleteGeoCountry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => adminRequest<GeoCountry>(`/api/v1/geo/countries/${uuid}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: geoKeys.all }),
  })
}

export function useCreateGeoCity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: GeoCityPayload) => adminRequest<GeoCity>('/api/v1/geo/cities', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: geoKeys.all }),
  })
}

export function useUpdateGeoCity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: GeoCityUpdatePayload }) =>
      adminRequest<GeoCity>(`/api/v1/geo/cities/${uuid}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: geoKeys.all }),
  })
}

export function useDeleteGeoCity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => adminRequest<GeoCity>(`/api/v1/geo/cities/${uuid}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: geoKeys.all }),
  })
}

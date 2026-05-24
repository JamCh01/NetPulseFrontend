// Query key factories for TanStack Query cache management

export const authKeys = {
  all: ['auth'] as const,
}

export const userKeys = {
  all: ['users'] as const,
  list: (params?: { skip?: number; limit?: number; role?: string }) =>
    [...userKeys.all, 'list', params] as const,
  detail: (uuid: string) => [...userKeys.all, 'detail', uuid] as const,
}

export const agentKeys = {
  all: ['agents'] as const,
  list: (params?: unknown) =>
    [...agentKeys.all, 'list', params] as const,
  detail: (uuid: string) => [...agentKeys.all, 'detail', uuid] as const,
  tasks: (agentUuid: string) => [...agentKeys.all, 'tasks', agentUuid] as const,
}

export const targetKeys = {
  all: ['targets'] as const,
  list: (params?: unknown) => [...targetKeys.all, 'list', params] as const,
  detail: (uuid: string) => [...targetKeys.all, 'detail', uuid] as const,
}

export const taskKeys = {
  all: ['tasks'] as const,
  list: (params?: unknown) =>
    [...taskKeys.all, 'list', params] as const,
  detail: (uuid: string) => [...taskKeys.all, 'detail', uuid] as const,
  agents: (taskUuid: string) => [...taskKeys.all, 'agents', taskUuid] as const,
}

export const resultKeys = {
  all: ['results'] as const,
  ingestionEvents: (params?: unknown) => [...resultKeys.all, 'ingestion-events', params] as const,
}

export const geoKeys = {
  all: ['geo'] as const,
  continents: (params?: unknown) => [...geoKeys.all, 'continents', params] as const,
  countries: (params?: unknown) => [...geoKeys.all, 'countries', params] as const,
  cities: (params?: unknown) => [...geoKeys.all, 'cities', params] as const,
}

export const monitoringKeys = {
  all: ['monitoring'] as const,
  tasks: (params?: { page?: number; page_size?: number; target_uuid?: string }) =>
    [...monitoringKeys.all, 'tasks', params] as const,
  targetGeoTree: () => [...monitoringKeys.all, 'target-geo-tree'] as const,
  query: (params: {
    task_uuid: string
    agent_uuid?: string
    start: number
    end: number
    granularity: string
    step_sec?: number
  }) => [...monitoringKeys.all, 'query', params] as const,
  mtrList: (params: {
    task_uuid: string
    agent_uuid?: string | null
    start: number
    end: number
  }) => [...monitoringKeys.all, 'mtr', 'list', params] as const,
  mtrDetail: (result_uuid: string) => [...monitoringKeys.all, 'mtr', 'detail', result_uuid] as const,
  iperf3List: (params: {
    task_uuid: string
    agent_uuid?: string | null
    start: number
    end: number
  }) => [...monitoringKeys.all, 'iperf3', 'list', params] as const,
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
}

export const releaseKeys = {
  all: ['releases'] as const,
  list: (platform?: string | null) => [...releaseKeys.all, 'list', platform] as const,
  detail: (uuid: string) => [...releaseKeys.all, 'detail', uuid] as const,
}

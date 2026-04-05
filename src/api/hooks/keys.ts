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
  list: (params?: { skip?: number; limit?: number; tags?: string[] }) =>
    [...agentKeys.all, 'list', params] as const,
  detail: (uuid: string) => [...agentKeys.all, 'detail', uuid] as const,
  tasks: (agentUuid: string) => [...agentKeys.all, 'tasks', agentUuid] as const,
}

export const taskKeys = {
  all: ['tasks'] as const,
  list: (params?: { skip?: number; limit?: number; is_active?: boolean }) =>
    [...taskKeys.all, 'list', params] as const,
  detail: (uuid: string) => [...taskKeys.all, 'detail', uuid] as const,
  agents: (taskUuid: string) => [...taskKeys.all, 'agents', taskUuid] as const,
}

export const monitoringKeys = {
  all: ['monitoring'] as const,
  query: (params: {
    task_uuid: string
    agent_uuid?: string
    start: number
    end: number
    granularity: string
  }) => [...monitoringKeys.all, 'query', params] as const,
  mtrList: (params: {
    task_uuid: string
    agent_uuid?: string | null
    start: number
    end: number
  }) => [...monitoringKeys.all, 'mtr', 'list', params] as const,
  mtrDetail: (result_uuid: string) => [...monitoringKeys.all, 'mtr', 'detail', result_uuid] as const,
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
}

export const alertKeys = {
  all: ['alerts'] as const,
  rules: () => [...alertKeys.all, 'rules'] as const,
  ruleList: (params?: { skip?: number; limit?: number }) =>
    [...alertKeys.all, 'rules', 'list', params] as const,
  ruleDetail: (uuid: string) => [...alertKeys.all, 'rules', 'detail', uuid] as const,
}

export const webhookKeys = {
  all: ['webhooks'] as const,
  list: (params?: { skip?: number; limit?: number }) =>
    [...webhookKeys.all, 'list', params] as const,
  detail: (uuid: string) => [...webhookKeys.all, 'detail', uuid] as const,
}

export const healthKeys = {
  all: ['health'] as const,
  status: () => [...healthKeys.all, 'status'] as const,
}

export const auditKeys = {
  all: ['audit'] as const,
  list: (params?: { skip?: number; limit?: number; actor_uuid?: string | null; resource_type?: string | null; action?: string | null }) =>
    [...auditKeys.all, 'list', params] as const,
}

export const alertEventKeys = {
  all: ['alertEvents'] as const,
  list: (params?: { skip?: number; limit?: number; rule_uuid?: string | null; task_uuid?: string | null; status?: string | null }) =>
    [...alertEventKeys.all, 'list', params] as const,
  detail: (uuid: string) => [...alertEventKeys.all, 'detail', uuid] as const,
}

export const groupKeys = {
  all: ['groups'] as const,
  list: (params?: { skip?: number; limit?: number }) =>
    [...groupKeys.all, 'list', params] as const,
  detail: (uuid: string) => [...groupKeys.all, 'detail', uuid] as const,
}

export const releaseKeys = {
  all: ['releases'] as const,
  list: (platform?: string | null) => [...releaseKeys.all, 'list', platform] as const,
  detail: (uuid: string) => [...releaseKeys.all, 'detail', uuid] as const,
}

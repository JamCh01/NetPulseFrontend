import type {
  UserResponse,
  AgentResponse,
  TaskResponse,
  MonitoringDataPoint,
  AlertRuleResponse,
  AlertEventResponse,
  WebhookResponse,
  GroupResponse,
  ReleaseResponse,
  TokenResponse,
} from '@/api/generated/types.gen'
import type { DashboardStats } from '@/api/types'

export type { DashboardStats }

let counter = 0
function uuid() {
  counter++
  return `00000000-0000-0000-0000-${String(counter).padStart(12, '0')}`
}

export function paginate<T>(items: T[], skip = 0, limit = 50) {
  return { items, total: items.length, skip, limit }
}

export function createMockUser(overrides?: Partial<UserResponse>): UserResponse {
  return {
    user_uuid: uuid(),
    username: `user_${counter}`,
    email: `user${counter}@example.com`,
    role: 'subscriber',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockAgent(overrides?: Partial<AgentResponse>): AgentResponse {
  return {
    agent_uuid: uuid(),
    agent_name: `agent-${counter}`,
    tags: ['continent:eu', 'country:german', 'city:FRA', 'isp:SnapStack'],
    status: 'online',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockTask(overrides?: Partial<TaskResponse>): TaskResponse {
  return {
    task_uuid: uuid(),
    task_name: `task-${counter}`,
    protocol: 'icmp',
    target: '8.8.8.8',
    port: null,
    interval: 60,
    packet_count: 20,
    timeout: 5,
    max_hops: null,
    loss_threshold: null,
    cooldown_secs: null,
    max_retries: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockMonitoringDataPoint(
  overrides?: Partial<MonitoringDataPoint>,
): MonitoringDataPoint {
  return {
    timestamp: Date.now() / 1000,
    avg_rtt: 5.3,
    max_rtt: 15.6,
    min_rtt: 1.2,
    median_rtt: 4.8,
    p95_rtt: 12.1,
    p99_rtt: 14.9,
    packet_loss_pct: 0.0,
    ...overrides,
  }
}

export function createMockAlertRule(overrides?: Partial<AlertRuleResponse>): AlertRuleResponse {
  return {
    rule_uuid: uuid(),
    rule_name: `alert-rule-${counter}`,
    task_uuid: uuid(),
    user_uuid: uuid(),
    metric_type: 'latency',
    threshold: 100.0,
    operator: 'gt',
    m_count: 3,
    n_count: 5,
    is_active: true,
    is_deleted: false,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockWebhook(overrides?: Partial<WebhookResponse>): WebhookResponse {
  return {
    webhook_uuid: uuid(),
    user_uuid: uuid(),
    name: `webhook-${counter}`,
    url: 'https://hooks.example.com/test',
    is_active: true,
    is_deleted: false,
    consecutive_failures: 0,
    body_template: null,
    custom_headers: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockDashboardStats(
  overrides?: Partial<DashboardStats>,
): DashboardStats {
  return {
    agents: { online: 10, offline: 3, disabled: 1, total: 14 },
    tasks: { active: 25, inactive: 5, total: 30 },
    ...overrides,
  }
}

export function createMockTokenResponse(overrides?: Partial<TokenResponse>): TokenResponse {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    token_type: 'bearer',
    ...overrides,
  }
}

export function createMockAlertEvent(overrides?: Partial<AlertEventResponse>): AlertEventResponse {
  return {
    event_uuid: uuid(),
    rule_uuid: uuid(),
    agent_uuid: uuid(),
    task_uuid: uuid(),
    triggered_value: 150.3,
    status: 'firing',
    triggered_at: '2026-01-01T12:00:00Z',
    resolved_at: null,
    ...overrides,
  }
}

export function createMockGroup(overrides?: Partial<GroupResponse>): GroupResponse {
  return {
    group_uuid: uuid(),
    group_name: `group-${counter}`,
    description: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export interface MockAuditLog {
  log_uuid: string
  actor_uuid: string | null
  actor_role: string
  action: string
  resource_type: string
  resource_uuid: string | null
  details: Record<string, unknown>
  ip_address: string
  created_at: string
}

export function createMockAuditLog(overrides?: Partial<MockAuditLog>): MockAuditLog {
  return {
    log_uuid: uuid(),
    actor_uuid: uuid(),
    actor_role: 'admin',
    action: 'agent.create',
    resource_type: 'agent',
    resource_uuid: uuid(),
    details: { agent_name: 'test-agent' },
    ip_address: '127.0.0.1',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockRelease(overrides?: Partial<ReleaseResponse>): ReleaseResponse {
  return {
    release_uuid: uuid(),
    version: '1.0.0',
    platform: 'x86_64-linux-musl',
    filename: `netpulse-agent-x86_64-linux-musl-v1.0.0`,
    file_size: 10485760,
    sha256: 'abc123def456',
    release_notes: null,
    is_latest: true,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

import type {
  AgentArtifactResponse,
} from '@/api/generated/types.gen'
import type { AdminAgent, AdminTarget, AdminTask } from '@/api/hooks/admin-api'
import type { MonitoringDataPoint } from '@/features/monitoring/lib/monitoring-data-point'
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

export interface MockUserResponse {
  user_uuid: string
  username: string
  email: string
  role: 'admin' | 'subscriber'
  is_active: boolean
  created_at: string
}

export function createMockUser(overrides?: Partial<MockUserResponse>): MockUserResponse {
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

export function createMockAgent(overrides?: Partial<AdminAgent>): AdminAgent {
  return {
    agent_uuid: uuid(),
    name: `agent-${counter}`,
    agent_name: `agent-${counter}`,
    ip_version: '4',
    continent: 'Europe',
    country: 'Germany',
    city: 'Frankfurt',
    zip_code: '',
    carrier: 'SnapStack',
    comment: null,
    tags: ['continent:eu', 'country:german', 'city:FRA', 'isp:SnapStack'],
    is_enabled: true,
    is_deleted: false,
    status: 'online',
    last_heartbeat_at: null,
    last_reported_ip: null,
    hostname: null,
    version: null,
    os: 'linux',
    arch: 'x86_64',
    runtime_id: null,
    expected_config_version: 1,
    applied_config_version: 1,
    scheduler_stats: null,
    last_snapshot_sent_at: null,
    last_snapshot_ack_at: null,
    last_snapshot_ack_status: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
    agent_version: null,
    platform: 'linux/x86_64',
    ...overrides,
  }
}

export function createMockTarget(overrides?: Partial<AdminTarget>): AdminTarget {
  return {
    target_uuid: uuid(),
    name: `target-${counter}`,
    target: 'example.com',
    target_type: 'domain',
    ip_version: '4',
    is_anycast: false,
    continent: 'Asia',
    country: 'Japan',
    city: 'Tokyo',
    zip_code: '',
    carrier: 'Example IDC',
    comment: null,
    tags: ['continent:asia', 'country:japan', 'city:tokyo'],
    supported_protocols: ['icmp', 'tcp', 'mtr', 'iperf3'],
    is_enabled: true,
    is_deleted: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
    ...overrides,
  }
}


export function createMockTask(overrides?: Partial<AdminTask>): AdminTask {
  return {
    task_uuid: uuid(),
    name: `task-${counter}`,
    task_name: `task-${counter}`,
    description: null,
    target_uuid: uuid(),
    agent_uuid: uuid(),
    agent: null,
    task_type: 'icmp',
    protocol: 'icmp',
    ip_family: '4',
    target: null,
    target_label: '8.8.8.8',
    port: null,
    interval: 60,
    packet_count: 20,
    timeout: 5,
    probe_config: {},
    probe_config_hash: '',
    task_revision: 1,
    mtr_retry_config: null,
    schedule_jitter_ms: 0,
    is_enabled: true,
    is_deleted: false,
    created_by_relation: false,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
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

export interface MockAlertRuleResponse {
  rule_uuid: string
  rule_name: string
  task_uuid: string
  user_uuid: string
  metric_type: string
  threshold: number
  operator: string
  m_count: number
  n_count: number
  is_active: boolean
  is_deleted: boolean
  created_at: string
}

export function createMockAlertRule(overrides?: Partial<MockAlertRuleResponse>): MockAlertRuleResponse {
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

export interface MockWebhookResponse {
  webhook_uuid: string
  user_uuid: string
  name: string
  url: string
  is_active: boolean
  is_deleted: boolean
  consecutive_failures: number
  body_template: string | null
  custom_headers: Record<string, string> | null
  created_at: string
}

export function createMockWebhook(overrides?: Partial<MockWebhookResponse>): MockWebhookResponse {
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

export interface MockTokenResponse {
  access_token: string
  token_type: 'bearer'
  expires_at: string
  admin: { username: string }
}

export function createMockTokenResponse(overrides?: Partial<MockTokenResponse>): MockTokenResponse {
  return {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_at: '2026-01-01T01:00:00Z',
    admin: { username: 'admin' },
    ...overrides,
  }
}

export interface MockAlertEventResponse {
  event_uuid: string
  rule_uuid: string
  agent_uuid: string
  task_uuid: string
  triggered_value: number
  status: string
  triggered_at: string
  resolved_at: string | null
}

export function createMockAlertEvent(overrides?: Partial<MockAlertEventResponse>): MockAlertEventResponse {
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

export interface MockGroupResponse {
  group_uuid: string
  group_name: string
  description: string | null
  created_at: string
}

export function createMockGroup(overrides?: Partial<MockGroupResponse>): MockGroupResponse {
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

export function createMockAgentArtifact(overrides?: Partial<AgentArtifactResponse>): AgentArtifactResponse {
  return {
    artifact_uuid: uuid(),
    artifact_type: 'agent_binary',
    version: '1.0.0',
    os: 'linux',
    arch: 'x86_64',
    filename: 'netpulse-agent-linux-x86_64',
    content_type: 'application/octet-stream',
    size_bytes: 10485760,
    sha256: 'abc123def456',
    storage_provider: 'local_filesystem',
    storage_bucket: '/opt/netpulse-runtime/artifacts',
    storage_key: 'agent-binaries/linux/x86_64/netpulse-agent',
    is_active: true,
    is_deleted: false,
    comment: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
    ...overrides,
  }
}

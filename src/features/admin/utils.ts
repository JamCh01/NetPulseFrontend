import type { AdminAgent, AdminTarget, IpFamily, TaskCreatePayload, TaskType, TargetProtocol } from '@/api/hooks/admin-api'

const TARGET_PROTOCOLS: TargetProtocol[] = ['icmp', 'tcp', 'mtr', 'iperf3']

export function csvToList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function joinLocation(item: Pick<AdminAgent | AdminTarget, 'continent' | 'country' | 'city'>) {
  return [item.continent, item.country, item.city].filter(Boolean).join(' / ') || '-'
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function protocolOptionsForTarget(target?: AdminTarget | null): TaskType[] {
  const supported = target?.supported_protocols?.length ? target.supported_protocols : TARGET_PROTOCOLS
  return supported.filter((protocol): protocol is TargetProtocol =>
    TARGET_PROTOCOLS.includes(protocol as TargetProtocol),
  )
}

export function buildTaskPayload(input: {
  name: string
  target_uuid?: string | null
  route_trace_target_uuid?: string | null
  agent_uuid: string
  task_type: TaskType
  ip_family: IpFamily
  interval: number
  timeout: number
  packet_count: number
  port?: number
  payloadSize?: number
  connectIntervalMs?: number
  ttl?: number
  dontFragment?: boolean
  mtrProbeProtocol?: 'icmp_echo' | 'tcp' | 'udp'
  mtrMaxHops?: number
  mtrRetryEnabled?: boolean
  mtrLossThresholdPct?: number
  mtrCooldownDurationSec?: number
  mtrMaxRetryCount?: number
  iperf3Mode?: 'single_thread' | 'multi_thread'
  iperf3Duration?: number
  iperf3ExecutionTime?: string
}): TaskCreatePayload {
  const base: TaskCreatePayload = {
    name: input.name || null,
    target_uuid: input.task_type === 'route_trace' ? null : input.target_uuid ?? null,
    route_trace_target_uuid: input.task_type === 'route_trace' ? input.route_trace_target_uuid ?? null : null,
    agent_uuid: input.agent_uuid,
    task_type: input.task_type,
    ip_family: input.ip_family,
    interval: input.interval,
    timeout: input.timeout,
    packet_count: input.packet_count,
    probe_config: {},
  }

  if (input.task_type === 'route_trace') {
    base.probe_config = {
      probe_protocol: 'icmp_echo',
      payload_size: input.payloadSize ?? 64,
      max_hops: input.mtrMaxHops ?? 30,
    }
  } else if (input.task_type === 'tcp') {
    base.probe_config = {
      port: input.port ?? 22,
      payload_size: input.payloadSize ?? 64,
      connect_interval_ms: input.connectIntervalMs ?? 1000,
    }
  } else if (input.task_type === 'mtr') {
    const probeProtocol = input.mtrProbeProtocol ?? 'icmp_echo'
    base.probe_config = {
      probe_protocol: probeProtocol,
      max_hops: input.mtrMaxHops ?? 30,
      payload_size: input.payloadSize ?? 64,
    }
    if ((probeProtocol === 'tcp' || probeProtocol === 'udp') && input.port) {
      base.probe_config.port = input.port
    }
    base.mtr_retry_config = {
      enabled: input.mtrRetryEnabled ?? true,
      loss_threshold_pct: input.mtrLossThresholdPct ?? 10,
      cooldown_duration_sec: input.mtrCooldownDurationSec ?? 300,
      max_retry_count: input.mtrMaxRetryCount ?? 3,
    }
  } else if (input.task_type === 'iperf3') {
    const mode = input.iperf3Mode ?? 'single_thread'
    base.interval = 86400
    base.timeout = Math.max(input.timeout, (input.iperf3Duration ?? 10) * 1000 + 5000)
    base.packet_count = 1
    base.probe_config = {
      mode,
      port: input.port ?? 5201,
      duration_sec: input.iperf3Duration ?? 10,
      parallel: mode === 'multi_thread' ? 8 : 1,
      execution_time: input.iperf3ExecutionTime ?? '00:00',
    }
  } else {
    base.probe_config = {
      payload_size: input.payloadSize ?? 64,
      ttl: input.ttl ?? null,
      dont_fragment: input.dontFragment ?? false,
    }
  }

  return base
}

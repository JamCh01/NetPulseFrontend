import type { AdminAgent, AdminTarget, IpFamily, TaskCreatePayload, TaskType } from '@/api/hooks/admin-api'

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
  return target?.supported_protocols?.length ? target.supported_protocols : ['icmp', 'tcp', 'mtr']
}

export function buildTaskPayload(input: {
  name: string
  target_uuid: string
  agent_uuid: string
  task_type: TaskType
  ip_family: IpFamily
  interval: number
  timeout: number
  packet_count: number
  port?: number
  iperf3Mode?: 'single_thread' | 'multi_thread'
  iperf3Duration?: number
}): TaskCreatePayload {
  const base: TaskCreatePayload = {
    name: input.name || null,
    target_uuid: input.target_uuid,
    agent_uuid: input.agent_uuid,
    task_type: input.task_type,
    ip_family: input.ip_family,
    interval: input.interval,
    timeout: input.timeout,
    packet_count: input.packet_count,
    probe_config: {},
  }

  if (input.task_type === 'tcp') {
    base.probe_config = { port: input.port ?? 443 }
  } else if (input.task_type === 'mtr') {
    base.probe_config = {
      probe_protocol: 'icmp_echo',
      max_hops: 30,
      payload_size: 64,
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
    }
  } else {
    base.probe_config = {
      payload_size: 64,
    }
  }

  return base
}

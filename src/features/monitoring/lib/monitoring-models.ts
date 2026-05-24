export type MonitoringProtocol = 'icmp' | 'tcp' | 'mtr' | string

export type LatestResultState = 'ok' | 'missing' | 'failed' | 'unknown'

export interface MonitoringTarget {
  target_uuid: string
  name: string
  target: string
  target_type?: string | null
  ip_version?: string | null
  is_anycast: boolean
  continent?: string | null
  country?: string | null
  region?: string | null
  city?: string | null
  carrier?: string | null
}

export interface MonitoringAgent {
  agent_uuid: string
  name: string
  ip_version?: string | null
  continent?: string | null
  country?: string | null
  region?: string | null
  city?: string | null
  carrier?: string | null
  status?: string | null
  last_heartbeat_at?: string | null
}

export interface MonitoringLatestResult {
  exists: boolean
  source?: string | null
  window_sec?: number | null
  latest_sample_at?: string | null
  latest_run_status?: string | null
  trigger_type?: string | null
  retry_seq?: number | null
  resolved_ip?: string | null
  final_hop_hostname?: string | null
  final_hop_asn?: string | null
  hop_count?: number | null
}

export interface MonitoringTask {
  task_uuid: string
  name: string
  description?: string | null
  task_type: MonitoringProtocol
  interval_sec: number
  timeout_ms?: number | null
  packet_count?: number | null
  is_enabled: boolean
  probe_config?: Record<string, unknown> | null
  target: MonitoringTarget
  agent: MonitoringAgent | null
  latest_result: MonitoringLatestResult
  created_at?: string | null
  updated_at?: string | null
}

export interface MonitoringTargetGroup {
  target: MonitoringTarget
  tasks: MonitoringTask[]
  agents: MonitoringAgent[]
  protocols: MonitoringProtocol[]
  latest_sample_at: string | null
  has_missing_data: boolean
  has_failed_result: boolean
  status: LatestResultState
}

export interface MtrResultSummaryView {
  result_uuid: string
  task_uuid: string
  agent_uuid?: string | null
  timestamp: string
  target_reached: boolean
  total_hops: number
  latest_run_status?: string | null
  resolved_ip?: string | null
  duration_ms?: number | null
}

export interface Iperf3ResultSummaryView {
  result_uuid: string
  execution_uuid: string
  task_uuid: string
  agent_uuid?: string | null
  timestamp: string
  latest_sample_at: string
  started_at?: string | null
  finished_at?: string | null
  duration_ms?: number | null
  resolved_ip?: string | null
  latest_run_status: string
  mode: string
  parallel: number
  port: number
  duration_sec: number
  upload_bits_per_second?: number | null
  upload_mbps?: number | null
  upload_bytes?: number | null
  upload_retransmits?: number | null
  download_bits_per_second?: number | null
  download_mbps?: number | null
  download_bytes?: number | null
  download_retransmits?: number | null
  upload_intervals: Iperf3IntervalView[]
  download_intervals: Iperf3IntervalView[]
  upload_end: Record<string, unknown>
  download_end: Record<string, unknown>
  bits_per_second?: number | null
  throughput_mbps?: number | null
  bytes?: number | null
  retransmits?: number | null
  success: boolean
}

export interface Iperf3IntervalView {
  start?: number | null
  end?: number | null
  seconds?: number | null
  bytes?: number | null
  bits_per_second?: number | null
  mbps?: number | null
  retransmits?: number | null
  snd_cwnd?: number | null
  snd_wnd?: number | null
  rtt?: number | null
  rttvar?: number | null
  sender?: boolean | null
}

export interface MtrHopAddressView {
  hop: number
  ip: string
  hostname?: string | null
  asn?: string | null
  packet_loss_pct: number
  avg_ms: number
  best_ms: number
  worst_ms: number
}

export interface MtrResultDetailView {
  result_uuid: string
  task_uuid: string
  agent_uuid?: string | null
  timestamp: string
  target_reached: boolean
  total_hops: number
  resolved_ip?: string | null
  duration_ms?: number | null
  as_path: string[]
  hops: MtrHopAddressView[]
}

type RawRecord = Record<string, unknown>

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function readNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function readBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

export function normalizeMonitoringTask(raw: unknown): MonitoringTask {
  const item = isRecord(raw) ? raw : {}
  const rawTarget = isRecord(item.target) ? item.target : {}
  const rawAgent = isRecord(item.agent) ? item.agent : null
  const latest = isRecord(item.latest_result) ? item.latest_result : {}

  const targetUuid = readString(rawTarget.target_uuid, readString(item.target_uuid, 'unknown-target'))
  const targetValue = readString(rawTarget.target, readString(rawTarget.name, '-'))
  const targetName = readString(rawTarget.name, targetValue)
  const agentUuid = rawAgent ? readString(rawAgent.agent_uuid, '') : ''

  return {
    task_uuid: readString(item.task_uuid),
    name: readString(item.name, readString(item.task_uuid, 'Unnamed task')),
    description: readNullableString(item.description),
    task_type: readString(item.task_type, 'icmp').toLowerCase(),
    interval_sec: readNumber(item.interval_sec, readNumber(item.interval, 60)),
    timeout_ms: typeof item.timeout_ms === 'number' ? item.timeout_ms : null,
    packet_count: typeof item.packet_count === 'number' ? item.packet_count : null,
    is_enabled: readBoolean(item.is_enabled, true),
    probe_config: isRecord(item.probe_config) ? item.probe_config : null,
    target: {
      target_uuid: targetUuid,
      name: targetName,
      target: targetValue,
      target_type: readNullableString(rawTarget.target_type),
      ip_version: readNullableString(rawTarget.ip_version),
      is_anycast: readBoolean(rawTarget.is_anycast),
      continent: readNullableString(rawTarget.continent),
      country: readNullableString(rawTarget.country),
      region: readNullableString(rawTarget.region),
      city: readNullableString(rawTarget.city),
      carrier: readNullableString(rawTarget.carrier),
    },
    agent: rawAgent && agentUuid
      ? {
          agent_uuid: agentUuid,
          name: readString(rawAgent.name, agentUuid),
          ip_version: readNullableString(rawAgent.ip_version),
          continent: readNullableString(rawAgent.continent),
          country: readNullableString(rawAgent.country),
          region: readNullableString(rawAgent.region),
          city: readNullableString(rawAgent.city),
          carrier: readNullableString(rawAgent.carrier),
          status: readNullableString(rawAgent.status),
          last_heartbeat_at: readNullableString(rawAgent.last_heartbeat_at),
        }
      : null,
    latest_result: {
      exists: readBoolean(latest.exists),
      source: readNullableString(latest.source),
      window_sec: typeof latest.window_sec === 'number' ? latest.window_sec : null,
      latest_sample_at: readNullableString(latest.latest_sample_at),
      latest_run_status: readNullableString(latest.latest_run_status),
      trigger_type: readNullableString(latest.trigger_type),
      retry_seq: typeof latest.retry_seq === 'number' ? latest.retry_seq : null,
      resolved_ip: readNullableString(latest.resolved_ip),
      final_hop_hostname: readNullableString(latest.final_hop_hostname),
      final_hop_asn: readNullableString(latest.final_hop_asn),
      hop_count: typeof latest.hop_count === 'number' ? latest.hop_count : null,
    },
    created_at: readNullableString(item.created_at),
    updated_at: readNullableString(item.updated_at),
  }
}

export function classifyTaskStatus(task: MonitoringTask): LatestResultState {
  if (!task.latest_result.exists) return 'missing'
  const runStatus = task.latest_result.latest_run_status?.toLowerCase()
  if (!runStatus) return 'unknown'
  if (['completed', 'success', 'ok'].includes(runStatus)) return 'ok'
  if (['failed', 'timeout', 'error'].includes(runStatus)) return 'failed'
  return 'unknown'
}

export function classifyGroupStatus(group: Pick<MonitoringTargetGroup, 'has_missing_data' | 'has_failed_result'>): LatestResultState {
  if (group.has_failed_result) return 'failed'
  if (group.has_missing_data) return 'missing'
  return 'ok'
}

export function groupMonitoringTasksByTarget(tasks: MonitoringTask[]): MonitoringTargetGroup[] {
  const groups = new Map<string, MonitoringTargetGroup>()

  for (const task of tasks) {
    const key = task.target.target_uuid
    const existing = groups.get(key)
    const group = existing ?? {
      target: task.target,
      tasks: [],
      agents: [],
      protocols: [],
      latest_sample_at: null,
      has_missing_data: false,
      has_failed_result: false,
      status: 'unknown' as LatestResultState,
    }

    group.tasks.push(task)

    if (task.agent && !group.agents.some((agent) => agent.agent_uuid === task.agent?.agent_uuid)) {
      group.agents.push(task.agent)
    }

    if (!group.protocols.includes(task.task_type)) {
      group.protocols.push(task.task_type)
    }

    const taskStatus = classifyTaskStatus(task)
    group.has_missing_data = group.has_missing_data || taskStatus === 'missing'
    group.has_failed_result = group.has_failed_result || taskStatus === 'failed'

    const sampleAt = task.latest_result.latest_sample_at
    if (sampleAt && (!group.latest_sample_at || new Date(sampleAt).getTime() > new Date(group.latest_sample_at).getTime())) {
      group.latest_sample_at = sampleAt
    }

    group.status = classifyGroupStatus(group)
    groups.set(key, group)
  }

  return Array.from(groups.values()).sort((a, b) => {
    const statusWeight: Record<LatestResultState, number> = { failed: 0, missing: 1, unknown: 2, ok: 3 }
    const byStatus = statusWeight[a.status] - statusWeight[b.status]
    if (byStatus !== 0) return byStatus
    return a.target.name.localeCompare(b.target.name)
  })
}

export function formatTargetLocation(target: MonitoringTarget): string {
  return [target.city, target.region, target.country, target.continent].filter(Boolean).join(', ') || '位置未知'
}

export function formatAgentLocation(agent: MonitoringAgent | null | undefined): string {
  if (!agent) return 'Agent 未绑定'
  return [agent.city, agent.country, agent.continent].filter(Boolean).join(', ') || '位置未知'
}

export function formatLatestSample(timestamp?: string | null): string {
  if (!timestamp) return '暂无样本'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function protocolLabel(protocol: MonitoringProtocol): string {
  return protocol.toUpperCase()
}

export function normalizeMtrListItem(raw: unknown): MtrResultSummaryView {
  const item = isRecord(raw) ? raw : {}
  const status = readString(item.latest_run_status, readString(item.run_status, '')).toLowerCase()
  const timestamp = readString(item.latest_sample_at, readString(item.timestamp, readString(item.finished_at, '')))
  return {
    result_uuid: readString(item.result_uuid),
    task_uuid: readString(item.task_uuid),
    agent_uuid: readNullableString(item.agent_uuid),
    timestamp,
    target_reached: ['completed', 'success', 'ok'].includes(status),
    total_hops: readNumber(item.hop_count, readNumber(item.total_hops, 0)),
    latest_run_status: readNullableString(item.latest_run_status),
    resolved_ip: readNullableString(item.resolved_ip),
    duration_ms: typeof item.duration_ms === 'number' ? item.duration_ms : null,
  }
}

export function normalizeIperf3ListItem(raw: unknown): Iperf3ResultSummaryView {
  const item = isRecord(raw) ? raw : {}
  const status = readString(item.latest_run_status, readString(item.run_status, '')).toLowerCase()
  const latestSampleAt = readString(item.latest_sample_at, readString(item.timestamp, readString(item.finished_at, readString(item.started_at, ''))))
  const uploadBitsPerSecond = readFiniteNumber(item.upload_bits_per_second, readFiniteNumber(item.bits_per_second))
  const downloadBitsPerSecond = readFiniteNumber(item.download_bits_per_second)
  const bitsPerSecond = readFiniteNumber(item.bits_per_second, uploadBitsPerSecond)
  const uploadBytes = readFiniteNumber(item.upload_bytes, readFiniteNumber(item.bytes))
  const downloadBytes = readFiniteNumber(item.download_bytes)
  const uploadRetransmits = readFiniteNumber(item.upload_retransmits, readFiniteNumber(item.retransmits))
  const downloadRetransmits = readFiniteNumber(item.download_retransmits)

  return {
    result_uuid: readString(item.result_uuid),
    execution_uuid: readString(item.execution_uuid),
    task_uuid: readString(item.task_uuid),
    agent_uuid: readNullableString(item.agent_uuid),
    timestamp: latestSampleAt,
    latest_sample_at: latestSampleAt,
    started_at: readNullableString(item.started_at),
    finished_at: readNullableString(item.finished_at),
    duration_ms: typeof item.duration_ms === 'number' ? item.duration_ms : null,
    resolved_ip: readNullableString(item.resolved_ip),
    latest_run_status: readString(item.latest_run_status, readString(item.run_status, 'unknown')),
    mode: readString(item.mode, 'single_thread'),
    parallel: readNumber(item.parallel, 1),
    port: readNumber(item.port, 5201),
    duration_sec: readNumber(item.duration_sec),
    upload_bits_per_second: uploadBitsPerSecond,
    upload_mbps: uploadBitsPerSecond === null ? null : uploadBitsPerSecond / 1_000_000,
    upload_bytes: uploadBytes,
    upload_retransmits: uploadRetransmits,
    download_bits_per_second: downloadBitsPerSecond,
    download_mbps: downloadBitsPerSecond === null ? null : downloadBitsPerSecond / 1_000_000,
    download_bytes: downloadBytes,
    download_retransmits: downloadRetransmits,
    upload_intervals: normalizeIperf3Intervals(item.upload_intervals),
    download_intervals: normalizeIperf3Intervals(item.download_intervals),
    upload_end: isRecord(item.upload_end) ? item.upload_end : {},
    download_end: isRecord(item.download_end) ? item.download_end : {},
    bits_per_second: bitsPerSecond,
    throughput_mbps: bitsPerSecond === null ? null : bitsPerSecond / 1_000_000,
    bytes: readFiniteNumber(item.bytes, uploadBytes),
    retransmits: readFiniteNumber(item.retransmits, uploadRetransmits),
    success: ['completed', 'success', 'ok'].includes(status),
  }
}

function readFiniteNumber(value: unknown, fallback: number | null = null): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeIperf3Intervals(raw: unknown): Iperf3IntervalView[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isRecord).map((item) => {
    const bitsPerSecond = readFiniteNumber(item.bits_per_second)
    return {
      start: readFiniteNumber(item.start),
      end: readFiniteNumber(item.end),
      seconds: readFiniteNumber(item.seconds),
      bytes: readFiniteNumber(item.bytes),
      bits_per_second: bitsPerSecond,
      mbps: bitsPerSecond === null ? null : bitsPerSecond / 1_000_000,
      retransmits: readFiniteNumber(item.retransmits),
      snd_cwnd: readFiniteNumber(item.snd_cwnd),
      snd_wnd: readFiniteNumber(item.snd_wnd),
      rtt: readFiniteNumber(item.rtt),
      rttvar: readFiniteNumber(item.rttvar),
      sender: typeof item.sender === 'boolean' ? item.sender : null,
    }
  })
}

export function normalizeMtrDetail(raw: unknown): MtrResultDetailView {
  const item = isRecord(raw) ? raw : {}
  const status = readString(item.latest_run_status, readString(item.run_status, '')).toLowerCase()
  const rawHops = Array.isArray(item.hops) ? item.hops : []
  const hops: MtrHopAddressView[] = []

  for (const rawHop of rawHops) {
    if (!isRecord(rawHop)) continue
    const hopNumber = readNumber(rawHop.hop)
    const addresses = Array.isArray(rawHop.addresses) ? rawHop.addresses : [rawHop]
    for (const rawAddress of addresses) {
      if (!isRecord(rawAddress)) continue
      hops.push({
        hop: hopNumber || readNumber(rawAddress.hop),
        ip: readString(rawAddress.ip, '*'),
        hostname: readNullableString(rawAddress.hostname) ?? readNullableString(rawAddress.ptr),
        asn: readNullableString(rawAddress.asn),
        packet_loss_pct: readNumber(rawAddress.packet_loss_pct),
        avg_ms: readNumber(rawAddress.avg_ms, readNumber(rawAddress.avg_rtt)),
        best_ms: readNumber(rawAddress.best_ms, readNumber(rawAddress.min_rtt)),
        worst_ms: readNumber(rawAddress.worst_ms, readNumber(rawAddress.max_rtt)),
      })
    }
  }

  return {
    result_uuid: readString(item.result_uuid),
    task_uuid: readString(item.task_uuid),
    agent_uuid: readNullableString(item.agent_uuid),
    timestamp: readString(item.latest_sample_at, readString(item.timestamp, readString(item.finished_at, ''))),
    target_reached: ['completed', 'success', 'ok'].includes(status),
    total_hops: readNumber(item.hop_count, readNumber(item.total_hops, hops.length)),
    resolved_ip: readNullableString(item.resolved_ip),
    duration_ms: typeof item.duration_ms === 'number' ? item.duration_ms : null,
    as_path: Array.isArray(item.as_path) ? item.as_path.filter((asn): asn is string => typeof asn === 'string') : [],
    hops,
  }
}

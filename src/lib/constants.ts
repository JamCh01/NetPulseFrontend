export const PROTOCOL_COLORS: Record<string, string> = {
  icmp: 'bg-proto-icmp text-proto-icmp-text border-proto-icmp-text/20 dark:border-proto-icmp-text/35',
  tcp: 'bg-proto-tcp text-proto-tcp-text border-proto-tcp-text/20 dark:border-proto-tcp-text/35',
  udp: 'bg-proto-udp text-proto-udp-text border-proto-udp-text/20 dark:border-proto-udp-text/35',
  http: 'bg-proto-http text-proto-http-text border-proto-http-text/20 dark:border-proto-http-text/35',
  iperf3: 'bg-teal-500/10 text-teal-700 border-teal-500/25 dark:text-teal-300 dark:border-teal-400/30',
  mtr: 'bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-300 dark:border-sky-400/30',
}

export const MONITORING_PROTOCOLS = ['icmp', 'tcp', 'mtr', 'iperf3'] as const

export type MonitoringProtocolName = (typeof MONITORING_PROTOCOLS)[number]

export const PROTOCOL_LABELS: Record<MonitoringProtocolName, string> = {
  icmp: 'ICMP',
  tcp: 'TCP',
  mtr: 'MTR',
  iperf3: 'IPERF3',
}

export function protocolLabel(protocol: string): string {
  const normalized = protocol.toLowerCase()
  return PROTOCOL_LABELS[normalized as MonitoringProtocolName] ?? normalized.toUpperCase()
}

export function ipVersionLabel(value: string | null | undefined, placeholder = 'Select IP version'): string {
  if (value === '4') return 'IPv4'
  if (value === '6') return 'IPv6'
  if (value === '4+6') return 'IPv4 + IPv6'
  return value || placeholder
}

export function ipFamilyLabel(value: string | null | undefined, placeholder = 'Select IP family'): string {
  if (value === '4') return 'IPv4'
  if (value === '6') return 'IPv6'
  return value || placeholder
}

export const PROTOCOL_ICON_COLORS: Record<string, string> = {
  icmp: 'text-cyan-600 dark:text-cyan-400',
  tcp: 'text-purple-600 dark:text-purple-400',
  http: 'text-emerald-600 dark:text-emerald-400',
  udp: 'text-amber-600 dark:text-amber-400',
  iperf3: 'text-teal-600 dark:text-teal-400',
  mtr: 'text-sky-600 dark:text-sky-400',
}

export const AGENT_STATUS_COLORS: Record<string, string> = {
  online: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30',
  offline: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/15 dark:text-gray-400 dark:border-gray-500/30',
  disabled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30',
}

export const PLATFORM_OPTIONS = [
  { value: 'x86_64-linux-musl', labelKey: 'agents.platformLinuxAmd64' },
  { value: 'aarch64-linux-musl', labelKey: 'agents.platformLinuxArm64' },
  { value: 'x86_64-macos', labelKey: 'agents.platformDarwinAmd64' },
  { value: 'aarch64-macos', labelKey: 'agents.platformDarwinArm64' },
  { value: 'x86_64-windows', labelKey: 'agents.platformWindowsAmd64' },
  { value: 'aarch64-windows', labelKey: 'agents.platformWindowsArm64' },
] as const

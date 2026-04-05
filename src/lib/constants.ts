export const PROTOCOL_COLORS: Record<string, string> = {
  icmp: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  tcp: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  udp: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  http: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

export const AGENT_STATUS_COLORS: Record<string, string> = {
  online: 'bg-green-500/15 text-green-400 border-green-500/30',
  offline: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  disabled: 'bg-red-500/15 text-red-400 border-red-500/30',
}

export const PLATFORM_OPTIONS = [
  { value: 'x86_64-linux-musl', labelKey: 'agents.platformLinuxAmd64' },
  { value: 'aarch64-linux-musl', labelKey: 'agents.platformLinuxArm64' },
  { value: 'x86_64-macos', labelKey: 'agents.platformDarwinAmd64' },
  { value: 'aarch64-macos', labelKey: 'agents.platformDarwinArm64' },
  { value: 'x86_64-windows', labelKey: 'agents.platformWindowsAmd64' },
  { value: 'aarch64-windows', labelKey: 'agents.platformWindowsArm64' },
] as const

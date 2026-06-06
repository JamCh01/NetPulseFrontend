import type { AdminAgent, AdminTarget, IpFamily, IpVersion, TaskType } from '@/api/hooks/admin-api'

export type QuickAssociateTaskType = Exclude<TaskType, 'iperf3'>

export const QUICK_ASSOCIATE_TASK_TYPES: QuickAssociateTaskType[] = ['icmp', 'tcp', 'mtr']
export const QUICK_ASSOCIATE_IP_FAMILIES: IpFamily[] = ['4', '6']

function expandIpVersion(version?: IpVersion | null): IpFamily[] {
  if (version === '4') return ['4']
  if (version === '6') return ['6']
  return ['4', '6']
}

export function quickAssociateTaskTypeOptions(target?: Pick<AdminTarget, 'supported_protocols'> | null): QuickAssociateTaskType[] {
  const supported = target?.supported_protocols?.length ? target.supported_protocols : QUICK_ASSOCIATE_TASK_TYPES
  return QUICK_ASSOCIATE_TASK_TYPES.filter((type) => supported.includes(type))
}

export function compatibleQuickAssociateIpFamilies(
  target?: Pick<AdminTarget, 'ip_version'> | null,
  agent?: Pick<AdminAgent, 'ip_version'> | null,
): IpFamily[] {
  if (!target || !agent) return []
  const agentFamilies = new Set(expandIpVersion(agent.ip_version))
  return expandIpVersion(target.ip_version).filter((family) => agentFamilies.has(family))
}

export function clampQuickAssociateTaskTypes(selected: QuickAssociateTaskType[], options: QuickAssociateTaskType[]): QuickAssociateTaskType[] {
  const clamped = selected.filter((type) => options.includes(type))
  if (clamped.length > 0) return clamped
  if (options.includes('icmp')) return ['icmp']
  return options[0] ? [options[0]] : []
}

export function clampQuickAssociateIpFamilies(selected: IpFamily[], options: IpFamily[]): IpFamily[] {
  const clamped = selected.filter((family) => options.includes(family))
  return clamped.length > 0 ? clamped : options
}

export function toggleQuickAssociateTaskType(
  selected: QuickAssociateTaskType[],
  taskType: string,
  options: QuickAssociateTaskType[],
): QuickAssociateTaskType[] {
  if (!options.includes(taskType as QuickAssociateTaskType)) return selected
  const typedTaskType = taskType as QuickAssociateTaskType
  const next = selected.includes(typedTaskType)
    ? selected.filter((type) => type !== typedTaskType)
    : [...selected, typedTaskType]
  return clampQuickAssociateTaskTypes(next, options)
}

export function toggleQuickAssociateIpFamily(selected: IpFamily[], family: string, options: IpFamily[]): IpFamily[] {
  if (!options.includes(family as IpFamily)) return selected
  const typedFamily = family as IpFamily
  const next = selected.includes(typedFamily)
    ? selected.filter((item) => item !== typedFamily)
    : [...selected, typedFamily]
  return clampQuickAssociateIpFamilies(next, options)
}

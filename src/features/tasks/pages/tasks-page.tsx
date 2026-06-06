import { useMemo, useState } from 'react'
import { type TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { toast } from 'sonner'

import {
  type AdminTask,
  type AdminTarget,
  type IpFamily,
  type TaskType,
  useAgents,
  useCreateTask,
  useDeleteTask,
  useQuickAssociate,
  useSetTaskEnabled,
  useTargets,
  useTasks,
  useUpdateTask,
} from '@/api/hooks/admin-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { QuickAssociateFields } from '@/features/admin/quick-associate-fields'
import {
  clampQuickAssociateIpFamilies,
  clampQuickAssociateTaskTypes,
  compatibleQuickAssociateIpFamilies,
  quickAssociateTaskTypeOptions,
  toggleQuickAssociateIpFamily,
  toggleQuickAssociateTaskType,
  type QuickAssociateTaskType,
} from '@/features/admin/quick-associate-options'
import { buildTaskPayload, formatDateTime, protocolOptionsForTarget } from '@/features/admin/utils'
import { PROTOCOL_COLORS, ipFamilyLabel, protocolLabel } from '@/lib/constants'

type Iperf3Mode = 'single_thread' | 'multi_thread'
type MtrProbeProtocol = 'icmp_echo' | 'tcp' | 'udp'

interface TargetOptionSummary {
  name: string
  target: string
  supported_protocols?: AdminTarget['supported_protocols']
  ip_version?: AdminTarget['ip_version']
}

interface AgentOptionSummary {
  name: string
  city?: string | null
  ip_version?: AdminTarget['ip_version']
}

interface TaskFormState {
  name: string
  target_uuid: string
  agent_uuid: string
  task_type: TaskType
  ip_family: IpFamily
  interval: string
  timeout: string
  packet_count: string
  port: string
  payload_size: string
  ttl: string
  dont_fragment: boolean
  mtr_probe_protocol: MtrProbeProtocol
  mtr_max_hops: string
  mtr_retry_enabled: boolean
  mtr_loss_threshold_pct: string
  mtr_cooldown_duration_sec: string
  mtr_max_retry_count: string
  iperf3_mode: Iperf3Mode
  iperf3_duration: string
  iperf3_execution_time: string
}

function initialTaskForm(): TaskFormState {
  return {
    name: '',
    target_uuid: '',
    agent_uuid: '',
    task_type: 'icmp',
    ip_family: '4',
    interval: '60',
    timeout: '3000',
    packet_count: '4',
    port: '443',
    payload_size: '64',
    ttl: '',
    dont_fragment: false,
    mtr_probe_protocol: 'icmp_echo',
    mtr_max_hops: '30',
    mtr_retry_enabled: true,
    mtr_loss_threshold_pct: '10',
    mtr_cooldown_duration_sec: '300',
    mtr_max_retry_count: '3',
    iperf3_mode: 'single_thread',
    iperf3_duration: '10',
    iperf3_execution_time: '00:00',
  }
}

function formWithProtocolDefaults(current: TaskFormState, taskType: TaskType): TaskFormState {
  if (taskType === 'tcp') {
    return { ...current, task_type: taskType, interval: '60', timeout: '3000', packet_count: '4', port: '443', payload_size: '64' }
  }
  if (taskType === 'iperf3') {
    return {
      ...current,
      task_type: taskType,
      interval: '86400',
      timeout: '15000',
      packet_count: '1',
      port: '5201',
      iperf3_duration: current.iperf3_duration || '10',
      iperf3_execution_time: current.iperf3_execution_time || '00:00',
    }
  }
  if (taskType === 'mtr') {
    return {
      ...current,
      task_type: taskType,
      interval: '60',
      timeout: '10000',
      packet_count: '10',
      port: '',
      payload_size: '64',
      mtr_probe_protocol: 'icmp_echo',
      mtr_max_hops: '30',
      mtr_retry_enabled: true,
      mtr_loss_threshold_pct: '10',
      mtr_cooldown_duration_sec: '300',
      mtr_max_retry_count: '3',
    }
  }
  return {
    ...current,
    task_type: taskType,
    interval: '60',
    timeout: '3000',
    packet_count: '4',
    port: '',
    payload_size: '64',
    ttl: '',
    dont_fragment: false,
  }
}

function FieldRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string
  description: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2 py-3 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] md:items-center">
      <div className="min-w-0">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">{label}</Label>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function CompactField({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string
  description?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-text-primary">{label}</Label>
      {children}
      {description && <p className="text-[11px] leading-snug text-text-muted">{description}</p>}
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="py-2.5">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-text-muted">{description}</p>
    </div>
  )
}

function ProtocolFields({
  mode,
  value,
  onChange,
}: {
  mode: 'create' | 'edit'
  value: TaskFormState
  onChange: (next: TaskFormState) => void
}) {
  const { t } = useTranslation()
  const prefix = mode === 'create' ? 'task-create' : 'task-edit'
  const taskType = value.task_type
  const setValue = (patch: Partial<TaskFormState>) => onChange({ ...value, ...patch })

  if (taskType === 'iperf3') {
    return (
      <>
        <SectionHeader
          title={t('tasks.protocolIperf3Title')}
          description={t('tasks.protocolIperf3Desc')}
        />
        <FieldRow label={t('tasks.fieldPort')} description={t('tasks.fieldPortDescIperf3')} htmlFor={`${prefix}-port`}>
          <Input id={`${prefix}-port`} aria-label={t('tasks.fieldPort')} type="number" min="1" max="65535" placeholder={t('tasks.fieldPort')} value={value.port} onChange={(event) => setValue({ port: event.target.value })} />
        </FieldRow>
        <FieldRow label={t('tasks.fieldThreadMode')} description={t('tasks.fieldThreadModeDesc')}>
          <Select value={value.iperf3_mode} onValueChange={(nextMode) => setValue({ iperf3_mode: nextMode as Iperf3Mode })}>
            <SelectTrigger aria-label={t('tasks.fieldThreadMode')} className="w-full">
              <SelectValue>
                {(selectedMode: Iperf3Mode | null) => selectedMode ? iperf3ModeLabel(selectedMode, t) : t('tasks.selectThreadMode')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single_thread">{t('tasks.iperf3ModeSingle')}</SelectItem>
              <SelectItem value="multi_thread">{t('tasks.iperf3ModeMulti')}</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label={t('tasks.fieldIperf3Duration')} description={t('tasks.fieldIperf3DurationDesc')} htmlFor={`${prefix}-iperf3-duration`}>
          <Input id={`${prefix}-iperf3-duration`} aria-label={t('tasks.fieldIperf3Duration')} type="number" min="1" placeholder={t('tasks.durationSecondsPlaceholder')} value={value.iperf3_duration} onChange={(event) => setValue({ iperf3_duration: event.target.value })} />
        </FieldRow>
        <FieldRow label={t('tasks.fieldIperf3ExecutionTime')} description={t('tasks.fieldIperf3ExecutionTimeDesc')} htmlFor={`${prefix}-iperf3-execution-time`}>
          <Input id={`${prefix}-iperf3-execution-time`} aria-label={t('tasks.fieldIperf3ExecutionTime')} type="time" step="60" value={value.iperf3_execution_time} onChange={(event) => setValue({ iperf3_execution_time: event.target.value })} />
        </FieldRow>
      </>
    )
  }

  if (taskType === 'tcp') {
    return (
      <>
        <SectionHeader
          title={t('tasks.protocolTcpTitle')}
          description={t('tasks.protocolTcpDesc')}
        />
        <FieldRow label={t('tasks.fieldScheduleInterval')} description={t('tasks.fieldScheduleIntervalDesc', { protocol: 'TCP' })} htmlFor={`${prefix}-interval`}>
          <Input id={`${prefix}-interval`} type="number" min="60" placeholder={t('tasks.intervalSecondsPlaceholder')} value={value.interval} onChange={(event) => setValue({ interval: event.target.value })} />
        </FieldRow>
        <FieldRow label={t('tasks.fieldTimeout')} description={t('tasks.fieldTimeoutTcpDesc')} htmlFor={`${prefix}-timeout`}>
          <Input id={`${prefix}-timeout`} type="number" min="1000" placeholder={t('tasks.timeoutMsPlaceholder')} value={value.timeout} onChange={(event) => setValue({ timeout: event.target.value })} />
        </FieldRow>
        <FieldRow label={t('tasks.fieldSampleCount')} description={t('tasks.fieldSampleCountDesc')} htmlFor={`${prefix}-packet-count`}>
          <Input id={`${prefix}-packet-count`} aria-label={t('tasks.fieldPacketCount')} type="number" min="1" placeholder={t('tasks.sampleCountPlaceholder')} value={value.packet_count} onChange={(event) => setValue({ packet_count: event.target.value })} />
        </FieldRow>
        <FieldRow label={t('tasks.fieldPort')} description={t('tasks.fieldPortDescTcp')} htmlFor={`${prefix}-port`}>
          <Input id={`${prefix}-port`} aria-label={t('tasks.fieldPort')} type="number" min="1" max="65535" placeholder={t('tasks.fieldPort')} value={value.port} onChange={(event) => setValue({ port: event.target.value })} />
        </FieldRow>
        <FieldRow label={t('tasks.fieldPayloadSize')} description={t('tasks.fieldPayloadSizeTcpDesc')} htmlFor={`${prefix}-payload-size`}>
          <Input id={`${prefix}-payload-size`} aria-label={t('tasks.fieldPayloadSize')} type="number" min="1" max="65507" placeholder={t('tasks.bytesPlaceholder')} value={value.payload_size} onChange={(event) => setValue({ payload_size: event.target.value })} />
        </FieldRow>
      </>
    )
  }

  if (taskType === 'mtr') {
    return (
      <>
        <SectionHeader
          title={t('tasks.protocolMtrTitle')}
          description={t('tasks.protocolMtrDesc')}
        />
        <div className="grid gap-3 py-3 md:grid-cols-2">
          <CompactField label={t('tasks.fieldScheduleInterval')} description={t('tasks.fieldScheduleIntervalCompactDesc')} htmlFor={`${prefix}-interval`}>
            <Input id={`${prefix}-interval`} type="number" min="60" placeholder={t('tasks.intervalSecondsPlaceholder')} value={value.interval} onChange={(event) => setValue({ interval: event.target.value })} />
          </CompactField>
          <CompactField label={t('tasks.fieldTimeout')} description={t('tasks.fieldTimeoutMtrDesc')} htmlFor={`${prefix}-timeout`}>
            <Input id={`${prefix}-timeout`} type="number" min="1000" placeholder={t('tasks.timeoutMsPlaceholder')} value={value.timeout} onChange={(event) => setValue({ timeout: event.target.value })} />
          </CompactField>
          <CompactField label={t('tasks.fieldPacketCount')} description={t('tasks.fieldPacketCountMtrDesc')} htmlFor={`${prefix}-packet-count`}>
            <Input id={`${prefix}-packet-count`} type="number" min="1" placeholder={t('tasks.packetCountPlaceholder')} value={value.packet_count} onChange={(event) => setValue({ packet_count: event.target.value })} />
          </CompactField>
          <CompactField label={t('tasks.fieldMtrProbeProtocol')} description={t('tasks.fieldMtrProbeProtocolDesc')}>
            <Select value={value.mtr_probe_protocol} onValueChange={(protocol) => {
              const nextProtocol = protocol as MtrProbeProtocol
              setValue({
                mtr_probe_protocol: nextProtocol,
                port: nextProtocol === 'icmp_echo' ? '' : value.port || '443',
              })
            }}>
              <SelectTrigger aria-label={t('tasks.fieldMtrProbeProtocol')} className="w-full">
                <SelectValue>
                  {(protocol: MtrProbeProtocol | null) => protocol ? mtrProbeProtocolLabel(protocol) : t('tasks.selectMtrProbeProtocol')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="icmp_echo">ICMP Echo</SelectItem>
                <SelectItem value="tcp">TCP</SelectItem>
                <SelectItem value="udp">UDP</SelectItem>
              </SelectContent>
            </Select>
          </CompactField>
          <CompactField label={t('tasks.fieldMtrMaxHops')} description={t('tasks.fieldMtrMaxHopsDesc')} htmlFor={`${prefix}-mtr-max-hops`}>
            <Input id={`${prefix}-mtr-max-hops`} aria-label={t('tasks.fieldMtrMaxHops')} type="number" min="1" max="255" placeholder={t('tasks.maxHopsPlaceholder')} value={value.mtr_max_hops} onChange={(event) => setValue({ mtr_max_hops: event.target.value })} />
          </CompactField>
          <CompactField label={t('tasks.fieldPayloadSize')} description={t('tasks.fieldPayloadSizeMtrDesc')} htmlFor={`${prefix}-payload-size`}>
            <Input id={`${prefix}-payload-size`} aria-label={t('tasks.fieldPayloadSize')} type="number" min="1" max="65507" placeholder={t('tasks.bytesPlaceholder')} value={value.payload_size} onChange={(event) => setValue({ payload_size: event.target.value })} />
          </CompactField>
          {(value.mtr_probe_protocol === 'tcp' || value.mtr_probe_protocol === 'udp') && (
            <CompactField label={t('tasks.fieldPort')} description={t('tasks.fieldPortDescMtr')} htmlFor={`${prefix}-port`}>
              <Input id={`${prefix}-port`} aria-label={t('tasks.fieldPort')} type="number" min="1" max="65535" placeholder={t('tasks.fieldPort')} value={value.port} onChange={(event) => setValue({ port: event.target.value })} />
            </CompactField>
          )}
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-bg-surface px-3 py-2 md:col-span-2">
            <div className="min-w-0">
              <Label className="text-xs font-medium text-text-primary">{t('tasks.fieldMtrRetry')}</Label>
              <p className="mt-0.5 text-[11px] leading-snug text-text-muted">{t('tasks.fieldMtrRetryDesc')}</p>
            </div>
            <ToggleSwitch
              checked={value.mtr_retry_enabled}
              onChange={(checked) => setValue({ mtr_retry_enabled: checked })}
              aria-label={t('tasks.fieldMtrRetry')}
              labelLeft={t('tasks.offShort')}
              labelRight={t('tasks.onShort')}
            />
          </div>
        </div>
        {value.mtr_retry_enabled && (
          <div className="grid gap-3 border-t border-border py-3 md:grid-cols-3">
            <CompactField label={t('tasks.fieldLossThreshold')} description={t('tasks.fieldLossThresholdDesc')} htmlFor={`${prefix}-mtr-loss-threshold`}>
              <Input id={`${prefix}-mtr-loss-threshold`} aria-label={t('tasks.fieldLossThreshold')} type="number" min="0" max="100" step="0.1" placeholder={t('tasks.percentPlaceholder')} value={value.mtr_loss_threshold_pct} onChange={(event) => setValue({ mtr_loss_threshold_pct: event.target.value })} />
            </CompactField>
            <CompactField label={t('tasks.fieldCooldown')} description={t('tasks.fieldCooldownDesc')} htmlFor={`${prefix}-mtr-cooldown`}>
              <Input id={`${prefix}-mtr-cooldown`} aria-label={t('tasks.fieldCooldown')} type="number" min="0" placeholder={t('tasks.secondsPlaceholder')} value={value.mtr_cooldown_duration_sec} onChange={(event) => setValue({ mtr_cooldown_duration_sec: event.target.value })} />
            </CompactField>
            <CompactField label={t('tasks.fieldMaxRetries')} description={t('tasks.fieldMaxRetriesDesc')} htmlFor={`${prefix}-mtr-max-retry`}>
              <Input id={`${prefix}-mtr-max-retry`} aria-label={t('tasks.fieldMaxRetries')} type="number" min="0" placeholder={t('tasks.timesPlaceholder')} value={value.mtr_max_retry_count} onChange={(event) => setValue({ mtr_max_retry_count: event.target.value })} />
            </CompactField>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <SectionHeader
        title={t('tasks.protocolIcmpTitle')}
        description={t('tasks.protocolIcmpDesc')}
      />
      <FieldRow label={t('tasks.fieldScheduleInterval')} description={t('tasks.fieldScheduleIntervalDesc', { protocol: 'ICMP' })} htmlFor={`${prefix}-interval`}>
        <Input id={`${prefix}-interval`} type="number" min="60" placeholder={t('tasks.intervalSecondsPlaceholder')} value={value.interval} onChange={(event) => setValue({ interval: event.target.value })} />
      </FieldRow>
      <FieldRow label={t('tasks.fieldTimeout')} description={t('tasks.fieldTimeoutIcmpDesc')} htmlFor={`${prefix}-timeout`}>
        <Input id={`${prefix}-timeout`} type="number" min="1000" placeholder={t('tasks.timeoutMsPlaceholder')} value={value.timeout} onChange={(event) => setValue({ timeout: event.target.value })} />
      </FieldRow>
      <FieldRow label={t('tasks.fieldPacketCount')} description={t('tasks.fieldPacketCountIcmpDesc')} htmlFor={`${prefix}-packet-count`}>
        <Input id={`${prefix}-packet-count`} type="number" min="1" placeholder={t('tasks.packetCountPlaceholder')} value={value.packet_count} onChange={(event) => setValue({ packet_count: event.target.value })} />
      </FieldRow>
      <FieldRow label={t('tasks.fieldPayloadSize')} description={t('tasks.fieldPayloadSizeIcmpDesc')} htmlFor={`${prefix}-payload-size`}>
        <Input id={`${prefix}-payload-size`} aria-label={t('tasks.fieldPayloadSize')} type="number" min="1" max="65507" placeholder={t('tasks.bytesPlaceholder')} value={value.payload_size} onChange={(event) => setValue({ payload_size: event.target.value })} />
      </FieldRow>
      <FieldRow label="TTL" description={t('tasks.fieldTtlDesc')} htmlFor={`${prefix}-ttl`}>
        <Input id={`${prefix}-ttl`} aria-label="TTL" type="number" min="1" placeholder={t('tasks.notSetPlaceholder')} value={value.ttl} onChange={(event) => setValue({ ttl: event.target.value })} />
      </FieldRow>
      <FieldRow label={t('tasks.fieldDontFragment')} description={t('tasks.fieldDontFragmentDesc')}>
        <ToggleSwitch
          checked={value.dont_fragment}
          onChange={(checked) => setValue({ dont_fragment: checked })}
          aria-label={t('tasks.fieldDontFragment')}
          labelLeft={t('tasks.off')}
          labelRight={t('tasks.on')}
        />
      </FieldRow>
    </>
  )
}

function iperf3ModeLabel(mode: Iperf3Mode, t: TFunction<'translation'>): string {
  return mode === 'multi_thread' ? t('tasks.iperf3ModeMulti') : t('tasks.iperf3ModeSingle')
}

function targetOptionLabel(target: TargetOptionSummary | null | undefined, placeholder: string, fallback?: string | null): string {
  if (!target) return fallback || placeholder
  return target.name
}

function agentOptionLabel(agent: AgentOptionSummary | null | undefined, placeholder: string, fallback?: string | null): string {
  if (!agent) return fallback || placeholder
  return `${agent.name}${agent.city ? ` - ${agent.city}` : ''}`
}

function mtrProbeProtocolLabel(protocol: MtrProbeProtocol): string {
  if (protocol === 'tcp') return 'TCP'
  if (protocol === 'udp') return 'UDP'
  return 'ICMP Echo'
}

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined
  return Number(value)
}

function timeInputValue(value: string): string {
  const parts = value.trim().split(':')
  if (parts.length < 2) return '00:00'
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
}


export default function TasksPage() {
  const { t } = useTranslation()
  const [keyword, setKeyword] = useState('')
  const [taskType, setTaskType] = useState<TaskType | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [editTask, setEditTask] = useState<AdminTask | null>(null)
  const [editForm, setEditForm] = useState<TaskFormState>(() => initialTaskForm())
  const [deleteTaskUuid, setDeleteTaskUuid] = useState<string | null>(null)
  const [quickTargetUuid, setQuickTargetUuid] = useState('')
  const [quickAgentUuid, setQuickAgentUuid] = useState('')
  const [selectedQuickTaskTypes, setSelectedQuickTaskTypes] = useState<QuickAssociateTaskType[]>(['icmp'])
  const [selectedQuickIpFamilies, setSelectedQuickIpFamilies] = useState<IpFamily[]>([])
  const [form, setForm] = useState<TaskFormState>(() => initialTaskForm())

  const tasksQuery = useTasks({ keyword, task_type: taskType, sort_by: 'name', sort_order: 'asc' })
  const targetsQuery = useTargets({ page_size: 100, sort_by: 'name', sort_order: 'asc', is_enabled: true })
  const agentsQuery = useAgents({ page_size: 100, sort_by: 'name', sort_order: 'asc', is_enabled: true })
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const setTaskEnabled = useSetTaskEnabled()
  const deleteTask = useDeleteTask()
  const quickAssociate = useQuickAssociate()

  const tasks = useMemo(() => tasksQuery.data?.items ?? [], [tasksQuery.data?.items])
  const targets = useMemo(() => targetsQuery.data?.items ?? [], [targetsQuery.data?.items])
  const agents = useMemo(() => agentsQuery.data?.items ?? [], [agentsQuery.data?.items])
  const selectedTarget = useMemo(
    () => targets.find((target) => target.target_uuid === form.target_uuid) ?? null,
    [form.target_uuid, targets],
  )
  const availableTaskTypes = protocolOptionsForTarget(selectedTarget)
  const selectedEditTarget = useMemo(
    () => targets.find((target) => target.target_uuid === editForm.target_uuid) ?? null,
    [editForm.target_uuid, targets],
  )
  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.agent_uuid === form.agent_uuid) ?? null,
    [form.agent_uuid, agents],
  )
  const selectedEditAgent = useMemo(
    () => agents.find((agent) => agent.agent_uuid === editForm.agent_uuid) ?? null,
    [editForm.agent_uuid, agents],
  )
  const selectedQuickTarget = useMemo(
    () => targets.find((target) => target.target_uuid === quickTargetUuid) ?? null,
    [quickTargetUuid, targets],
  )
  const selectedQuickAgent = useMemo(
    () => agents.find((agent) => agent.agent_uuid === quickAgentUuid) ?? null,
    [quickAgentUuid, agents],
  )
  const quickTaskTypeOptions = useMemo(
    () => quickAssociateTaskTypeOptions(selectedQuickTarget),
    [selectedQuickTarget],
  )
  const quickIpFamilyOptions = useMemo(
    () => compatibleQuickAssociateIpFamilies(selectedQuickTarget, selectedQuickAgent),
    [selectedQuickTarget, selectedQuickAgent],
  )

  const clampedQuickTaskTypes = useMemo(
    () => clampQuickAssociateTaskTypes(selectedQuickTaskTypes, quickTaskTypeOptions),
    [quickTaskTypeOptions, selectedQuickTaskTypes],
  )
  const clampedQuickIpFamilies = useMemo(
    () => clampQuickAssociateIpFamilies(selectedQuickIpFamilies, quickIpFamilyOptions),
    [quickIpFamilyOptions, selectedQuickIpFamilies],
  )

  const resetCreateForm = () => {
    setForm(initialTaskForm())
  }

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault()
    const payload = buildTaskPayload({
      name: form.name,
      target_uuid: form.target_uuid,
      agent_uuid: form.agent_uuid,
      task_type: form.task_type,
      ip_family: form.ip_family,
      interval: Number(form.interval),
      timeout: Number(form.timeout),
      packet_count: Number(form.packet_count),
      port: form.port ? Number(form.port) : undefined,
      payloadSize: Number(form.payload_size),
      ttl: optionalNumber(form.ttl),
      dontFragment: form.dont_fragment,
      mtrProbeProtocol: form.mtr_probe_protocol,
      mtrMaxHops: Number(form.mtr_max_hops),
      mtrRetryEnabled: form.mtr_retry_enabled,
      mtrLossThresholdPct: Number(form.mtr_loss_threshold_pct),
      mtrCooldownDurationSec: Number(form.mtr_cooldown_duration_sec),
      mtrMaxRetryCount: Number(form.mtr_max_retry_count),
      iperf3Mode: form.iperf3_mode,
      iperf3Duration: form.iperf3_duration ? Number(form.iperf3_duration) : undefined,
      iperf3ExecutionTime: form.iperf3_execution_time || '00:00',
    })
    createTask.mutate(payload, {
      onSuccess: () => {
        toast.success(t('tasks.createdToast'))
        setCreateOpen(false)
        resetCreateForm()
      },
      onError: (error) => toast.error(error.message || t('tasks.createError')),
    })
  }

  const openEditTask = (task: AdminTask) => {
    const probeConfig = task.probe_config ?? {}
    const mode = probeConfig.mode === 'multi_thread' ? 'multi_thread' : 'single_thread'
    const durationSec = typeof probeConfig.duration_sec === 'number' ? probeConfig.duration_sec : 10
    const executionTime = typeof probeConfig.execution_time === 'string' ? probeConfig.execution_time : '00:00:00'
    const port = typeof probeConfig.port === 'number' ? String(probeConfig.port) : ''
    const retryConfig = task.mtr_retry_config ?? {}
    const mtrProtocol = probeConfig.probe_protocol === 'tcp' || probeConfig.probe_protocol === 'udp'
      ? probeConfig.probe_protocol
      : 'icmp_echo'
    setEditForm({
      name: task.name,
      target_uuid: task.target_uuid,
      agent_uuid: task.agent_uuid,
      ip_family: task.ip_family,
      interval: String(task.interval),
      timeout: String(task.timeout),
      packet_count: String(task.packet_count),
      port,
      payload_size: typeof probeConfig.payload_size === 'number' ? String(probeConfig.payload_size) : '64',
      ttl: typeof probeConfig.ttl === 'number' ? String(probeConfig.ttl) : '',
      dont_fragment: Boolean(probeConfig.dont_fragment),
      mtr_probe_protocol: mtrProtocol,
      mtr_max_hops: typeof probeConfig.max_hops === 'number' ? String(probeConfig.max_hops) : '30',
      mtr_retry_enabled: typeof retryConfig.enabled === 'boolean' ? retryConfig.enabled : true,
      mtr_loss_threshold_pct: typeof retryConfig.loss_threshold_pct === 'number' ? String(retryConfig.loss_threshold_pct) : '10',
      mtr_cooldown_duration_sec: typeof retryConfig.cooldown_duration_sec === 'number' ? String(retryConfig.cooldown_duration_sec) : '300',
      mtr_max_retry_count: typeof retryConfig.max_retry_count === 'number' ? String(retryConfig.max_retry_count) : '3',
      iperf3_mode: mode,
      iperf3_duration: String(durationSec),
      iperf3_execution_time: timeInputValue(executionTime),
      task_type: task.task_type,
    })
    setEditTask(task)
  }

  const handleEdit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!editTask) return
    const nextPayload = buildTaskPayload({
      name: editForm.name,
      target_uuid: editForm.target_uuid,
      agent_uuid: editForm.agent_uuid,
      task_type: editTask.task_type,
      ip_family: editForm.ip_family,
      interval: Number(editForm.interval),
      timeout: Number(editForm.timeout),
      packet_count: Number(editForm.packet_count),
      port: editForm.port ? Number(editForm.port) : undefined,
      payloadSize: Number(editForm.payload_size),
      ttl: optionalNumber(editForm.ttl),
      dontFragment: editForm.dont_fragment,
      mtrProbeProtocol: editForm.mtr_probe_protocol,
      mtrMaxHops: Number(editForm.mtr_max_hops),
      mtrRetryEnabled: editForm.mtr_retry_enabled,
      mtrLossThresholdPct: Number(editForm.mtr_loss_threshold_pct),
      mtrCooldownDurationSec: Number(editForm.mtr_cooldown_duration_sec),
      mtrMaxRetryCount: Number(editForm.mtr_max_retry_count),
      iperf3Mode: editForm.iperf3_mode,
      iperf3Duration: editForm.iperf3_duration ? Number(editForm.iperf3_duration) : undefined,
      iperf3ExecutionTime: editForm.iperf3_execution_time || '00:00',
    })
    updateTask.mutate({
      uuid: editTask.task_uuid,
      data: {
        name: nextPayload.name,
        target_uuid: nextPayload.target_uuid,
        agent_uuid: nextPayload.agent_uuid,
        ip_family: nextPayload.ip_family,
        interval: nextPayload.interval,
        timeout: nextPayload.timeout,
        packet_count: nextPayload.packet_count,
        probe_config: nextPayload.probe_config,
        mtr_retry_config: nextPayload.mtr_retry_config,
        schedule_jitter_ms: nextPayload.schedule_jitter_ms,
      },
    }, {
      onSuccess: () => {
        toast.success(t('tasks.updatedToast'))
        setEditTask(null)
      },
      onError: (error) => toast.error(error.message || t('tasks.updateError')),
    })
  }

  const resetQuickAssociate = () => {
    setQuickOpen(false)
    setQuickTargetUuid('')
    setQuickAgentUuid('')
    setSelectedQuickTaskTypes(['icmp'])
    setSelectedQuickIpFamilies([])
  }

  const handleQuickAssociate = () => {
    if (!quickTargetUuid || !quickAgentUuid || clampedQuickTaskTypes.length === 0 || clampedQuickIpFamilies.length === 0) return
    quickAssociate.mutate({
      target_uuid: quickTargetUuid,
      agent_uuid: quickAgentUuid,
      task_types: clampedQuickTaskTypes,
      ip_families: clampedQuickIpFamilies,
    }, {
      onSuccess: (createdTasks) => {
        toast.success(t('tasks.quickAssociateSuccess', { count: createdTasks.length }))
        resetQuickAssociate()
      },
      onError: (error) => toast.error(error.message || t('tasks.quickAssociateError')),
    })
  }

  const taskToDelete = deleteTaskUuid ? tasks.find((task) => task.task_uuid === deleteTaskUuid) : null

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('tasks.managementTitle')}</h1>
          <p className="text-sm text-text-muted">{t('tasks.managementDesc')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setQuickOpen(true)}>{t('tasks.quickAssociate')}</Button>
          <Button onClick={() => setCreateOpen(true)}>{t('tasks.newTask')}</Button>
        </div>
      </div>

      <div className="glass-light rounded-xl p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t('tasks.searchPlaceholder')}
            className="md:max-w-sm"
          />
          <Select value={taskType} onValueChange={(value) => setTaskType(value as TaskType | 'all')}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue>
                {(value: TaskType | 'all' | null) => value && value !== 'all' ? protocolLabel(value) : t('tasks.allTypes')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('tasks.allTypes')}</SelectItem>
              <SelectItem value="icmp">{protocolLabel('icmp')}</SelectItem>
              <SelectItem value="tcp">{protocolLabel('tcp')}</SelectItem>
              <SelectItem value="mtr">{protocolLabel('mtr')}</SelectItem>
              <SelectItem value="iperf3">{protocolLabel('iperf3')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void tasksQuery.refetch()}>{t('tasks.refresh')}</Button>
        </div>

        {tasksQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : tasksQuery.error ? (
          <div className="p-6 text-center text-sm text-red-400">{t('tasks.listFailed')}</div>
        ) : tasks.length === 0 ? (
          <div className="p-6 text-center text-sm text-text-muted">{t('tasks.emptyList')}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('tasks.type')}</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>{t('tasks.config')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('tasks.updatedAt')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.task_uuid} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-text-primary">
                    <div>{task.name}</div>
                    <div className="text-xs text-text-muted">{task.task_uuid}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border ${PROTOCOL_COLORS[task.task_type] ?? ''}`}>{protocolLabel(task.task_type)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    <div>{task.target?.name ?? task.target_uuid}</div>
                    <div className="font-[family-name:var(--font-mono)] text-xs text-text-muted">{task.target?.target}</div>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    <div>{task.agent?.name ?? task.agent_uuid}</div>
                    <div className="text-xs text-text-muted">{task.agent?.city ?? '-'}</div>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    <div>{t('tasks.intervalTimeout', { interval: task.interval, timeout: task.timeout })}</div>
                    <div className="text-xs text-text-muted">{task.port ? t('tasks.portValue', { port: task.port }) : t('tasks.packetValue', { count: task.packet_count })}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={task.is_enabled ? 'success' : 'inactive'}>
                      {task.is_enabled ? t('tasks.enabled') : t('tasks.stopped')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">{formatDateTime(task.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/app/monitoring/${task.task_uuid}`}>
                        <Button variant="ghost" size="sm">{t('tasks.viewData')}</Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => openEditTask(task)}>{t('common.edit')}</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTaskEnabled.mutate(
                          { uuid: task.task_uuid, enabled: !task.is_enabled },
                          { onError: (error) => toast.error(error.message || t('tasks.statusUpdateFailed')) },
                        )}
                      >
                        {task.is_enabled ? t('tasks.stopped') : t('tasks.enabled')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => setDeleteTaskUuid(task.task_uuid)}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('tasks.createDialogTitle')}</DialogTitle>
            <DialogDescription>{t('tasks.createDialogDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="mt-2 flex min-h-0 flex-col">
            <div aria-label={t('tasks.formAria')} className="max-h-[calc(92vh-12rem)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-bg-surface-light px-4">
              <FieldRow label={t('tasks.taskName')} description={t('tasks.nameOptionalDesc')} htmlFor="task-create-name">
                <Input id="task-create-name" placeholder={t('tasks.nameOptionalPlaceholder')} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </FieldRow>
              <FieldRow label="Target" description={t('tasks.targetDesc')}>
                <Select value={form.target_uuid} onValueChange={(value) => {
                  const target = targets.find((item) => item.target_uuid === value)
                  const nextTypes = protocolOptionsForTarget(target)
                  const nextType = nextTypes.includes(form.task_type) ? form.task_type : nextTypes[0]
                  setForm({ ...formWithProtocolDefaults(form, nextType), target_uuid: value ?? '' })
                }}>
                  <SelectTrigger aria-label="Target" className="w-full">
                    <SelectValue>
                      {() => targetOptionLabel(selectedTarget, t('tasks.selectTarget'), form.target_uuid)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((target) => (
                      <SelectItem key={target.target_uuid} value={target.target_uuid}>{target.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="Agent" description={t('tasks.agentDesc')}>
                <Select value={form.agent_uuid} onValueChange={(value) => setForm({ ...form, agent_uuid: value ?? '' })}>
                  <SelectTrigger aria-label="Agent" className="w-full">
                    <SelectValue>
                      {() => agentOptionLabel(selectedAgent, t('tasks.selectAgent'), form.agent_uuid)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.agent_uuid} value={agent.agent_uuid}>{agent.name} - {agent.city || agent.country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label={t('tasks.protocolType')} description={t('tasks.protocolDesc')}>
                <Select value={form.task_type} onValueChange={(value) => setForm(formWithProtocolDefaults(form, value as TaskType))}>
                  <SelectTrigger aria-label={t('tasks.protocolType')} className="w-full">
                    <SelectValue>
                      {(value: TaskType | null) => value ? protocolLabel(value) : t('tasks.selectProtocol')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableTaskTypes.map((type) => (
                      <SelectItem key={type} value={type}>{protocolLabel(type)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label={t('tasks.ipFamily')} description={t('tasks.ipFamilyDesc')}>
                <Select value={form.ip_family} onValueChange={(value) => setForm({ ...form, ip_family: value as IpFamily })}>
                  <SelectTrigger aria-label={t('tasks.ipFamily')} className="w-full">
                    <SelectValue>
                      {(value: IpFamily | null) => ipFamilyLabel(value)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">IPv4</SelectItem>
                    <SelectItem value="6">IPv6</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>
              <ProtocolFields mode="create" value={form} onChange={setForm} />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={!form.target_uuid || !form.agent_uuid || createTask.isPending}>
                {createTask.isPending ? t('tasks.creatingShort') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={quickOpen} onOpenChange={(open) => {
        if (open) setQuickOpen(true)
        else resetQuickAssociate()
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('tasks.quickAssociate')}</DialogTitle>
            <DialogDescription>{t('tasks.quickDialogDesc')}</DialogDescription>
          </DialogHeader>
          <div aria-label={t('tasks.quickFormAria')} className="divide-y divide-border rounded-lg border border-border bg-bg-surface-light px-4">
            <FieldRow label="Target" description={t('tasks.quickTargetDesc')}>
              <Select value={quickTargetUuid} onValueChange={(value) => setQuickTargetUuid(value ?? '')}>
                <SelectTrigger aria-label="Target" className="w-full">
                  <SelectValue>
                    {() => targetOptionLabel(selectedQuickTarget, t('tasks.selectTarget'), quickTargetUuid)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {targets.map((target) => (
                    <SelectItem key={target.target_uuid} value={target.target_uuid}>{target.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Agent" description={t('tasks.quickAgentDesc')}>
              <Select value={quickAgentUuid} onValueChange={(value) => setQuickAgentUuid(value ?? '')}>
                <SelectTrigger aria-label="Agent" className="w-full">
                  <SelectValue>
                    {() => agentOptionLabel(selectedQuickAgent, t('tasks.selectAgent'), quickAgentUuid)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.agent_uuid} value={agent.agent_uuid}>{agent.name} - {agent.city || agent.country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <div className="py-3">
              <QuickAssociateFields
                taskTypesLabel={t('tasks.quickTaskTypes')}
                taskTypesDescription={t('tasks.quickTaskTypesDesc')}
                ipFamiliesLabel={t('tasks.quickIpFamilies')}
                ipFamiliesDescription={t('tasks.quickIpFamiliesDesc')}
                emptyTaskTypesMessage={t('tasks.quickNoTaskTypes')}
                emptyIpFamiliesMessage={t('tasks.quickNoCompatibleIpFamilies')}
                taskTypeOptions={quickTaskTypeOptions}
                selectedTaskTypes={clampedQuickTaskTypes}
                onToggleTaskType={(taskType) => setSelectedQuickTaskTypes(toggleQuickAssociateTaskType(clampedQuickTaskTypes, taskType, quickTaskTypeOptions))}
                ipFamilyOptions={quickIpFamilyOptions}
                selectedIpFamilies={clampedQuickIpFamilies}
                onToggleIpFamily={(family) => setSelectedQuickIpFamilies(toggleQuickAssociateIpFamily(clampedQuickIpFamilies, family, quickIpFamilyOptions))}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={resetQuickAssociate}>{t('common.cancel')}</Button>
            <Button disabled={!quickTargetUuid || !quickAgentUuid || clampedQuickTaskTypes.length === 0 || clampedQuickIpFamilies.length === 0 || quickAssociate.isPending} onClick={handleQuickAssociate}>
              {quickAssociate.isPending ? t('tasks.associating') : t('tasks.associate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTask} onOpenChange={(open) => { if (!open) setEditTask(null) }}>
        <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('tasks.editDialogTitle')}</DialogTitle>
            <DialogDescription>{t('tasks.editDialogDesc')}</DialogDescription>
          </DialogHeader>
          {editTask && (
            <form onSubmit={handleEdit} className="flex min-h-0 flex-col">
              <div aria-label={t('tasks.formAria')} className="max-h-[calc(92vh-12rem)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-bg-surface-light px-4">
                <FieldRow label={t('tasks.taskName')} description={t('tasks.nameEditDesc')} htmlFor="task-edit-name">
                  <Input id="task-edit-name" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} placeholder={t('tasks.taskName')} />
                </FieldRow>
                <FieldRow label="Target" description={t('tasks.targetDesc')}>
                  <Select value={editForm.target_uuid} onValueChange={(value) => setEditForm({ ...editForm, target_uuid: value ?? '' })}>
                    <SelectTrigger aria-label="Target" className="w-full">
                      <SelectValue>
                        {() => targetOptionLabel(selectedEditTarget, t('tasks.selectTarget'), editForm.target_uuid)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {targets.map((target) => (
                        <SelectItem key={target.target_uuid} value={target.target_uuid}>{target.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedEditTarget && !protocolOptionsForTarget(selectedEditTarget).includes(editTask.task_type) && (
                    <p className="mt-1 text-xs text-red-400">{t('tasks.targetUnsupported', { protocol: protocolLabel(editTask.task_type) })}</p>
                  )}
                </FieldRow>
                <FieldRow label="Agent" description={t('tasks.agentDesc')}>
                  <Select value={editForm.agent_uuid} onValueChange={(value) => setEditForm({ ...editForm, agent_uuid: value ?? '' })}>
                    <SelectTrigger aria-label="Agent" className="w-full">
                      <SelectValue>
                        {() => agentOptionLabel(selectedEditAgent, t('tasks.selectAgent'), editForm.agent_uuid)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.agent_uuid} value={agent.agent_uuid}>{agent.name} - {agent.city || agent.country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label={t('tasks.protocolType')} description={t('tasks.editProtocolDesc')}>
                  <Badge className={`inline-flex h-9 items-center justify-center border px-3 ${PROTOCOL_COLORS[editTask.task_type] ?? ''}`}>
                    {protocolLabel(editTask.task_type)}
                  </Badge>
                </FieldRow>
                <FieldRow label={t('tasks.ipFamily')} description={t('tasks.ipFamilyEditDesc')}>
                  <Select value={editForm.ip_family} onValueChange={(value) => setEditForm({ ...editForm, ip_family: value as IpFamily })}>
                    <SelectTrigger aria-label={t('tasks.ipFamily')} className="w-full">
                      <SelectValue>
                        {(value: IpFamily | null) => ipFamilyLabel(value)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">IPv4</SelectItem>
                      <SelectItem value="6">IPv6</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
                <ProtocolFields mode="edit" value={editForm} onChange={setEditForm} />
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setEditTask(null)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={!editForm.target_uuid || !editForm.agent_uuid || updateTask.isPending}>
                  {updateTask.isPending ? t('tasks.savingShort') : t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTaskUuid} onOpenChange={(open) => { if (!open) setDeleteTaskUuid(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tasks.deleteDialogTitle')}</DialogTitle>
            <DialogDescription>{t('tasks.deleteDialogDesc', { name: taskToDelete?.name ?? deleteTaskUuid })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTaskUuid(null)}>{t('common.cancel')}</Button>
            <Button
              variant="destructive"
              disabled={deleteTask.isPending}
              onClick={() => {
                if (!deleteTaskUuid) return
                deleteTask.mutate(deleteTaskUuid, {
                  onSuccess: () => {
                    toast.success(t('tasks.deletedToast'))
                    setDeleteTaskUuid(null)
                  },
                  onError: (error) => toast.error(error.message || t('tasks.deleteError')),
                })
              }}
            >
              {deleteTask.isPending ? t('tasks.deletingShort') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

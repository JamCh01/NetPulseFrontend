import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import {
  type AdminTask,
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
import { buildTaskPayload, formatDateTime, protocolOptionsForTarget } from '@/features/admin/utils'
import { PROTOCOL_COLORS, ipFamilyLabel, protocolLabel } from '@/lib/constants'

type Iperf3Mode = 'single_thread' | 'multi_thread'
type MtrProbeProtocol = 'icmp_echo' | 'tcp' | 'udp'

interface TargetOptionSummary {
  name: string
  target: string
}

interface AgentOptionSummary {
  name: string
  city?: string | null
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
  const prefix = mode === 'create' ? 'task-create' : 'task-edit'
  const taskType = value.task_type
  const setValue = (patch: Partial<TaskFormState>) => onChange({ ...value, ...patch })

  if (taskType === 'iperf3') {
    return (
      <>
        <SectionHeader
          title="IPERF3 参数"
          description="IPERF3 每天定时执行一次，包含上传和下载两个动作；结果存储在 PostgreSQL。"
        />
        <FieldRow label="端口" description="IPERF3 server 监听端口，默认 5201。" htmlFor={`${prefix}-port`}>
          <Input id={`${prefix}-port`} aria-label="端口" type="number" min="1" max="65535" placeholder="端口" value={value.port} onChange={(event) => setValue({ port: event.target.value })} />
        </FieldRow>
        <FieldRow label="iperf3 线程模式" description="单线程用于基线测试，8 线程用于模拟多连接吞吐能力。">
          <Select value={value.iperf3_mode} onValueChange={(nextMode) => setValue({ iperf3_mode: nextMode as Iperf3Mode })}>
            <SelectTrigger aria-label="iperf3 线程模式" className="w-full">
              <SelectValue>
                {(selectedMode: Iperf3Mode | null) => selectedMode ? iperf3ModeLabel(selectedMode) : '选择线程模式'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single_thread">单线程</SelectItem>
              <SelectItem value="multi_thread">8 线程</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="iperf3 执行时长" description="单次上传和下载动作各自运行的秒数，后端五分钟 claim 窗口覆盖两段动作。" htmlFor={`${prefix}-iperf3-duration`}>
          <Input id={`${prefix}-iperf3-duration`} aria-label="iperf3 执行时长" type="number" min="1" placeholder="执行秒数" value={value.iperf3_duration} onChange={(event) => setValue({ iperf3_duration: event.target.value })} />
        </FieldRow>
      </>
    )
  }

  if (taskType === 'tcp') {
    return (
      <>
        <SectionHeader
          title="TCP 参数"
          description="TCP connect 探测按分钟级周期执行，用于观察端口连通性、连接耗时、抖动和丢包。"
        />
        <FieldRow label="调度间隔" description="TCP 任务按秒调度，最小 60 秒；建议保持与监控图表最小粒度一致。" htmlFor={`${prefix}-interval`}>
          <Input id={`${prefix}-interval`} type="number" min="60" placeholder="间隔秒" value={value.interval} onChange={(event) => setValue({ interval: event.target.value })} />
        </FieldRow>
        <FieldRow label="超时时间" description="单次 TCP connect 尝试允许等待的毫秒数。" htmlFor={`${prefix}-timeout`}>
          <Input id={`${prefix}-timeout`} type="number" min="1000" placeholder="超时毫秒" value={value.timeout} onChange={(event) => setValue({ timeout: event.target.value })} />
        </FieldRow>
        <FieldRow label="采样次数" description="每次调度执行的 TCP connect 采样次数，用于计算平均值、最小值、最大值和 jitter。" htmlFor={`${prefix}-packet-count`}>
          <Input id={`${prefix}-packet-count`} aria-label="包数量" type="number" min="1" placeholder="采样次数" value={value.packet_count} onChange={(event) => setValue({ packet_count: event.target.value })} />
        </FieldRow>
        <FieldRow label="端口" description="TCP connect 探测的目标端口，默认 443。" htmlFor={`${prefix}-port`}>
          <Input id={`${prefix}-port`} aria-label="端口" type="number" min="1" max="65535" placeholder="端口" value={value.port} onChange={(event) => setValue({ port: event.target.value })} />
        </FieldRow>
        <FieldRow label="载荷大小" description="后端会保存并校验该值；当前 TCP connect 探测不实际发送 payload。" htmlFor={`${prefix}-payload-size`}>
          <Input id={`${prefix}-payload-size`} aria-label="载荷大小" type="number" min="1" max="65507" placeholder="字节" value={value.payload_size} onChange={(event) => setValue({ payload_size: event.target.value })} />
        </FieldRow>
      </>
    )
  }

  if (taskType === 'mtr') {
    return (
      <>
        <SectionHeader
          title="MTR 参数"
          description="MTR 按跳存储 packet_loss_pct、avg_ms、best_ms、worst_ms，用于定位路径质量变化。"
        />
        <div className="grid gap-3 py-3 md:grid-cols-2">
          <CompactField label="调度间隔" description="秒，最小 60。" htmlFor={`${prefix}-interval`}>
            <Input id={`${prefix}-interval`} type="number" min="60" placeholder="间隔秒" value={value.interval} onChange={(event) => setValue({ interval: event.target.value })} />
          </CompactField>
          <CompactField label="超时时间" description="毫秒，覆盖完整路径探测。" htmlFor={`${prefix}-timeout`}>
            <Input id={`${prefix}-timeout`} type="number" min="1000" placeholder="超时毫秒" value={value.timeout} onChange={(event) => setValue({ timeout: event.target.value })} />
          </CompactField>
          <CompactField label="包数量" description="对应 mtr -c。" htmlFor={`${prefix}-packet-count`}>
            <Input id={`${prefix}-packet-count`} type="number" min="1" placeholder="包数量" value={value.packet_count} onChange={(event) => setValue({ packet_count: event.target.value })} />
          </CompactField>
          <CompactField label="MTR 探测协议" description="ICMP Echo、TCP 或 UDP。">
            <Select value={value.mtr_probe_protocol} onValueChange={(protocol) => {
              const nextProtocol = protocol as MtrProbeProtocol
              setValue({
                mtr_probe_protocol: nextProtocol,
                port: nextProtocol === 'icmp_echo' ? '' : value.port || '443',
              })
            }}>
              <SelectTrigger aria-label="MTR 探测协议" className="w-full">
                <SelectValue>
                  {(protocol: MtrProbeProtocol | null) => protocol ? mtrProbeProtocolLabel(protocol) : '选择 MTR 探测协议'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="icmp_echo">ICMP Echo</SelectItem>
                <SelectItem value="tcp">TCP</SelectItem>
                <SelectItem value="udp">UDP</SelectItem>
              </SelectContent>
            </Select>
          </CompactField>
          <CompactField label="最大跳数" description="对应 mtr -m，1-255。" htmlFor={`${prefix}-mtr-max-hops`}>
            <Input id={`${prefix}-mtr-max-hops`} aria-label="最大跳数" type="number" min="1" max="255" placeholder="最大跳数" value={value.mtr_max_hops} onChange={(event) => setValue({ mtr_max_hops: event.target.value })} />
          </CompactField>
          <CompactField label="载荷大小" description="字节，对应 mtr -s。" htmlFor={`${prefix}-payload-size`}>
            <Input id={`${prefix}-payload-size`} aria-label="载荷大小" type="number" min="1" max="65507" placeholder="字节" value={value.payload_size} onChange={(event) => setValue({ payload_size: event.target.value })} />
          </CompactField>
          {(value.mtr_probe_protocol === 'tcp' || value.mtr_probe_protocol === 'udp') && (
            <CompactField label="端口" description="对应 mtr -P。" htmlFor={`${prefix}-port`}>
              <Input id={`${prefix}-port`} aria-label="端口" type="number" min="1" max="65535" placeholder="端口" value={value.port} onChange={(event) => setValue({ port: event.target.value })} />
            </CompactField>
          )}
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-bg-surface px-3 py-2 md:col-span-2">
            <div className="min-w-0">
              <Label className="text-xs font-medium text-text-primary">启用 MTR 重试</Label>
              <p className="mt-0.5 text-[11px] leading-snug text-text-muted">丢包超过阈值时按冷却时间触发重试。</p>
            </div>
            <ToggleSwitch
              checked={value.mtr_retry_enabled}
              onChange={(checked) => setValue({ mtr_retry_enabled: checked })}
              aria-label="启用 MTR 重试"
              labelLeft="关"
              labelRight="开"
            />
          </div>
        </div>
        {value.mtr_retry_enabled && (
          <div className="grid gap-3 border-t border-border py-3 md:grid-cols-3">
            <CompactField label="丢包阈值" description="百分比，0-100。" htmlFor={`${prefix}-mtr-loss-threshold`}>
              <Input id={`${prefix}-mtr-loss-threshold`} aria-label="重试丢包阈值" type="number" min="0" max="100" step="0.1" placeholder="百分比" value={value.mtr_loss_threshold_pct} onChange={(event) => setValue({ mtr_loss_threshold_pct: event.target.value })} />
            </CompactField>
            <CompactField label="冷却时间" description="秒，非负。" htmlFor={`${prefix}-mtr-cooldown`}>
              <Input id={`${prefix}-mtr-cooldown`} aria-label="重试冷却时间" type="number" min="0" placeholder="秒" value={value.mtr_cooldown_duration_sec} onChange={(event) => setValue({ mtr_cooldown_duration_sec: event.target.value })} />
            </CompactField>
            <CompactField label="最大重试次数" description="0 表示不追加。" htmlFor={`${prefix}-mtr-max-retry`}>
              <Input id={`${prefix}-mtr-max-retry`} aria-label="最大重试次数" type="number" min="0" placeholder="次数" value={value.mtr_max_retry_count} onChange={(event) => setValue({ mtr_max_retry_count: event.target.value })} />
            </CompactField>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <SectionHeader
        title="ICMP 参数"
        description="ICMP ping 探测按分钟级周期执行，用于观察延迟、最小值、最大值、jitter 和丢包。"
      />
      <FieldRow label="调度间隔" description="ICMP 任务按秒调度，最小 60 秒；建议保持与监控图表最小粒度一致。" htmlFor={`${prefix}-interval`}>
        <Input id={`${prefix}-interval`} type="number" min="60" placeholder="间隔秒" value={value.interval} onChange={(event) => setValue({ interval: event.target.value })} />
      </FieldRow>
      <FieldRow label="超时时间" description="单个 ICMP echo request 允许等待的毫秒数。" htmlFor={`${prefix}-timeout`}>
        <Input id={`${prefix}-timeout`} type="number" min="1000" placeholder="超时毫秒" value={value.timeout} onChange={(event) => setValue({ timeout: event.target.value })} />
      </FieldRow>
      <FieldRow label="包数量" description="每次调度发送的 ICMP 包数量，用于计算平均值、最小值、最大值和丢包率。" htmlFor={`${prefix}-packet-count`}>
        <Input id={`${prefix}-packet-count`} type="number" min="1" placeholder="包数量" value={value.packet_count} onChange={(event) => setValue({ packet_count: event.target.value })} />
      </FieldRow>
      <FieldRow label="载荷大小" description="对应 ping -s，后端允许 1 到 65507 字节，默认 64。" htmlFor={`${prefix}-payload-size`}>
        <Input id={`${prefix}-payload-size`} aria-label="载荷大小" type="number" min="1" max="65507" placeholder="字节" value={value.payload_size} onChange={(event) => setValue({ payload_size: event.target.value })} />
      </FieldRow>
      <FieldRow label="TTL" description="可选。填写后对应 ping -t；为空则不限制 TTL。" htmlFor={`${prefix}-ttl`}>
        <Input id={`${prefix}-ttl`} aria-label="TTL" type="number" min="1" placeholder="不设置" value={value.ttl} onChange={(event) => setValue({ ttl: event.target.value })} />
      </FieldRow>
      <FieldRow label="禁止分片" description="后端会保存 dont_fragment；当前 Agent ping 命令尚未使用该字段。">
        <ToggleSwitch
          checked={value.dont_fragment}
          onChange={(checked) => setValue({ dont_fragment: checked })}
          aria-label="禁止分片"
          labelLeft="关闭"
          labelRight="开启"
        />
      </FieldRow>
    </>
  )
}

function iperf3ModeLabel(mode: Iperf3Mode): string {
  return mode === 'multi_thread' ? '8 线程' : '单线程'
}

function targetOptionLabel(target: TargetOptionSummary | null | undefined, fallback?: string | null): string {
  if (!target) return fallback || '选择 Target'
  return `${target.name} - ${target.target}`
}

function agentOptionLabel(agent: AgentOptionSummary | null | undefined, fallback?: string | null): string {
  if (!agent) return fallback || '选择 Agent'
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

export default function TasksPage() {
  const [keyword, setKeyword] = useState('')
  const [taskType, setTaskType] = useState<TaskType | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [editTask, setEditTask] = useState<AdminTask | null>(null)
  const [editForm, setEditForm] = useState<TaskFormState>(() => initialTaskForm())
  const [deleteTaskUuid, setDeleteTaskUuid] = useState<string | null>(null)
  const [quickTargetUuid, setQuickTargetUuid] = useState('')
  const [quickAgentUuid, setQuickAgentUuid] = useState('')
  const [form, setForm] = useState<TaskFormState>(() => initialTaskForm())

  const tasksQuery = useTasks({ keyword, task_type: taskType, sort_by: 'name', sort_order: 'asc' })
  const targetsQuery = useTargets({ page_size: 200, sort_by: 'name', sort_order: 'asc', is_enabled: true })
  const agentsQuery = useAgents({ page_size: 200, sort_by: 'name', sort_order: 'asc', is_enabled: true })
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
    })
    createTask.mutate(payload, {
      onSuccess: () => {
        toast.success('Task 已创建')
        setCreateOpen(false)
        resetCreateForm()
      },
      onError: (error) => toast.error(error.message || '创建 Task 失败'),
    })
  }

  const openEditTask = (task: AdminTask) => {
    const probeConfig = task.probe_config ?? {}
    const mode = probeConfig.mode === 'multi_thread' ? 'multi_thread' : 'single_thread'
    const durationSec = typeof probeConfig.duration_sec === 'number' ? probeConfig.duration_sec : 10
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
        toast.success('Task 已更新')
        setEditTask(null)
      },
      onError: (error) => toast.error(error.message || '更新失败'),
    })
  }

  const handleQuickAssociate = () => {
    if (!quickTargetUuid || !quickAgentUuid) return
    quickAssociate.mutate({
      target_uuid: quickTargetUuid,
      agent_uuid: quickAgentUuid,
    }, {
      onSuccess: (createdTasks) => {
        toast.success(`快速关联完成，创建或复用 ${createdTasks.length} 个任务`)
        setQuickOpen(false)
        setQuickTargetUuid('')
        setQuickAgentUuid('')
      },
      onError: (error) => toast.error(error.message || '快速关联失败'),
    })
  }

  const taskToDelete = deleteTaskUuid ? tasks.find((task) => task.task_uuid === deleteTaskUuid) : null

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Task 管理</h1>
          <p className="text-sm text-text-muted">通过 /api/v1/tasks/* 管理任务，使用 /api/v1/relations/quick-associate 批量建立 Target 与 Agent 关系。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setQuickOpen(true)}>快速关联</Button>
          <Button onClick={() => setCreateOpen(true)}>新增 Task</Button>
        </div>
      </div>

      <div className="glass-light rounded-xl p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="按名称、Target、Agent 搜索"
            className="md:max-w-sm"
          />
          <Select value={taskType} onValueChange={(value) => setTaskType(value as TaskType | 'all')}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue>
                {(value: TaskType | 'all' | null) => value && value !== 'all' ? protocolLabel(value) : '全部类型'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="icmp">{protocolLabel('icmp')}</SelectItem>
              <SelectItem value="tcp">{protocolLabel('tcp')}</SelectItem>
              <SelectItem value="mtr">{protocolLabel('mtr')}</SelectItem>
              <SelectItem value="iperf3">{protocolLabel('iperf3')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void tasksQuery.refetch()}>刷新</Button>
        </div>

        {tasksQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : tasksQuery.error ? (
          <div className="p-6 text-center text-sm text-red-400">Task 列表加载失败</div>
        ) : tasks.length === 0 ? (
          <div className="p-6 text-center text-sm text-text-muted">暂无 Task</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>配置</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead>操作</TableHead>
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
                    <div>{task.interval}s / timeout {task.timeout}ms</div>
                    <div className="text-xs text-text-muted">{task.port ? `port ${task.port}` : `packet ${task.packet_count}`}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={task.is_enabled ? 'success' : 'inactive'}>
                      {task.is_enabled ? '启用' : '停用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">{formatDateTime(task.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/app/monitoring/${task.task_uuid}`}>
                        <Button variant="ghost" size="sm">查看数据</Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => openEditTask(task)}>编辑</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTaskEnabled.mutate(
                          { uuid: task.task_uuid, enabled: !task.is_enabled },
                          { onError: (error) => toast.error(error.message || '状态更新失败') },
                        )}
                      >
                        {task.is_enabled ? '停用' : '启用'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => setDeleteTaskUuid(task.task_uuid)}
                      >
                        删除
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
            <DialogTitle>新增 Task</DialogTitle>
            <DialogDescription>Task 必须绑定一个 Target 和一个 Agent，协议需被 Target 支持。</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="mt-2 flex min-h-0 flex-col">
            <div aria-label="任务配置" className="max-h-[calc(92vh-12rem)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-bg-surface-light px-4">
              <FieldRow label="任务名称" description="可选。为空时后端会按 Agent、Target、协议和 IP 协议族生成默认名称。" htmlFor="task-create-name">
                <Input id="task-create-name" placeholder="任务名称，可为空" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </FieldRow>
              <FieldRow label="Target" description="选择要探测的目标。协议列表会跟随 Target 的 supported_protocols 自动限制。">
                <Select value={form.target_uuid} onValueChange={(value) => {
                  const target = targets.find((item) => item.target_uuid === value)
                  const nextTypes = protocolOptionsForTarget(target)
                  const nextType = nextTypes.includes(form.task_type) ? form.task_type : nextTypes[0]
                  setForm({ ...formWithProtocolDefaults(form, nextType), target_uuid: value ?? '' })
                }}>
                  <SelectTrigger aria-label="Target" className="w-full">
                    <SelectValue>
                      {() => targetOptionLabel(selectedTarget, form.target_uuid)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((target) => (
                      <SelectItem key={target.target_uuid} value={target.target_uuid}>{target.name} - {target.target}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="Agent" description="选择实际执行任务的节点。任务会下发到该 Agent 的调度器。">
                <Select value={form.agent_uuid} onValueChange={(value) => setForm({ ...form, agent_uuid: value ?? '' })}>
                  <SelectTrigger aria-label="Agent" className="w-full">
                    <SelectValue>
                      {() => agentOptionLabel(selectedAgent, form.agent_uuid)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.agent_uuid} value={agent.agent_uuid}>{agent.name} - {agent.city || agent.country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="协议类型" description="支持 ICMP、TCP、MTR、IPERF3。IPERF3 每天定时执行一次，结果存储在 PostgreSQL。">
                <Select value={form.task_type} onValueChange={(value) => setForm(formWithProtocolDefaults(form, value as TaskType))}>
                  <SelectTrigger aria-label="协议类型" className="w-full">
                    <SelectValue>
                      {(value: TaskType | null) => value ? protocolLabel(value) : '选择协议类型'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableTaskTypes.map((type) => (
                      <SelectItem key={type} value={type}>{protocolLabel(type)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="IP 协议族" description="选择 Agent 探测时使用 IPv4 或 IPv6。Target 和 Agent 需要具备对应连通性。">
                <Select value={form.ip_family} onValueChange={(value) => setForm({ ...form, ip_family: value as IpFamily })}>
                  <SelectTrigger aria-label="IP 协议族" className="w-full">
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
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
              <Button type="submit" disabled={!form.target_uuid || !form.agent_uuid || createTask.isPending}>
                {createTask.isPending ? '创建中' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>快速关联</DialogTitle>
            <DialogDescription>选择一个 Target 和一个 Agent，由后端自动创建该关系下的默认任务。</DialogDescription>
          </DialogHeader>
          <div aria-label="快速关联配置" className="divide-y divide-border rounded-lg border border-border bg-bg-surface-light px-4">
            <FieldRow label="Target" description="选择要快速关联的目标。后端会按目标支持协议生成默认任务。">
              <Select value={quickTargetUuid} onValueChange={(value) => setQuickTargetUuid(value ?? '')}>
                <SelectTrigger aria-label="Target" className="w-full">
                  <SelectValue>
                    {() => targetOptionLabel(selectedQuickTarget, quickTargetUuid)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {targets.map((target) => (
                    <SelectItem key={target.target_uuid} value={target.target_uuid}>{target.name} - {target.target}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Agent" description="选择执行默认任务的 Agent。关联后会触发任务快照同步。">
              <Select value={quickAgentUuid} onValueChange={(value) => setQuickAgentUuid(value ?? '')}>
                <SelectTrigger aria-label="Agent" className="w-full">
                  <SelectValue>
                    {() => agentOptionLabel(selectedQuickAgent, quickAgentUuid)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.agent_uuid} value={agent.agent_uuid}>{agent.name} - {agent.city || agent.country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setQuickOpen(false)}>取消</Button>
            <Button disabled={!quickTargetUuid || !quickAgentUuid || quickAssociate.isPending} onClick={handleQuickAssociate}>
              {quickAssociate.isPending ? '关联中' : '关联'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTask} onOpenChange={(open) => { if (!open) setEditTask(null) }}>
        <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>编辑 Task</DialogTitle>
            <DialogDescription>可修改任务名称、绑定关系、IP 协议族、调度参数和协议相关 probe_config；任务类型保持不变。</DialogDescription>
          </DialogHeader>
          {editTask && (
            <form onSubmit={handleEdit} className="flex min-h-0 flex-col">
              <div aria-label="任务配置" className="max-h-[calc(92vh-12rem)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-bg-surface-light px-4">
                <FieldRow label="任务名称" description="可选。留空保存时后端会按当前绑定关系和协议重新生成默认名称。" htmlFor="task-edit-name">
                  <Input id="task-edit-name" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} placeholder="任务名称" />
                </FieldRow>
                <FieldRow label="Target" description="修改 Target 会重新校验该目标是否支持当前任务协议。">
                  <Select value={editForm.target_uuid} onValueChange={(value) => setEditForm({ ...editForm, target_uuid: value ?? '' })}>
                    <SelectTrigger aria-label="Target" className="w-full">
                      <SelectValue>
                        {() => targetOptionLabel(selectedEditTarget, editForm.target_uuid)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {targets.map((target) => (
                        <SelectItem key={target.target_uuid} value={target.target_uuid}>{target.name} - {target.target}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedEditTarget && !protocolOptionsForTarget(selectedEditTarget).includes(editTask.task_type) && (
                    <p className="mt-1 text-xs text-red-400">当前 Target 未声明支持 {protocolLabel(editTask.task_type)}。</p>
                  )}
                </FieldRow>
                <FieldRow label="Agent" description="修改 Agent 后，后端会同步任务快照，让新的 Agent 开始执行。">
                  <Select value={editForm.agent_uuid} onValueChange={(value) => setEditForm({ ...editForm, agent_uuid: value ?? '' })}>
                    <SelectTrigger aria-label="Agent" className="w-full">
                      <SelectValue>
                        {() => agentOptionLabel(selectedEditAgent, editForm.agent_uuid)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.agent_uuid} value={agent.agent_uuid}>{agent.name} - {agent.city || agent.country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="协议类型" description="任务类型由创建时确定，IPERF3 每天定时执行一次。">
                  <Badge className={`inline-flex h-9 items-center justify-center border px-3 ${PROTOCOL_COLORS[editTask.task_type] ?? ''}`}>
                    {protocolLabel(editTask.task_type)}
                  </Badge>
                </FieldRow>
                <FieldRow label="IP 协议族" description="选择 Agent 探测时使用 IPv4 或 IPv6。">
                  <Select value={editForm.ip_family} onValueChange={(value) => setEditForm({ ...editForm, ip_family: value as IpFamily })}>
                    <SelectTrigger aria-label="IP 协议族" className="w-full">
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
                <Button type="button" variant="outline" onClick={() => setEditTask(null)}>取消</Button>
                <Button type="submit" disabled={!editForm.target_uuid || !editForm.agent_uuid || updateTask.isPending}>
                  {updateTask.isPending ? '保存中' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTaskUuid} onOpenChange={(open) => { if (!open) setDeleteTaskUuid(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除 Task</DialogTitle>
            <DialogDescription>确认软删除 {taskToDelete?.name ?? deleteTaskUuid}？删除后后端会重新发布 Agent 任务快照。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTaskUuid(null)}>取消</Button>
            <Button
              variant="destructive"
              disabled={deleteTask.isPending}
              onClick={() => {
                if (!deleteTaskUuid) return
                deleteTask.mutate(deleteTaskUuid, {
                  onSuccess: () => {
                    toast.success('Task 已删除')
                    setDeleteTaskUuid(null)
                  },
                  onError: (error) => toast.error(error.message || '删除失败'),
                })
              }}
            >
              {deleteTask.isPending ? '删除中' : '删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, useLocation } from 'react-router'
import { Download, ChevronDown } from 'lucide-react'
import { useMonitoringData, useMultiAgentMonitoringData } from '@/api/hooks/use-monitoring'
import { useMonitoringTaskDetail } from '@/api/hooks/use-monitoring-task-detail'
import { SmokePingChart } from '@/features/monitoring/components/smokeping-chart'
import { MultiAgentChart } from '@/features/monitoring/components/multi-agent-chart'
import { TimeRangeSelector } from '@/features/monitoring/components/time-range-selector'
import { getAgentColor } from '@/features/monitoring/lib/agent-colors'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import type { MonitoringDataPoint } from '@/api/generated/types.gen'
import { PROTOCOL_COLORS } from '@/lib/constants'

const INITIAL_DURATION_MS = 24 * 60 * 60 * 1000

function computeStats(data: MonitoringDataPoint[]) {
  if (data.length === 0) return null
  let sumMedian = 0, sumAvg = 0, sumLoss = 0
  let minRtt = Infinity, maxRtt = -Infinity
  let p95Sum = 0, p99Sum = 0

  for (const p of data) {
    sumMedian += p.median_rtt
    sumAvg += p.avg_rtt
    sumLoss += p.packet_loss_pct
    if (p.min_rtt < minRtt) minRtt = p.min_rtt
    if (p.max_rtt > maxRtt) maxRtt = p.max_rtt
    p95Sum += p.p95_rtt
    p99Sum += p.p99_rtt
  }

  const n = data.length
  return {
    median: sumMedian / n,
    avg: sumAvg / n,
    min: minRtt,
    max: maxRtt,
    p95: p95Sum / n,
    p99: p99Sum / n,
    loss: sumLoss / n,
    points: n,
  }
}

type ChartStyle = 'basic' | 'smoke'

export default function MonitoringDetailPage() {
  const { t } = useTranslation()
  const { taskUuid } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const monitoringBasePath = location.pathname.startsWith('/app/monitoring') ? '/app/monitoring' : '/monitoring'
  const { data: detailData, isLoading: taskLoading } = useMonitoringTaskDetail(taskUuid ?? '')

  const task = detailData?.task
  const taskAgents = useMemo(() => detailData?.taskAgents ?? [], [detailData?.taskAgents])

  const [selectedAgentUuid, setSelectedAgentUuid] = useState<string>('')
  const [chartStyle, setChartStyle] = useState<ChartStyle>('smoke')
  const isSmokeStyle = chartStyle === 'smoke'

  const [now] = useState(() => Date.now())
  const [timeRange, setTimeRange] = useState<{ start: number; end: number; granularity: 'raw' | 'hourly' | 'daily' }>({
    start: now - INITIAL_DURATION_MS,
    end: now,
    granularity: 'raw',
  })

  const isAllAgents = !selectedAgentUuid

  // Single agent mode
  const {
    data: singleMonitoringData,
    isLoading: singleLoading,
    error: singleError,
  } = useMonitoringData(taskUuid ?? '', selectedAgentUuid || undefined, {
    start: timeRange.start,
    end: timeRange.end,
  })

  // Multi agent mode
  const {
    agentSeries,
    isLoading: multiLoading,
    error: multiError,
  } = useMultiAgentMonitoringData(
    isAllAgents ? (taskUuid ?? '') : '',
    isAllAgents ? taskAgents : [],
    { start: timeRange.start, end: timeRange.end },
  )

  const handleExportCsv = useCallback(() => {
    if (!task) return

    let csv = ''
    const filename = `netpulse_${task.task_name}_${new Date().toISOString().slice(0, 10)}.csv`

    if (isAllAgents) {
      csv = 'Timestamp,Agent,Median (ms),Avg (ms),Min (ms),Max (ms),P95 (ms),P99 (ms),Loss (%)\n'
      for (const series of agentSeries) {
        for (const p of series.data) {
          csv += `${p.timestamp},"${series.agentName}",${p.median_rtt.toFixed(2)},${p.avg_rtt.toFixed(2)},${p.min_rtt.toFixed(2)},${p.max_rtt.toFixed(2)},${p.p95_rtt.toFixed(2)},${p.p99_rtt.toFixed(2)},${p.packet_loss_pct.toFixed(2)}\n`
        }
      }
    } else {
      const agent = taskAgents.find(a => a.agent_uuid === selectedAgentUuid)
      const data = singleMonitoringData?.data ?? []
      csv = 'Timestamp,Agent,Median (ms),Avg (ms),Min (ms),Max (ms),P95 (ms),P99 (ms),Loss (%)\n'
      for (const p of data) {
        csv += `${p.timestamp},"${agent?.agent_name ?? 'Unknown'}",${p.median_rtt.toFixed(2)},${p.avg_rtt.toFixed(2)},${p.min_rtt.toFixed(2)},${p.max_rtt.toFixed(2)},${p.p95_rtt.toFixed(2)},${p.p99_rtt.toFixed(2)},${p.packet_loss_pct.toFixed(2)}\n`
      }
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }, [task, isAllAgents, agentSeries, singleMonitoringData, selectedAgentUuid, taskAgents])

  const handleExportJson = useCallback(() => {
    if (!task) return
    const filename = `netpulse_${task.task_name}_${new Date().toISOString().slice(0, 10)}.json`
    const data = isAllAgents ? agentSeries : {
      agentName: taskAgents.find(a => a.agent_uuid === selectedAgentUuid)?.agent_name,
      data: singleMonitoringData?.data ?? []
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }, [task, isAllAgents, agentSeries, singleMonitoringData, selectedAgentUuid, taskAgents])

  const handleTimeRangeChange = useCallback(
    (range: { start: number; end: number; granularity: 'raw' | 'hourly' | 'daily' }) => {
      setTimeRange(range)
    },
    [],
  )

  if (taskLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (!task) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-6">{t('monitoring.title')}</h1>
        <div className="glass-light rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm">{t('monitoring.taskNotFound')}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(monitoringBasePath)}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(monitoringBasePath)}
            className="text-text-muted hover:text-text-primary transition-colors text-sm"
          >
            {t('monitoring.title')} /
          </button>
          <h1 className="text-2xl font-bold text-text-primary">{task.task_name}</h1>
          <Badge className={`border text-xs uppercase ${PROTOCOL_COLORS[task.protocol] ?? ''}`}>
            {task.protocol}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary font-[family-name:var(--font-mono)]">
            {task.target}{task.port ? `:${task.port}` : ''}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm font-medium shadow-sm hover:bg-white/5 hover:text-accent-foreground transition-colors outline-none cursor-pointer">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('monitoring.export')}</span>
              <ChevronDown className="w-3 h-3 text-text-dim" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleExportCsv} className="cursor-pointer">
                {t('monitoring.exportCsv')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJson} className="cursor-pointer">
                {t('monitoring.exportJson')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="text-sm"
            onClick={() => navigate(`${monitoringBasePath}/${task.task_uuid}/mtr`)}
          >
            MTR
          </Button>
          {isAdmin && (
            <Button
              className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none text-sm"
              onClick={() => navigate(`/tasks/${task.task_uuid}`)}
            >
              {t('tasks.manageTask')}
            </Button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{t('monitoring.agent')}:</span>
          <Select
            value={selectedAgentUuid}
            onValueChange={(val) => setSelectedAgentUuid(val ?? '')}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('monitoring.allAgents')}>
                {(value: string | null) => {
                  if (!value) return t('monitoring.allAgents')
                  const agent = taskAgents.find((a) => a.agent_uuid === value)
                  return agent?.agent_name ?? t('monitoring.allAgents')
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('monitoring.allAgents')}</SelectItem>
              {taskAgents.map((agent) => (
                <SelectItem key={agent.agent_uuid} value={agent.agent_uuid}>
                  {agent.agent_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ToggleSwitch
          checked={isSmokeStyle}
          onChange={(checked) => setChartStyle(checked ? 'smoke' : 'basic')}
          labelLeft={t('monitoring.chartStyleBasic')}
          labelRight={t('monitoring.chartStyleSmoke')}
        />
      </div>

      {/* Chart */}
      {isAllAgents ? (
        <MultiAgentChart
          agentSeries={agentSeries}
          isLoading={multiLoading}
          error={multiError}
          height={400}
          chartStyle={chartStyle}
        />
      ) : (
        <SmokePingChart
          data={singleMonitoringData?.data}
          isLoading={singleLoading}
          error={singleError as Error | null}
          agentName={taskAgents.find((a) => a.agent_uuid === selectedAgentUuid)?.agent_name}
          height={400}
          chartStyle={chartStyle}
        />
      )}

      {/* Per-agent stats table */}
      {isAllAgents && agentSeries.length > 0 && (
        <div className="mt-4 glass-light rounded-xl overflow-hidden">
          {/* Desktop Table */}
          <table className="hidden md:table w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">{t('monitoring.agent')}</th>
                <th className="text-right px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">{t('monitoring.median')}</th>
                <th className="text-right px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">{t('monitoring.avg')}</th>
                <th className="text-right px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">{t('monitoring.min')}</th>
                <th className="text-right px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">{t('monitoring.max')}</th>
                <th className="text-right px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">{t('monitoring.p95')}</th>
                <th className="text-right px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">{t('monitoring.p99')}</th>
                <th className="text-right px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">{t('monitoring.loss')}</th>
                <th className="text-right px-4 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">{t('monitoring.points')}</th>
              </tr>
            </thead>
            <tbody>
              {agentSeries.map((agent, i) => {
                const color = getAgentColor(i)
                const stats = computeStats(agent.data)
                if (!stats) return null

                return (
                  <tr key={agent.agentUuid} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-[3px] rounded-full shrink-0"
                          style={{ backgroundColor: color.line }}
                        />
                        <span className="text-xs text-text-primary font-medium">{agent.agentName}</span>
                      </div>
                    </td>
                    <td className="text-right px-3 py-2.5 text-[11px] font-mono" style={{ color: color.line }}>
                      {stats.median.toFixed(1)}ms
                    </td>
                    <td className="text-right px-3 py-2.5 text-[11px] text-text-secondary font-mono">
                      {stats.avg.toFixed(1)}ms
                    </td>
                    <td className="text-right px-3 py-2.5 text-[11px] text-text-secondary font-mono">
                      {stats.min.toFixed(1)}ms
                    </td>
                    <td className="text-right px-3 py-2.5 text-[11px] text-text-secondary font-mono">
                      {stats.max.toFixed(1)}ms
                    </td>
                    <td className="text-right px-3 py-2.5 text-[11px] text-text-secondary font-mono">
                      {stats.p95.toFixed(1)}ms
                    </td>
                    <td className="text-right px-3 py-2.5 text-[11px] text-text-secondary font-mono">
                      {stats.p99.toFixed(1)}ms
                    </td>
                    <td className={`text-right px-3 py-2.5 text-[11px] font-mono ${stats.loss > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {stats.loss.toFixed(1)}%
                    </td>
                    <td className="text-right px-4 py-2.5 text-[11px] text-text-dim font-mono">
                      {stats.points}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Mobile Card List */}
          <div className="md:hidden flex flex-col divide-y divide-white/5">
            {agentSeries.map((agent, i) => {
              const color = getAgentColor(i)
              const stats = computeStats(agent.data)
              if (!stats) return null

              return (
                <div key={agent.agentUuid} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-[3px] rounded-full shrink-0"
                        style={{ backgroundColor: color.line }}
                      />
                      <span className="text-sm text-text-primary font-medium">{agent.agentName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-text-muted">{t('monitoring.median')}</span>
                        <span className="text-xs font-mono font-medium" style={{ color: color.line }}>
                          {stats.median.toFixed(1)}ms
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-text-muted">{t('monitoring.loss')}</span>
                        <span className={`text-xs font-mono font-medium ${stats.loss > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {stats.loss.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <MobileStatItem label={t('monitoring.avg')} value={`${stats.avg.toFixed(1)}ms`} />
                    <MobileStatItem label={t('monitoring.min')} value={`${stats.min.toFixed(1)}ms`} />
                    <MobileStatItem label={t('monitoring.max')} value={`${stats.max.toFixed(1)}ms`} />
                    <MobileStatItem label={t('monitoring.points')} value={String(stats.points)} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Single agent stats */}
      {!isAllAgents && singleMonitoringData?.data && singleMonitoringData.data.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 glass-light rounded-xl px-4 py-3">
          {(() => {
            const stats = computeStats(singleMonitoringData.data)
            if (!stats) return null
            return (
              <>
                <StatItem label={t('monitoring.median')} value={`${stats.median.toFixed(1)}ms`} color="text-emerald-400" />
                <StatItem label={t('monitoring.avg')} value={`${stats.avg.toFixed(1)}ms`} />
                <StatItem label={t('monitoring.min')} value={`${stats.min.toFixed(1)}ms`} />
                <StatItem label={t('monitoring.max')} value={`${stats.max.toFixed(1)}ms`} />
                <StatItem label={t('monitoring.p95')} value={`${stats.p95.toFixed(1)}ms`} />
                <StatItem label={t('monitoring.p99')} value={`${stats.p99.toFixed(1)}ms`} />
                <StatItem
                  label={t('monitoring.loss')}
                  value={`${stats.loss.toFixed(1)}%`}
                  color={stats.loss > 0 ? 'text-red-400' : 'text-green-400'}
                />
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-text-muted">{label}</span>
      <span className={`text-[10px] font-[family-name:var(--font-mono)] font-medium ${color ?? 'text-text-primary'}`}>
        {value}
      </span>
    </div>
  )
}

function MobileStatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center bg-white/5 rounded-md py-1.5">
      <span className="text-[9px] text-text-muted">{label}</span>
      <span className="text-[10px] font-mono text-text-secondary mt-0.5">{value}</span>
    </div>
  )
}

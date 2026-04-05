import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useTasks } from '@/api/hooks/use-tasks'
import type { TaskResponse } from '@/api/generated/types.gen'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity } from 'lucide-react'

const protocolBadge: Record<string, { bg: string; text: string }> = {
  icmp: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  tcp: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  udp: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  http: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
}

export default function MonitoringIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, isLoading } = useTasks({ limit: 200 })
  const tasks = ((data as { items?: TaskResponse[] })?.items ?? []) as TaskResponse[]

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">{t('monitoring.title')}</h1>
      <p className="text-sm text-text-muted mb-6">{t('monitoring.selectTask')}</p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-light rounded-xl p-8 text-center">
          <p className="text-text-muted text-sm">{t('dashboard.noActiveTasks')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map((task) => {
            const proto = protocolBadge[task.protocol.toLowerCase()] ?? protocolBadge.icmp
            return (
              <div
                key={task.task_uuid}
                onClick={() => navigate(`/monitoring/${task.task_uuid}`)}
                className="glass-card rounded-xl p-4 cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Activity className={`w-4 h-4 ${proto.text}`} />
                  <span className="text-sm font-medium text-text-primary">{task.task_name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${proto.bg} ${proto.text}`}>
                    {task.protocol.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-text-muted font-mono">
                  {task.target}{task.port ? `:${task.port}` : ''}
                </div>
                <div className="text-[10px] text-text-dim mt-1">
                  {t('tasks.interval')}: {task.interval}s
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

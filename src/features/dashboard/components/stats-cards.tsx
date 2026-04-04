import { Skeleton } from '@/components/ui/skeleton'
import { useTranslation } from 'react-i18next'
import type { DashboardStats } from '@/api/types'

interface StatsCardsProps {
  stats?: DashboardStats
  isLoading: boolean
}

interface StatCardConfig {
  label: string
  getValue: (stats: DashboardStats) => number
  getSubtext: (stats: DashboardStats) => string
  dotColor: string
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const { t } = useTranslation()

  const cards: StatCardConfig[] = [
    {
      label: t('dashboard.onlineLabel'),
      getValue: (s) => s.agents.online,
      getSubtext: (s) => t('dashboard.onlineSub', { total: s.agents.total }),
      dotColor: 'bg-green-500',
    },
    {
      label: t('dashboard.offlineLabel'),
      getValue: (s) => s.agents.offline,
      getSubtext: () => t('dashboard.offlineSub'),
      dotColor: 'bg-gray-500',
    },
    {
      label: t('dashboard.activeTasksLabel'),
      getValue: (s) => s.tasks.active,
      getSubtext: (s) => t('dashboard.activeTasksSub', { total: s.tasks.total }),
      dotColor: 'bg-cyan-400',
    },
    {
      label: t('dashboard.disabledLabel'),
      getValue: (s) => s.agents.disabled,
      getSubtext: () => t('dashboard.disabledSub'),
      dotColor: 'bg-red-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="glass-light rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${card.dotColor}`} />
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
              {card.label}
            </span>
          </div>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-text-primary font-mono">
                {stats ? card.getValue(stats) : '--'}
              </div>
              <div className="text-[10px] text-text-dim mt-0.5">
                {stats ? card.getSubtext(stats) : ''}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

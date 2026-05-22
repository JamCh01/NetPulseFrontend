import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { ChevronDown, ChevronRight, Globe2, MapPin, Network, Server } from 'lucide-react'
import { useTargetGeoTree } from '@/api/hooks/use-target-geo-tree'
import { cn } from '@/lib/utils'
import { flattenTargetGeoTree, visibleTargetGeoRows } from '@/features/monitoring/lib/target-geo-tree'

interface TargetGeoSidebarTreeProps {
  basePath: '/monitoring' | '/app/monitoring'
  expanded: boolean
  onToggle: () => void
  compact?: boolean
}

function GroupIcon({ depth }: { depth: number }) {
  if (depth === 0) return <Globe2 className="h-3.5 w-3.5 shrink-0" />
  if (depth === 1) return <MapPin className="h-3.5 w-3.5 shrink-0" />
  return <Network className="h-3.5 w-3.5 shrink-0" />
}

export function TargetGeoSidebarTree({ basePath, expanded, onToggle, compact = false }: TargetGeoSidebarTreeProps) {
  const location = useLocation()
  const { data } = useTargetGeoTree()
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(() => new Set())
  const rows = useMemo(() => flattenTargetGeoTree(data), [data])
  const visibleRows = useMemo(() => visibleTargetGeoRows(rows, collapsedGroupIds), [collapsedGroupIds, rows])
  const targetCount = data?.total_target_count ?? rows.filter((row) => row.type === 'target').length
  const activeTargetUuid = new URLSearchParams(location.search).get('target_uuid')

  const toggleGroup = (id: string) => {
    setCollapsedGroupIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-3 rounded-lg font-medium transition-colors w-full',
          compact ? 'px-3 py-2 text-xs' : 'px-3 py-2.5 text-sm',
          location.pathname.startsWith(basePath)
            ? 'bg-accent text-accent-foreground'
            : 'text-text-muted hover:text-text-secondary hover:bg-muted',
        )}
      >
        <Network className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Targets</span>
        <span className="text-[11px] text-text-dim font-mono">{targetCount}</span>
        {expanded ? (
          <ChevronDown className="w-3 h-3 text-text-dim" />
        ) : (
          <ChevronRight className="w-3 h-3 text-text-dim" />
        )}
      </button>

      {expanded && (
        <div className="ml-3 mt-1 space-y-0.5 border-l border-border pl-2">
          {visibleRows.map((row) => {
            if (row.type === 'group') {
              const isCollapsed = collapsedGroupIds.has(row.id)
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => toggleGroup(row.id)}
                  className="flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-[11px] font-medium text-text-muted transition-colors hover:bg-muted hover:text-text-secondary"
                  style={{ paddingLeft: `${8 + row.depth * 10}px` }}
                >
                  {isCollapsed ? <ChevronRight className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
                  <GroupIcon depth={row.depth} />
                  <span className="truncate">{row.label}</span>
                  <span className="ml-auto font-mono text-[10px] text-text-dim">{row.count}</span>
                </button>
              )
            }

            const path = `${basePath}?target_uuid=${encodeURIComponent(row.targetUuid)}`
            const isActive = location.pathname === basePath && activeTargetUuid === row.targetUuid

            return (
              <NavLink
                key={row.id}
                to={path}
                className={cn(
                  'flex items-center gap-2 rounded-md py-1.5 pr-2 text-[11px] transition-colors group',
                  isActive
                    ? 'bg-accent/50 text-accent-foreground'
                    : 'text-text-dim hover:text-text-secondary hover:bg-muted',
                )}
                style={{ paddingLeft: `${22 + row.depth * 10}px` }}
                title={`${row.label} / ${row.target}`}
              >
                <Server className="w-3 h-3 shrink-0" />
                <span className="truncate flex-1">{row.label}</span>
                <span className="shrink-0 font-mono text-[10px] text-text-dim">{row.target}</span>
              </NavLink>
            )
          })}
          {visibleRows.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-text-dim">No targets</div>
          )}
        </div>
      )}
    </div>
  )
}

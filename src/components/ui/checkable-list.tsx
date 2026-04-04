import { Check } from 'lucide-react'

export interface CheckableListItem {
  id: string
  label: string
  sublabel?: string
  disabled?: boolean
}

interface CheckableListProps {
  items: readonly CheckableListItem[]
  selectedIds: ReadonlySet<string>
  onToggle: (id: string) => void
  emptyMessage?: string
  maxHeight?: string
}

export function CheckableList({ items, selectedIds, onToggle, emptyMessage, maxHeight = 'max-h-48' }: CheckableListProps) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-xs py-3 text-center">{emptyMessage ?? 'No items'}</p>
    )
  }

  return (
    <div role="listbox" aria-multiselectable="true" className={`${maxHeight} overflow-y-auto space-y-1`}>
      {items.map((item) => {
        const selected = selectedIds.has(item.id)
        return (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={selected}
            disabled={item.disabled}
            onClick={() => onToggle(item.id)}
            className={`w-full flex items-center justify-between gap-2 rounded-lg py-2 px-3 text-left text-xs transition-colors border ${
              selected
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-border bg-muted/50 hover:bg-muted'
            } ${item.disabled ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="min-w-0">
              <div className="text-foreground font-medium truncate">{item.label}</div>
              {item.sublabel && (
                <div className="text-muted-foreground text-[10px] truncate">{item.sublabel}</div>
              )}
            </div>
            {selected && <Check className="size-3.5 text-emerald-400 shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}

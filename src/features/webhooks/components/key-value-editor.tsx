import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { isReservedHeader } from '@/features/webhooks/lib/constants'
import { X, Plus } from 'lucide-react'

let nextId = 0
function genId() {
  return `kv-${++nextId}`
}

export interface KeyValueEntry {
  id: string
  key: string
  value: string
}

export function createEntry(key = '', value = ''): KeyValueEntry {
  return { id: genId(), key, value }
}

interface KeyValueEditorProps {
  value: KeyValueEntry[]
  onChange: (entries: KeyValueEntry[]) => void
  maxEntries?: number
}

export function KeyValueEditor({ value, onChange, maxEntries = 20 }: KeyValueEditorProps) {
  const { t } = useTranslation()

  const handleKeyChange = (id: string, newKey: string) => {
    onChange(value.map((entry) => (entry.id === id ? { ...entry, key: newKey } : entry)))
  }

  const handleValueChange = (id: string, newValue: string) => {
    onChange(value.map((entry) => (entry.id === id ? { ...entry, value: newValue } : entry)))
  }

  const handleRemove = (id: string) => {
    onChange(value.filter((entry) => entry.id !== id))
  }

  const handleAdd = () => {
    if (value.length >= maxEntries) return
    onChange([...value, createEntry()])
  }

  return (
    <div className="space-y-1.5">
      {value.map((entry) => {
        const reserved = entry.key.trim() !== '' && isReservedHeader(entry.key)
        return (
          <div key={entry.id}>
            <div className="flex items-center gap-1.5">
              <Input
                value={entry.key}
                onChange={(e) => handleKeyChange(entry.id, e.target.value)}
                placeholder={t('webhooks.headerKeyPlaceholder')}
                className={`flex-1 text-xs ${reserved ? 'border-red-500/50 focus-visible:border-red-500 focus-visible:ring-red-500/30' : ''}`}
              />
              <Input
                value={entry.value}
                onChange={(e) => handleValueChange(entry.id, e.target.value)}
                placeholder={t('webhooks.headerValuePlaceholder')}
                className="flex-1 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-text-dim hover:text-red-400 shrink-0"
                onClick={() => handleRemove(entry.id)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            {reserved && (
              <p className="text-[10px] text-red-400 mt-0.5 ml-0.5">{t('webhooks.reservedHeaderError')}</p>
            )}
          </div>
        )
      })}
      {value.length < maxEntries ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs h-7 px-2 text-text-muted hover:text-text-primary"
          onClick={handleAdd}
        >
          <Plus className="w-3 h-3 mr-1" />
          {t('webhooks.addHeader')}
        </Button>
      ) : (
        <p className="text-[10px] text-text-dim">{t('webhooks.maxHeadersReached')}</p>
      )}
    </div>
  )
}

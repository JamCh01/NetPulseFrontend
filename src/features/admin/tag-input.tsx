import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react'

import { type ResourceTag, useTags } from '@/api/hooks/admin-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TagInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  resourceType: 'agent' | 'target' | 'route_trace_target'
}

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function serializeTags(tags: string[]): string {
  const seen = new Set<string>()
  const unique: string[] = []
  for (const tag of tags) {
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(tag)
  }
  return unique.join(', ')
}

export function TagInput({ label, value, onChange, resourceType }: TagInputProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const selectedTags = useMemo(() => parseTags(value), [value])
  const tagsQuery = useTags({ resource_type: resourceType, keyword: draft, limit: 20 })
  const suggestions = (tagsQuery.data?.items ?? []).filter((item) => (
    !selectedTags.some((tag) => tag.toLowerCase() === item.tag.toLowerCase())
  ))

  const addTag = (tag: string) => {
    const nextTag = tag.trim()
    if (!nextTag) return
    onChange(serializeTags([...selectedTags, nextTag]))
    setDraft('')
  }

  const removeTag = (tag: string) => {
    onChange(serializeTags(selectedTags.filter((item) => item !== tag)))
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs text-text-secondary">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addTag(draft)
            }
            if (event.key === ',' || event.key === 'Tab') {
              if (!draft.trim()) return
              event.preventDefault()
              addTag(draft.replace(',', ''))
            }
          }}
          placeholder={t('adminInputs.tagPlaceholder')}
        />
        <Button type="button" variant="outline" size="icon" onClick={() => addTag(draft)} aria-label={t('adminInputs.addTag')}>
          <Plus className="size-4" />
        </Button>
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removeTag(tag)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-1 text-xs text-text-secondary hover:text-red-300"
            >
              {tag}
              <X className="size-3" />
            </button>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="max-h-36 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-sm">
          {suggestions.map((item: ResourceTag) => (
            <button
              key={`${item.resource_type}:${item.tag}`}
              type="button"
              onClick={() => addTag(item.tag)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs text-text-secondary hover:bg-muted"
            >
              <span>{item.tag}</span>
              <span className="text-text-dim">{item.resource_count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

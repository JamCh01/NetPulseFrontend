import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type InlineToken = {
  type: 'text' | 'strong' | 'code'
  value: string
}

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  let remaining = text

  while (remaining.length > 0) {
    const strongIndex = remaining.indexOf('**')
    const codeIndex = remaining.indexOf('`')
    const candidates = [strongIndex, codeIndex].filter((index) => index >= 0)
    const nextIndex = candidates.length ? Math.min(...candidates) : -1

    if (nextIndex < 0) {
      tokens.push({ type: 'text', value: remaining })
      break
    }

    if (nextIndex > 0) {
      tokens.push({ type: 'text', value: remaining.slice(0, nextIndex) })
      remaining = remaining.slice(nextIndex)
      continue
    }

    if (remaining.startsWith('**')) {
      const end = remaining.indexOf('**', 2)
      if (end > 2) {
        tokens.push({ type: 'strong', value: remaining.slice(2, end) })
        remaining = remaining.slice(end + 2)
        continue
      }
    }

    if (remaining.startsWith('`')) {
      const end = remaining.indexOf('`', 1)
      if (end > 1) {
        tokens.push({ type: 'code', value: remaining.slice(1, end) })
        remaining = remaining.slice(end + 1)
        continue
      }
    }

    tokens.push({ type: 'text', value: remaining[0] })
    remaining = remaining.slice(1)
  }

  return tokens
}

function renderInline(text: string): ReactNode[] {
  return parseInline(text).map((token, index) => {
    if (token.type === 'strong') return <strong key={index}>{token.value}</strong>
    if (token.type === 'code') {
      return (
        <code key={index} className="rounded bg-muted px-1 py-0.5 font-[family-name:var(--font-mono)] text-[0.85em] text-text-primary">
          {token.value}
        </code>
      )
    }
    return token.value
  })
}

export function MarkdownPreview({ value, className }: { value: string; className?: string }) {
  const lines = value.split(/\r?\n/)
  const blocks: ReactNode[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    if (trimmed.startsWith('- ')) {
      const items: string[] = []
      while (index < lines.length && lines[index].trim().startsWith('- ')) {
        items.push(lines[index].trim().slice(2))
        index += 1
      }
      blocks.push(
        <ul key={`ul-${index}`} className="list-disc space-y-1 pl-5">
          {items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}
        </ul>,
      )
      continue
    }

    if (trimmed.startsWith('### ')) {
      blocks.push(<h4 key={index} className="text-sm font-semibold text-text-primary">{renderInline(trimmed.slice(4))}</h4>)
      index += 1
      continue
    }

    if (trimmed.startsWith('## ')) {
      blocks.push(<h3 key={index} className="text-base font-semibold text-text-primary">{renderInline(trimmed.slice(3))}</h3>)
      index += 1
      continue
    }

    if (trimmed.startsWith('# ')) {
      blocks.push(<h2 key={index} className="text-lg font-semibold text-text-primary">{renderInline(trimmed.slice(2))}</h2>)
      index += 1
      continue
    }

    blocks.push(<p key={index}>{renderInline(trimmed)}</p>)
    index += 1
  }

  return (
    <div
      className={cn(
        'min-h-[120px] rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm leading-6 text-text-secondary',
        'space-y-2 overflow-auto break-words',
        className,
      )}
    >
      {blocks.length ? blocks : <span className="text-text-muted">暂无预览</span>}
    </div>
  )
}


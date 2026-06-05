import type { ComponentProps, JSX } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

type MarkdownPreviewProps = {
  value: string
  className?: string
  emptyText?: string
}

type MarkdownComponentProps<K extends keyof JSX.IntrinsicElements> = ComponentProps<K> & {
  node?: unknown
}

function cleanMarkdownProps<K extends keyof JSX.IntrinsicElements>(props: MarkdownComponentProps<K>) {
  const { node: _node, ...cleanProps } = props
  void _node
  return cleanProps
}

const markdownComponents = {
  h1: (componentProps: MarkdownComponentProps<'h1'>) => {
    const { className, ...props } = cleanMarkdownProps(componentProps)
    return <h2 className={cn('text-lg font-semibold leading-7 text-text-primary', className)} {...props} />
  },
  h2: (componentProps: MarkdownComponentProps<'h2'>) => {
    const { className, ...props } = cleanMarkdownProps(componentProps)
    return <h3 className={cn('text-base font-semibold leading-6 text-text-primary', className)} {...props} />
  },
  h3: (componentProps: MarkdownComponentProps<'h3'>) => {
    const { className, ...props } = cleanMarkdownProps(componentProps)
    return <h4 className={cn('text-sm font-semibold leading-6 text-text-primary', className)} {...props} />
  },
  h4: (componentProps: MarkdownComponentProps<'h4'>) => {
    const { className, ...props } = cleanMarkdownProps(componentProps)
    return <h5 className={cn('text-sm font-semibold leading-6 text-text-primary', className)} {...props} />
  },
  p: (componentProps: MarkdownComponentProps<'p'>) => {
    const { className, ...props } = cleanMarkdownProps(componentProps)
    return <p className={cn('leading-6', className)} {...props} />
  },
  ul: (componentProps: MarkdownComponentProps<'ul'>) => {
    const { className, ...props } = cleanMarkdownProps(componentProps)
    return <ul className={cn('list-disc space-y-1 pl-5', className)} {...props} />
  },
  ol: (componentProps: MarkdownComponentProps<'ol'>) => {
    const { className, ...props } = cleanMarkdownProps(componentProps)
    return <ol className={cn('list-decimal space-y-1 pl-5', className)} {...props} />
  },
  li: (componentProps: MarkdownComponentProps<'li'>) => {
    const { className, ...props } = cleanMarkdownProps(componentProps)
    return <li className={cn('pl-0.5', className)} {...props} />
  },
  blockquote: (componentProps: MarkdownComponentProps<'blockquote'>) => {
    const { className, ...props } = cleanMarkdownProps(componentProps)
    return <blockquote className={cn('border-l-2 border-accent-border pl-3 text-text-muted', className)} {...props} />
  },
  a: (componentProps: MarkdownComponentProps<'a'>) => {
    const { className, ...props } = cleanMarkdownProps(componentProps)
    return <a className={cn('text-accent underline underline-offset-4 hover:text-accent-strong', className)} target="_blank" rel="noreferrer" {...props} />
  },
  code: (componentProps: MarkdownComponentProps<'code'>) => {
    const { className, children, ...props } = cleanMarkdownProps(componentProps)
    return (
      <code className={cn('rounded bg-muted px-1 py-0.5 font-[family-name:var(--font-mono)] text-[0.85em] text-text-primary', className)} {...props}>
        {children}
      </code>
    )
  },
  pre: (componentProps: MarkdownComponentProps<'pre'>) => {
    const { className, children, ...props } = cleanMarkdownProps(componentProps)
    return (
      <pre className={cn('overflow-x-auto rounded-lg border border-border bg-muted/40 px-3 py-2 font-[family-name:var(--font-mono)] text-xs leading-5 text-text-primary', className)} {...props}>
        {children}
      </pre>
    )
  },
  table: (componentProps: MarkdownComponentProps<'table'>) => {
    const { className, ...props } = cleanMarkdownProps(componentProps)
    return (
      <div className="overflow-x-auto">
        <table className={cn('min-w-full border-collapse text-left text-xs', className)} {...props} />
      </div>
    )
  },
  th: (componentProps: MarkdownComponentProps<'th'>) => {
    const { className, ...props } = cleanMarkdownProps(componentProps)
    return <th className={cn('border border-border bg-muted/30 px-2 py-1 font-medium text-text-primary', className)} {...props} />
  },
  td: (componentProps: MarkdownComponentProps<'td'>) => {
    const { className, ...props } = cleanMarkdownProps(componentProps)
    return <td className={cn('border border-border px-2 py-1 text-text-secondary', className)} {...props} />
  },
}

export function MarkdownPreview({ value, className, emptyText = '暂无预览' }: MarkdownPreviewProps) {
  const markdown = value.trim()

  return (
    <div
      className={cn(
        'min-h-[120px] rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm leading-6 text-text-secondary',
        'space-y-2 overflow-auto break-words',
        className,
      )}
    >
      {markdown ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      ) : (
        <span className="text-text-muted">{emptyText}</span>
      )}
    </div>
  )
}

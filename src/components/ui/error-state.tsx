import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertTriangle, RefreshCw } from 'lucide-react'

type ErrorStateProps = {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  secondaryAction?: ReactNode
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again in a moment.',
  onRetry,
  retryLabel = 'Retry',
  secondaryAction,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200/60 dark:border-red-900/30 bg-red-50/70 dark:bg-red-950/20 px-6 py-8 text-center',
        className,
      )}
    >
      <div className="rounded-full border border-red-200/50 dark:border-red-800/40 bg-red-100/80 dark:bg-red-950/40 p-2">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-red-900 dark:text-zinc-100">{title}</p>
        <p className="text-xs text-red-700/80 dark:text-zinc-400">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {onRetry ? (
          <Button variant="destructive" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {retryLabel}
          </Button>
        ) : null}
        {secondaryAction}
      </div>
    </div>
  )
}

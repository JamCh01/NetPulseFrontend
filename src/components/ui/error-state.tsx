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
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-red-500/25 bg-red-500/8 px-6 py-8 text-center',
        className,
      )}
    >
      <div className="rounded-full border border-red-400/30 bg-red-500/10 p-2">
        <AlertTriangle className="h-5 w-5 text-red-300" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
        <p className="text-xs text-zinc-400">{description}</p>
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

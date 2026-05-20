import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

type LoadingStateProps = {
  className?: string
  fullscreen?: boolean
  label?: string
  hint?: string
}

export function LoadingState({
  className,
  fullscreen = false,
  label = 'Loading data',
  hint,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-accent/10 bg-[rgba(6,12,24,0.55)] backdrop-blur-md',
        fullscreen ? 'min-h-screen gradient-bg grid-pattern' : 'min-h-[40vh] p-8',
        className,
      )}
    >
      <LoadingSpinner size="lg" />
      <p className="text-sm font-medium text-zinc-200">{label}</p>
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  )
}

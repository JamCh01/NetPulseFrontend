import { cn } from '@/lib/utils'

type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClassMap: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]',
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block rounded-full border-accent/25 border-t-accent loading-ring shadow-[0_0_24px_rgba(0,255,200,0.18)]',
        sizeClassMap[size],
        className,
      )}
    />
  )
}

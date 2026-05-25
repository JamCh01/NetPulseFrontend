import * as React from "react"
import { cn } from "@/lib/utils"

interface ToggleSwitchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  checked: boolean
  onChange: (checked: boolean) => void
  labelLeft?: string
  labelRight?: string
  disabled?: boolean
}

function ToggleSwitch({
  checked,
  onChange,
  labelLeft,
  labelRight,
  disabled = false,
  className,
  "aria-label": ariaLabel,
  ...props
}: ToggleSwitchProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {labelLeft && (
        <span className={cn(
          "text-xs font-medium transition-colors",
          !checked ? "text-text-primary" : "text-text-muted"
        )}>
          {labelLeft}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-label={ariaLabel}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
          checked ? "bg-emerald-500" : "bg-gray-600",
          disabled && "cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
      {labelRight && (
        <span className={cn(
          "text-xs font-medium transition-colors",
          checked ? "text-text-primary" : "text-text-muted"
        )}>
          {labelRight}
        </span>
      )}
    </div>
  )
}

export { ToggleSwitch }

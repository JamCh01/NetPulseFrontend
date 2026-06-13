
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-[0.93rem] leading-none font-medium whitespace-nowrap shadow-xs transition-[background-color,border-color,color,box-shadow,transform] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-btn-primary-bg text-btn-primary-fg hover:bg-btn-primary-hover hover:shadow-[var(--btn-primary-hover-shadow)] active:bg-btn-primary-active",
        outline:
          "border-btn-outline-border bg-background text-foreground hover:bg-btn-ghost-hover hover:border-ring/60 hover:text-btn-ghost-hover-fg aria-expanded:bg-btn-ghost-hover aria-expanded:text-btn-ghost-hover-fg dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-btn-secondary-bg text-btn-secondary-fg hover:bg-btn-secondary-hover hover:text-btn-secondary-hover-fg aria-expanded:bg-btn-secondary-hover aria-expanded:text-btn-secondary-hover-fg",
        ghost:
          "text-btn-ghost-fg hover:bg-btn-ghost-hover hover:text-btn-ghost-hover-fg aria-expanded:bg-btn-ghost-hover aria-expanded:text-btn-ghost-hover-fg",
        destructive:
          "border-btn-destructive-border bg-btn-destructive-bg text-btn-destructive-fg hover:border-btn-destructive-hover-border hover:bg-btn-destructive-hover hover:text-btn-destructive-hover-fg focus-visible:border-btn-destructive-hover-border focus-visible:ring-btn-destructive-ring",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-1.5 px-3 sm:h-9 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs sm:h-6 in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.86rem] sm:h-8 in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-3 sm:h-9 sm:px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-10 sm:size-8",
        "icon-xs":
          "size-8 rounded-[min(var(--radius-md),10px)] sm:size-6 in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 rounded-[min(var(--radius-md),12px)] sm:size-7 in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-11 sm:size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }

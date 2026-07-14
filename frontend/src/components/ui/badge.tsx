import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-xl border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20",
        secondary:
          "border-transparent bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/5",
        destructive:
          "border-transparent bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/20",
        outline: "border-white/10 text-zinc-300 bg-white/[0.02] hover:bg-white/[0.05]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20",
        destructive:
          "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/20",
        outline:
          "border border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05] hover:text-white",
        secondary:
          "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/5",
        ghost: "hover:bg-white/[0.05] text-zinc-300 hover:text-white",
        link: "text-indigo-400 underline-offset-4 hover:underline hover:text-indigo-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

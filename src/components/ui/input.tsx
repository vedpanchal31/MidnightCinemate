import * as React from "react"
import { cn } from "@/lib/utils"

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200",
          // Background and border
          "bg-zinc-800/40 border-zinc-700/50",
          // Focus states
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-zinc-800/60",
          // Text colors
          "text-white placeholder:text-zinc-500",
          // Hover states
          "hover:bg-zinc-800/50 hover:border-zinc-600/50",
          // Disabled states
          "disabled:cursor-not-allowed disabled:opacity-50",
          // File input specific
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-400",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

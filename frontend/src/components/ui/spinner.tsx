import * as React from "react"
import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg"
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-3 w-3 border-[1.5px]",
      default: "h-4 w-4 border-2",
      lg: "h-6 w-6 border-2",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full border-current border-t-transparent",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)
Spinner.displayName = "Spinner"

export { Spinner }

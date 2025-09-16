import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { GabaiCheckIcon } from "./gabai-check-icon"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-6 w-6 shrink-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-50 dark:data-[state=checked]:bg-blue-950",
      className
    )}
    {...props}
    data-testid="checkbox-gabai"
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current data-[state=checked]:scale-100 data-[state=unchecked]:scale-0 transition-transform duration-200")}
    >
      <GabaiCheckIcon size="md" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }

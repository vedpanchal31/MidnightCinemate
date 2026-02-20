"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const checkboxVariants = cva(
  // Base styles - perfect square shape with rounded corners
  "peer shrink-0 rounded transition-all duration-300 ease-in-out cursor-pointer bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 border border-zinc-700/50 shadow-sm shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 focus-visible:border-primary/60 hover:border-zinc-600/60 hover:bg-gradient-to-br hover:from-zinc-700/60 hover:to-zinc-800/60 hover:shadow-md hover:shadow-black/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-zinc-700/50 disabled:hover:from-zinc-800/60 disabled:hover:to-zinc-900/60 data-[state=checked]:bg-none data-[state=checked]:bg-red-600 data-[state=checked]:border-red-500 data-[state=checked]:text-white data-[state=checked]:shadow-lg data-[state=checked]:shadow-red-900/30 active:scale-95",
  {
    variants: {
      size: {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> &
    VariantProps<typeof checkboxVariants>
>(({ className, size, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(checkboxVariants({ size, className }))}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        "flex items-center justify-center text-current transition-all duration-200",
        "data-[state=checked]:animate-in data-[state=checked]:fade-in-0 data-[state=checked]:zoom-in-95 data-[state=checked]:duration-200",
      )}
    >
      <Check
        className={cn("drop-shadow-sm", {
          "h-2 w-2 [stroke-width:3]": size === "sm",
          "h-3 w-3 [stroke-width:3]": size === "md",
          "h-4 w-4 [stroke-width:3]": size === "lg",
        })}
      />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox, checkboxVariants };

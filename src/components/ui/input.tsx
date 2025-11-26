import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full border bg-background text-foreground ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        filled: "border-transparent bg-secondary focus-visible:bg-background focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        ghost: "border-transparent bg-transparent hover:bg-secondary/50 focus-visible:bg-secondary/50 focus-visible:ring-0",
        premium: "border-border/50 bg-background/50 backdrop-blur-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-background",
      },
      inputSize: {
        default: "h-11 rounded-xl px-4 py-2 text-sm",
        sm: "h-9 rounded-lg px-3 py-1.5 text-sm",
        lg: "h-12 rounded-xl px-5 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };

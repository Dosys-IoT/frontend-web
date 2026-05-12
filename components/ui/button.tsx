"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sanctuary-500)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cream-100)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-sanctuary-600)] text-white shadow-[0_8px_24px_-12px_var(--color-sanctuary-700)] hover:bg-[var(--color-sanctuary-700)]",
        secondary:
          "bg-white text-[var(--color-ink-900)] border border-[var(--color-ink-100)] hover:border-[var(--color-ink-200)] hover:bg-[var(--color-cream-50)]",
        ghost:
          "text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)] hover:bg-[var(--color-cream-200)]/60",
        dark:
          "bg-[var(--color-ink-900)] text-white hover:bg-[var(--color-ink-700)]",
        outline:
          "border border-[var(--color-sanctuary-600)]/30 text-[var(--color-sanctuary-700)] hover:bg-[var(--color-sanctuary-50)]",
        link:
          "text-[var(--color-sanctuary-700)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-[13px]",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(button({ variant, size }), className)} {...props} />
    );
  }
);
Button.displayName = "Button";

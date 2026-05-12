"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-12 w-full rounded-xl border border-[var(--color-ink-100)] bg-[var(--color-cream-50)] px-4 text-[15px] text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-400)] transition-colors",
        "focus-visible:outline-none focus-visible:border-[var(--color-sanctuary-500)] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[var(--color-sanctuary-500)]/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

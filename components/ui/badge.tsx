import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide",
  {
    variants: {
      tone: {
        sanctuary: "bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]",
        ink: "bg-[var(--color-ink-50)] text-[var(--color-ink-700)]",
        danger: "bg-[var(--color-danger-50)] text-[var(--color-danger-600)]",
        amber: "bg-[var(--color-amber-50)] text-[#7a5400]",
        neutral: "bg-white/80 text-[var(--color-ink-700)] border border-[var(--color-ink-100)]",
      },
    },
    defaultVariants: { tone: "sanctuary" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ tone, className, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}

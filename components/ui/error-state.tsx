"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/** Shown when a read query fails (network / server error, not a 401). */
export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this data. Check your connection and try again.",
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-[var(--color-danger-200)] bg-[var(--color-danger-50)]/40 p-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-danger-50)] text-[var(--color-danger-600)]">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="mt-4 font-display text-2xl text-[var(--color-ink-900)]">{title}</p>
      <p className="mt-2 max-w-[420px] text-[14px] text-[var(--color-ink-500)]">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          <RotateCw className="h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
}

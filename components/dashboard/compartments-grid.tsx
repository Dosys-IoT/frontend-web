"use client";

import { AlertTriangle, Check, Plus } from "lucide-react";
import type { ContainerResponse } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CompartmentsGridProps {
  containers: ContainerResponse[];
  lowThreshold?: number;
  onAssign?: () => void;
}

function statusOf(c: ContainerResponse, threshold: number) {
  if (!c.isEnabled) return "disabled" as const;
  if (c.remainingPills <= 0) return "empty" as const;
  if (c.remainingPills <= threshold) return "low" as const;
  return "ok" as const;
}

const TONES = {
  ok: "bg-[var(--color-sanctuary-100)]/60",
  low: "bg-[var(--color-danger-50)]",
  empty: "bg-[var(--color-ink-50)]",
  disabled: "bg-[var(--color-ink-50)]/50",
} as const;

export function CompartmentsGrid({
  containers,
  lowThreshold = 5,
  onAssign,
}: CompartmentsGridProps) {
  const slots = [1, 2, 3, 4, 5].map(
    (n) => containers.find((c) => c.containerNumber === n) ?? null
  );

  return (
    <section className="rounded-[28px] bg-white p-7 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
          Device Compartments
        </h2>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-[var(--color-sanctuary-700)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-sanctuary-500)]" /> OK
          </span>
          <span className="inline-flex items-center gap-1.5 text-[var(--color-danger-600)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-danger-500)]" /> Low
          </span>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {slots.map((c, i) => {
          if (!c) {
            return (
              <button
                key={`empty-${i}`}
                onClick={onAssign}
                className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-[var(--color-ink-100)] text-[var(--color-ink-400)] transition-colors hover:border-[var(--color-sanctuary-300)] hover:text-[var(--color-sanctuary-700)]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-ink-50)]">
                  <Plus className="h-4 w-4" />
                </span>
                <span className="text-[12px]">Assign Medication</span>
              </button>
            );
          }
          const status = statusOf(c, lowThreshold);
          return (
            <article
              key={c.id}
              className="flex aspect-[3/4] flex-col rounded-3xl border border-[var(--color-ink-50)] bg-[var(--color-cream-50)] p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[var(--color-ink-700)]">
                  C{c.containerNumber}
                </span>
                {status === "low" || status === "empty" ? (
                  <AlertTriangle className="h-4 w-4 text-[var(--color-danger-500)]" />
                ) : (
                  <Check className="h-4 w-4 text-[var(--color-sanctuary-600)]" />
                )}
              </div>

              <div
                className={cn(
                  "mt-3 flex flex-1 items-end justify-center rounded-2xl",
                  TONES[status]
                )}
              >
                <div className="mb-3 h-12 w-9 rounded-md bg-white/80 shadow-inner" />
              </div>

              <div className="mt-3">
                <p className="truncate text-[14px] font-semibold text-[var(--color-ink-900)]">
                  {c.medicationName ?? "Unassigned"}
                </p>
                <p
                  className={cn(
                    "text-[12px]",
                    status === "low" || status === "empty"
                      ? "font-semibold text-[var(--color-danger-600)]"
                      : "text-[var(--color-ink-500)]"
                  )}
                >
                  {c.remainingPills} units left
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

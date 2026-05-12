import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MedicationStatus } from "@/lib/mocks";

interface MedicationRowProps {
  containerNumber: number;
  medicationName: string;
  dosageLabel: string | null;
  status: MedicationStatus;
  nextDoseLabel: string | null;
  nextDoseContext: string | null;
  remainingPills: number;
  refillThreshold: number;
}

export function MedicationRow({
  containerNumber,
  medicationName,
  dosageLabel,
  status,
  nextDoseLabel,
  nextDoseContext,
  remainingPills,
  refillThreshold,
}: MedicationRowProps) {
  const isLow = remainingPills <= refillThreshold;
  const fillPct = Math.min(100, Math.max(8, (remainingPills / (refillThreshold * 3)) * 100));

  return (
    <Link
      href={`/medications/${containerNumber}`}
      className="grid grid-cols-[auto_1.5fr_1fr_1.5fr_1.4fr_auto] items-center gap-6 rounded-3xl bg-white px-6 py-5 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60 transition-shadow hover:shadow-[var(--shadow-hero)]"
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--color-sanctuary-100)] text-[13px] font-semibold text-[var(--color-sanctuary-700)]">
        C{containerNumber}
      </span>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-400)]">
          Medication
        </p>
        <p className="mt-1 text-[15px] font-semibold text-[var(--color-ink-900)]">
          {medicationName}
        </p>
        {dosageLabel && (
          <p className="text-[13px] text-[var(--color-ink-500)]">{dosageLabel}</p>
        )}
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-400)]">
          Status
        </p>
        <Badge
          tone={status === "ACTIVE" ? "sanctuary" : status === "PAUSED" ? "amber" : "ink"}
          className="mt-1.5 normal-case"
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              status === "ACTIVE"
                ? "bg-[var(--color-sanctuary-500)]"
                : status === "PAUSED"
                  ? "bg-[var(--color-amber-500)]"
                  : "bg-[var(--color-ink-400)]"
            )}
          />
          {status === "ACTIVE" ? "Active" : status === "PAUSED" ? "Paused" : "Archived"}
        </Badge>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-400)]">
          Next Dose
        </p>
        <p className="mt-1 text-[14px] font-semibold text-[var(--color-ink-900)]">
          {nextDoseLabel ?? "No dose scheduled"}
        </p>
        {nextDoseContext && (
          <p className="text-[12px] text-[var(--color-ink-500)]">{nextDoseContext}</p>
        )}
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-400)]">
            Supply
          </p>
          <p className="text-[11px] text-[var(--color-ink-400)]">
            Refill at <span className="font-semibold text-[var(--color-ink-700)]">{refillThreshold}</span>
          </p>
        </div>
        <p className="mt-1 text-[14px]">
          <span
            className={cn(
              "font-semibold",
              isLow ? "text-[var(--color-danger-600)]" : "text-[var(--color-ink-900)]"
            )}
          >
            {remainingPills}
          </span>{" "}
          <span className="text-[12px] text-[var(--color-ink-500)]">Pills</span>
        </p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--color-ink-50)]">
          <div
            className={cn(
              "h-full rounded-full",
              isLow ? "bg-[var(--color-danger-500)]" : "bg-[var(--color-sanctuary-500)]"
            )}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-[var(--color-ink-400)]" />
    </Link>
  );
}

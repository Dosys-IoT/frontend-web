import { cn } from "@/lib/utils";

export type ComplianceState = "taken" | "pending" | "missed";

export interface ComplianceDay {
  label: string;
  state: ComplianceState;
  isToday?: boolean;
}

interface ComplianceBarsProps {
  days: ComplianceDay[];
}

const COLOR: Record<ComplianceState, string> = {
  taken: "bg-[var(--color-sanctuary-600)]",
  pending: "bg-[var(--color-ink-100)]",
  missed: "bg-[var(--color-danger-200)]",
};

const HEIGHT: Record<ComplianceState, string> = {
  taken: "h-[88%]",
  pending: "h-[40%]",
  missed: "h-[60%]",
};

export function ComplianceBars({ days }: ComplianceBarsProps) {
  return (
    <div className="flex h-[140px] items-end gap-3">
      {days.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div className="relative w-full flex-1 rounded-2xl bg-[var(--color-cream-100)]">
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 rounded-2xl",
                COLOR[d.state],
                HEIGHT[d.state]
              )}
            />
            {d.isToday && (
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-ink-900)] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">
                Today
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-ink-400)]">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

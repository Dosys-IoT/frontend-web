import { Check, CircleSlash, AlertTriangle } from "lucide-react";
import type { CompartmentStatus } from "@/lib/mocks";
import { cn } from "@/lib/utils";

interface Props {
  data: CompartmentStatus[];
}

const STATUS_COPY = {
  active: { label: "Active", icon: Check, tone: "text-[var(--color-sanctuary-700)]", bg: "bg-[var(--color-sanctuary-100)]" },
  empty: { label: "Empty", icon: CircleSlash, tone: "text-[var(--color-ink-500)]", bg: "bg-[var(--color-ink-50)]" },
  stuck: { label: "Check Tray", icon: AlertTriangle, tone: "text-[var(--color-danger-600)]", bg: "bg-[var(--color-danger-50)]" },
  checking: { label: "Checking", tone: "text-[var(--color-amber-500)]", icon: AlertTriangle, bg: "bg-[var(--color-amber-50)]" },
} as const;

export function CompartmentStatusGrid({ data }: Props) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {data.map((c) => {
        const meta = STATUS_COPY[c.status];
        const Icon = meta.icon;
        return (
          <article
            key={c.containerNumber}
            className="flex flex-col items-center rounded-2xl bg-[var(--color-cream-50)] p-3"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-ink-400)]">
              C{c.containerNumber}
            </p>
            <div className={cn("mt-2 grid h-12 w-12 place-items-center rounded-full", meta.bg)}>
              <Icon className={cn("h-5 w-5", meta.tone)} />
            </div>
            <p className={cn("mt-2 text-[12px] font-semibold", meta.tone)}>{meta.label}</p>
            <p className="text-[11px] text-[var(--color-ink-500)]">{c.label}</p>
          </article>
        );
      })}
    </div>
  );
}

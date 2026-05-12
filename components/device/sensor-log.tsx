import type { SensorEvent } from "@/lib/mocks";
import { cn } from "@/lib/utils";

interface Props {
  events: SensorEvent[];
}

function relativeFromAnchor(iso: string, anchor = "2026-05-11T06:00:00.000Z") {
  const minutes = Math.round(
    (new Date(anchor).getTime() - new Date(iso).getTime()) / 60_000
  );
  if (minutes < 60) return `${minutes} MIN AGO`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `TODAY, ${hours}H AGO`;
  if (hours < 48) return "YESTERDAY";
  const days = Math.round(hours / 24);
  return `${days}D AGO`;
}

export function SensorLog({ events }: Props) {
  return (
    <ul className="flex flex-col gap-3">
      {events.map((e) => (
        <li key={e.id} className="flex items-start gap-3">
          <span
            className={cn(
              "mt-1.5 h-2 w-2 rounded-full",
              e.severity === "critical"
                ? "bg-[var(--color-danger-500)]"
                : e.severity === "warning"
                  ? "bg-[var(--color-amber-500)]"
                  : "bg-[var(--color-sanctuary-500)]"
            )}
          />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-[var(--color-ink-900)]">
              {e.title}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">
              {relativeFromAnchor(e.occurredAt)}
            </p>
          </div>
          <span className="self-center text-[var(--color-ink-400)]">›</span>
        </li>
      ))}
    </ul>
  );
}

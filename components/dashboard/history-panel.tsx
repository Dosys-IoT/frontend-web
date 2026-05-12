import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HistoryEntry {
  id: string;
  title: string;
  detail: string;
  status: "on-time" | "delayed" | "missed";
}

const STATUS_TONE = {
  "on-time": { tone: "sanctuary" as const, label: "On Time" },
  delayed: { tone: "amber" as const, label: "Delayed" },
  missed: { tone: "danger" as const, label: "Missed" },
};

export function HistoryPanel({ entries }: { entries: HistoryEntry[] }) {
  return (
    <section className="rounded-[28px] bg-white p-7 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
      <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">Recent History</h2>

      <ul className="mt-4 space-y-3">
        {entries.length === 0 && (
          <li className="rounded-2xl bg-[var(--color-cream-50)] px-4 py-6 text-center text-[13px] text-[var(--color-ink-500)]">
            No intake events recorded yet.
          </li>
        )}
        {entries.map((e) => {
          const s = STATUS_TONE[e.status];
          return (
            <li
              key={e.id}
              className="flex items-center gap-3 rounded-2xl bg-[var(--color-cream-50)] px-4 py-3"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[var(--color-ink-500)]">
                <Clock className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[var(--color-ink-900)]">
                  {e.title}
                </p>
                <p className="text-[12px] text-[var(--color-ink-500)]">{e.detail}</p>
              </div>
              <Badge tone={s.tone}>{s.label}</Badge>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

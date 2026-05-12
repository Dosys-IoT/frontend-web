import { Bell, Droplets, Pill } from "lucide-react";

interface AlertItem {
  id: string;
  type: "refill" | "environment";
  title: string;
  body: string;
}

export function AlertsPanel({
  alerts,
  onClearAll,
}: {
  alerts: AlertItem[];
  onClearAll?: () => void;
}) {
  return (
    <section className="rounded-[28px] bg-white p-7 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
      <header className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[var(--color-ink-900)]">
          <Bell className="h-4 w-4 text-[var(--color-danger-500)]" />
          Urgent Alerts
        </h2>
        <button
          onClick={onClearAll}
          className="text-[12px] font-medium text-[var(--color-sanctuary-700)] hover:underline"
        >
          Clear all
        </button>
      </header>

      <ul className="mt-4 space-y-3">
        {alerts.length === 0 && (
          <li className="rounded-2xl bg-[var(--color-cream-50)] px-4 py-6 text-center text-[13px] text-[var(--color-ink-500)]">
            No urgent alerts. Everything's quiet.
          </li>
        )}
        {alerts.map((a) => {
          const Icon = a.type === "refill" ? Pill : Droplets;
          return (
            <li
              key={a.id}
              className="flex gap-3 rounded-2xl bg-[var(--color-cream-50)] px-4 py-3"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[var(--color-ink-700)]">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-[var(--color-ink-900)]">
                  {a.title}
                </p>
                <p className="text-[12px] leading-snug text-[var(--color-ink-500)]">
                  {a.body}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

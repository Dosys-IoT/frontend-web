"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_ALERTS, MOCK_ALERTS_METRICS, type Alert } from "@/lib/mocks";
import { AlertCard } from "@/components/alerts/alert-card";
import { cn } from "@/lib/utils";

type Tab = "today" | "archived";

export default function AlertsPage() {
  const [tab, setTab] = useState<Tab>("today");
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);

  const filtered = useMemo(
    () => alerts.filter((a) => (tab === "today" ? a.status === "active" : a.status === "archived")),
    [alerts, tab]
  );

  const onResolve = (id: string) =>
    setAlerts((curr) =>
      curr.map((a) => (a.id === id ? { ...a, status: "resolved" } : a))
    );

  const onSnooze = (id: string) =>
    setAlerts((curr) =>
      curr.map((a) => (a.id === id ? { ...a, status: "snoozed" } : a))
    );

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-400)]">
            System Pulse
          </p>
          <h1 className="mt-2 font-display text-[44px] leading-none text-[var(--color-ink-900)]">
            Alerts Center
          </h1>
          <p className="mt-2 max-w-[460px] text-[14px] text-[var(--color-ink-500)]">
            Monitor critical device metrics and medication adherence within your clinical
            sanctuary.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-[var(--color-ink-100)] bg-white p-1">
          <TabButton active={tab === "today"} onClick={() => setTab("today")}>
            Today
          </TabButton>
          <TabButton active={tab === "archived"} onClick={() => setTab("archived")}>
            Archived
          </TabButton>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Filters card */}
        <div className="flex items-center gap-3 rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
          <p className="text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">
            Filters
          </p>
          <FilterPill label="Severity: All" />
          <FilterPill label="Type: All" />
          <FilterPill label="Assigned: Me" />
          <button className="ml-auto text-[12px] text-[var(--color-sanctuary-700)] hover:underline">
            Clear all filters
          </button>
        </div>

        {/* Active alerts pill */}
        <div className="grid grid-cols-[1fr_auto] items-center rounded-3xl bg-[var(--color-sanctuary-700)] p-5 text-white">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-white/60">
              Active Alerts
            </p>
            <p className="mt-2 font-display text-[44px] leading-none">
              {String(filtered.length).padStart(2, "0")}
            </p>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
            ⚑
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--color-ink-100)] bg-white/50 p-10 text-center text-[14px] text-[var(--color-ink-500)]">
            No alerts in this view.
          </div>
        ) : (
          filtered.map((a) => (
            <AlertCard
              key={a.id}
              alert={a}
              onPrimary={() => onResolve(a.id)}
              onSnooze={() => onSnooze(a.id)}
            />
          ))
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
          <h3 className="text-[14px] font-semibold text-[var(--color-ink-900)]">
            Device Status Map
          </h3>
          <div className="relative mt-4 grid h-[200px] place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_30%_40%,_var(--color-sanctuary-100),_var(--color-cream-100)_60%)]">
            <div className="absolute inset-0 grain pointer-events-none" />
            <MapPin x={26} y={42} tone="sanctuary" label="Unit 01 · OK" />
            <MapPin x={45} y={58} tone="danger" label="Unit 4B · Humidity" />
            <MapPin x={70} y={36} tone="sanctuary" label="PHARM-03 · OK" />
            <span className="absolute bottom-3 right-3 text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
              Chicago
            </span>
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
          <h3 className="text-[14px] font-semibold text-[var(--color-ink-900)]">
            Response Velocity
          </h3>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
            Average response time
          </p>
          <p className="mt-1 font-display text-[28px] leading-none text-[var(--color-ink-900)]">
            {MOCK_ALERTS_METRICS.averageResponseTime}
          </p>

          <p className="mt-4 text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
            Resolution rate
          </p>
          <div className="mt-1 h-1.5 rounded-full bg-[var(--color-cream-100)]">
            <div
              className="h-full rounded-full bg-[var(--color-sanctuary-500)]"
              style={{ width: `${MOCK_ALERTS_METRICS.resolutionRatePct}%` }}
            />
          </div>
          <p className="mt-1 text-[12px] font-semibold text-[var(--color-ink-900)]">
            {MOCK_ALERTS_METRICS.resolutionRatePct}%
          </p>

          <div className="mt-5 inline-flex items-start gap-2 rounded-2xl bg-[var(--color-cream-100)] p-3">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 text-[var(--color-sanctuary-600)]" />
            <p className="text-[11px] leading-relaxed text-[var(--color-ink-700)]">
              <span className="font-semibold text-[var(--color-sanctuary-700)]">
                AI Insight:
              </span>{" "}
              {MOCK_ALERTS_METRICS.aiInsight}
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]"
          : "text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]"
      )}
    >
      {children}
    </button>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-cream-100)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-sanctuary-50)]">
      {label}
      <span className="text-[var(--color-ink-400)]">▾</span>
    </button>
  );
}

function MapPin({
  x,
  y,
  tone,
  label,
}: {
  x: number;
  y: number;
  tone: "sanctuary" | "danger";
  label: string;
}) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-full"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span
        className={cn(
          "block h-3 w-3 rounded-full ring-4",
          tone === "danger"
            ? "bg-[var(--color-danger-500)] ring-[var(--color-danger-200)]/40"
            : "bg-[var(--color-sanctuary-500)] ring-[var(--color-sanctuary-200)]/50"
        )}
      />
      <span className="absolute left-5 top-0 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-[var(--color-ink-700)] shadow-sm">
        {label}
      </span>
    </div>
  );
}

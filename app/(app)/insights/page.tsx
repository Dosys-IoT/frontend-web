"use client";

import Link from "next/link";
import { ChevronDown, Download, Pill, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MOCK_AI_ADVICE,
  MOCK_ENV_TREND,
  MOCK_INSIGHTS_SUMMARY,
  MOCK_MEDICATION_ACTIVITY,
  MOCK_REFILL_FORECAST,
} from "@/lib/mocks";
import { Donut } from "@/components/insights/donut";
import { cn } from "@/lib/utils";

export default function InsightsPage() {
  const s = MOCK_INSIGHTS_SUMMARY;
  const maxTaken = Math.max(...MOCK_MEDICATION_ACTIVITY.map((d) => d.taken));
  const maxEnv = Math.max(...MOCK_ENV_TREND.map((d) => d.humidity));
  const minEnv = Math.min(...MOCK_ENV_TREND.map((d) => d.humidity));

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-400)]">
            Performance Analytics
          </p>
          <h1 className="mt-2 font-display text-[44px] leading-none text-[var(--color-ink-900)]">
            Insights
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            📅 Last 30 Days <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Export">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Adherence Rate"
          value={`${s.adherenceRatePct}%`}
          trend={`+${s.adherenceTrendPct}%`}
          trendTone="positive"
        />
        <MetricCard
          title="Active Prescriptions"
          value={String(s.activePrescriptions)}
        />
        <MetricCard
          title="Pending Refills"
          value={String(s.pendingRefills).padStart(2, "0")}
          tag={{ label: "Action Needed", tone: "amber" }}
        />
        <MetricCard
          title="Device Health"
          value={s.deviceHealth}
          tag={{ label: "OK", tone: "sanctuary" }}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Bar chart */}
        <article className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">
                Medication Activity
              </h2>
              <p className="text-[12px] text-[var(--color-ink-500)]">
                Daily dosage tracking across all devices
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-[var(--color-sanctuary-700)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-sanctuary-600)]" /> Taken
              </span>
              <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-500)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-ink-100)]" /> Missed
              </span>
            </div>
          </div>
          <div className="mt-6 flex h-[180px] items-end gap-3">
            {MOCK_MEDICATION_ACTIVITY.map((d, i) => {
              const takenPct = (d.taken / maxTaken) * 100;
              const missedPct = (d.missed / maxTaken) * 100;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full flex-1 flex-col-reverse">
                    <div
                      className="w-full rounded-t-md bg-[var(--color-sanctuary-600)]"
                      style={{ height: `${takenPct}%` }}
                    />
                    {missedPct > 0 && (
                      <div
                        className="w-full bg-[var(--color-danger-200)]"
                        style={{ height: `${missedPct}%` }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        {/* Daily adherence donut */}
        <article className="flex flex-col rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
          <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">
            Daily Adherence
          </h2>
          <div className="my-4 flex justify-center">
            <Donut pct={s.todayAdherencePct} label="Today" />
          </div>
          <div className="grid gap-3 text-[12px]">
            <RoutineRow label="Morning Routine" pct={s.morningRoutinePct} />
            <RoutineRow label="Evening Routine" pct={s.eveningRoutinePct} />
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
          <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">
            Refill Forecast
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {MOCK_REFILL_FORECAST.map((r) => {
              const pct = Math.min(100, Math.max(8, (r.daysLeft / 28) * 100));
              const low = r.daysLeft < 7;
              return (
                <li key={r.medication} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]">
                    <Pill className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[var(--color-ink-900)]">
                        {r.medication}
                      </span>
                      <span
                        className={cn(
                          "text-[12px]",
                          low ? "text-[var(--color-danger-600)]" : "text-[var(--color-ink-500)]"
                        )}
                      >
                        {r.daysLeft} Days Left
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-[var(--color-cream-100)]">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          low
                            ? "bg-[var(--color-danger-500)]"
                            : "bg-[var(--color-sanctuary-500)]"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">
                Storage Environment
              </h2>
              <p className="text-[12px] text-[var(--color-ink-500)]">
                Optimal humidity range: 30% – 50%
              </p>
            </div>
            <p className="font-display text-[32px] leading-none text-[var(--color-ink-900)]">
              42%
              <span className="ml-1 align-baseline text-[11px] font-sans uppercase text-[var(--color-ink-400)]">
                current
              </span>
            </p>
          </div>
          <svg viewBox="0 0 200 80" className="mt-4 h-[120px] w-full">
            <defs>
              <linearGradient id="envFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-sanctuary-500)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--color-sanctuary-500)" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            {(() => {
              const w = 200;
              const h = 80;
              const points = MOCK_ENV_TREND.map((d, i) => {
                const x = (i / (MOCK_ENV_TREND.length - 1)) * w;
                const y =
                  h - ((d.humidity - minEnv) / Math.max(1, maxEnv - minEnv)) * (h - 10) - 5;
                return [x, y] as const;
              });
              const linePath = points
                .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
                .join(" ");
              const areaPath = `${linePath} L${w},${h} L0,${h} Z`;
              return (
                <>
                  <path d={areaPath} fill="url(#envFill)" />
                  <path
                    d={linePath}
                    fill="none"
                    stroke="var(--color-sanctuary-600)"
                    strokeWidth={1.6}
                  />
                </>
              );
            })()}
          </svg>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>12 AM</span>
          </div>
        </article>
      </section>

      {/* AI advice */}
      <section className="relative overflow-hidden rounded-3xl bg-[var(--color-ink-900)] p-7 text-white">
        <div className="absolute inset-0 grain pointer-events-none" />
        <div className="relative grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/60">
              <Sparkles className="h-3 w-3" /> Personalized Advice
            </p>
            <h2 className="mt-3 font-display text-[28px] leading-tight">
              {MOCK_AI_ADVICE.headline}
            </h2>
            <p className="mt-3 max-w-[560px] text-[13px] leading-relaxed text-white/70">
              {MOCK_AI_ADVICE.body}
            </p>
            <Button variant="secondary" size="sm" className="mt-5">
              Review Storage Guide
            </Button>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
            <p className="text-[10px] uppercase tracking-wide text-white/60">
              Next Dose
            </p>
            <p className="mt-2 font-display text-[32px] leading-none">02:45 PM</p>
            <p className="mt-1 text-[12px] text-white/70">Metformin · 500mg</p>
            <Link
              href="/medications"
              className="mt-3 inline-block text-[11px] font-semibold text-[var(--color-sanctuary-300)] hover:underline"
            >
              View All →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  trend,
  trendTone,
  tag,
}: {
  title: string;
  value: string;
  trend?: string;
  trendTone?: "positive";
  tag?: { label: string; tone: "amber" | "sanctuary" };
}) {
  return (
    <article className="rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
      <div className="flex items-start justify-between">
        <p className="text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">
          {title}
        </p>
        {trend && (
          <span
            className={cn(
              "text-[11px] font-semibold",
              trendTone === "positive"
                ? "text-[var(--color-sanctuary-700)]"
                : "text-[var(--color-ink-700)]"
            )}
          >
            {trend}
          </span>
        )}
        {tag && (
          <Badge tone={tag.tone} className="normal-case">
            {tag.label}
          </Badge>
        )}
      </div>
      <p className="mt-3 font-display text-[36px] leading-none text-[var(--color-ink-900)]">
        {value}
      </p>
    </article>
  );
}

function RoutineRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[var(--color-ink-700)]">{label}</span>
        <span className="text-[12px] font-semibold text-[var(--color-ink-900)]">
          {pct}%
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-[var(--color-cream-100)]">
        <div
          className="h-full rounded-full bg-[var(--color-sanctuary-500)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

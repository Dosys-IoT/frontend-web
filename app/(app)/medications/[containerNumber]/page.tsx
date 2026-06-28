"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BellOff,
  Check,
  CheckCircle2,
  History,
  Pencil,
  PackagePlus,
  Share2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { devicesApi } from "@/lib/api/endpoints";
import type { AdherenceItem } from "@/lib/api/types";
import { getMedicationExtras } from "@/lib/mocks";
import { selectPrimaryDevice } from "@/lib/domain/device-selection";
import {
  ComplianceBars,
  type ComplianceDay,
} from "@/components/medications/compliance-bars";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dayLabel(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
}

export default function MedicationDetailPage({
  params,
}: {
  params: Promise<{ containerNumber: string }>;
}) {
  const { containerNumber: raw } = use(params);
  const containerNumber = Number(raw);
  const extras = getMedicationExtras(containerNumber);

  const devicesQ = useQuery({ queryKey: ["devices"], queryFn: devicesApi.list });
  const deviceId = selectPrimaryDevice(devicesQ.data).apiDeviceId;

  const containersQ = useQuery({
    queryKey: ["containers", deviceId],
    queryFn: () => devicesApi.containers(deviceId!),
    enabled: !!deviceId,
  });

  const adherenceQ = useQuery({
    queryKey: ["adherence", deviceId, monthKey(new Date())],
    queryFn: () => devicesApi.adherenceCalendar(deviceId!, monthKey(new Date())),
    enabled: !!deviceId,
  });

  const container = (containersQ.data ?? []).find(
    (c) => c.containerNumber === containerNumber
  );

  const weeklyDays: ComplianceDay[] = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const days = adherenceQ.data?.days ?? [];
    const arr: ComplianceDay[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dayItems = days.find((x) => x.date === iso)?.items ?? [];
      const own = dayItems.filter((it) => it.containerNumber === containerNumber);
      let state: ComplianceDay["state"] = "pending";
      if (own.length > 0) {
        if (own.every((it) => it.status === "TAKEN")) state = "taken";
        else if (own.some((it) => it.status === "MISSED")) state = "missed";
      }
      arr.push({
        label: dayLabel(d),
        state,
        isToday: iso === todayIso,
      });
    }
    return arr;
  }, [adherenceQ.data, containerNumber]);

  const activityItems = useMemo(() => {
    const days = adherenceQ.data?.days ?? [];
    return days
      .flatMap((d) => d.items)
      .filter((i) => i.containerNumber === containerNumber)
      .sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1))
      .slice(0, 6);
  }, [adherenceQ.data, containerNumber]);

  const estimateDaysRemaining =
    container && container.remainingPills > 0
      ? Math.max(1, Math.round(container.remainingPills / 2))
      : 0;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[12px] text-[var(--color-ink-400)]">
            <Link href="/medications" className="hover:text-[var(--color-ink-700)]">
              Medications
            </Link>{" "}
            /{" "}
            <span className="font-medium uppercase text-[var(--color-ink-700)]">
              {container?.medicationName ?? `Container ${containerNumber}`}
            </span>
          </p>
          <h1 className="mt-2 font-display text-[40px] leading-none text-[var(--color-ink-900)]">
            Medication Details
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/medications/${containerNumber}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit Details
            </Link>
          </Button>
          <Button variant="secondary" size="sm">
            <History className="h-3.5 w-3.5" />
            Full History
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT */}
        <div className="flex flex-col gap-6">
          <section className="grid grid-cols-[260px_1fr] gap-6 rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <div className="grid h-[260px] place-items-center rounded-3xl bg-gradient-to-br from-[var(--color-ink-900)] to-[var(--color-sanctuary-900)]">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-white/10 backdrop-blur">
                <span className="font-display text-4xl text-white/90">
                  {container?.medicationName?.[0] ?? "M"}
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <Badge tone="sanctuary" className="self-start">
                Active Prescription
              </Badge>
              <h2 className="mt-3 font-display text-[34px] leading-none text-[var(--color-ink-900)]">
                {container?.medicationName ?? "—"}
              </h2>
              <p className="mt-1 text-[13px] text-[var(--color-ink-500)]">
                {extras.prescriptionLabel ?? container?.dosageLabel ?? ""}
              </p>

              <div className="mt-auto rounded-2xl bg-[var(--color-cream-100)] p-4">
                <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
                  Pill Count Estimate
                </p>
                <p className="mt-1 font-display text-3xl text-[var(--color-ink-900)]">
                  {container?.remainingPills ?? 0}
                </p>
                <p className="text-[12px] text-[var(--color-ink-500)]">
                  approx. {estimateDaysRemaining} days remaining
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[var(--color-ink-900)]">
                Weekly Compliance Schedule
              </h3>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-[var(--color-sanctuary-700)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-sanctuary-600)]" /> Taken
                </span>
                <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-500)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-ink-100)]" /> Pending
                </span>
              </div>
            </div>
            <div className="mt-5">
              <ComplianceBars days={weeklyDays} />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <h3 className="text-[15px] font-semibold text-[var(--color-ink-900)]">
              Detailed Activity Log
            </h3>
            <ul className="mt-4 flex flex-col divide-y divide-[var(--color-ink-50)]">
              {activityItems.length === 0 ? (
                <li className="py-6 text-center text-[13px] text-[var(--color-ink-400)]">
                  No activity recorded yet for this medication.
                </li>
              ) : (
                activityItems.map((it, i) => <ActivityRow key={i} item={it} />)
              )}
            </ul>
            <button className="mt-4 w-full rounded-full border border-[var(--color-ink-100)] py-2.5 text-[13px] font-medium text-[var(--color-ink-500)] hover:bg-[var(--color-cream-100)]">
              Load More Activity
            </button>
          </section>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-5">
          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
              Device Status
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-sanctuary-100)] font-display text-2xl text-[var(--color-sanctuary-700)]">
                #{containerNumber}
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[var(--color-ink-900)]">
                  Compartment
                </p>
                <p className="text-[12px] text-[var(--color-sanctuary-700)]">
                  Connected &amp; Calibrated
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-2.5 text-[13px]">
              <div className="flex items-center justify-between text-[var(--color-ink-500)]">
                <span>Weight Reading</span>
                <span className="font-semibold text-[var(--color-ink-900)]">
                  {extras.pillWeightMg * Math.max(1, container?.remainingPills ?? 0)}mg
                  <span className="ml-1 text-[11px] text-[var(--color-ink-400)]">
                    ±5mg
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[var(--color-ink-500)]">
                <span>Refill Level</span>
                <span className="font-semibold text-[var(--color-ink-900)]">
                  {container ? Math.round((container.remainingPills / 30) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-[var(--color-ink-50)] pt-4">
              <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
                Quick Actions
              </p>
              <div className="mt-3 flex flex-col gap-1">
                <ActionRow icon={<PackagePlus className="h-4 w-4" />} label="Request Refill" />
                <ActionRow icon={<BellOff className="h-4 w-4" />} label="Mute Alerts (2h)" />
                <ActionRow icon={<Share2 className="h-4 w-4" />} label="Share Report" />
                <ActionRow
                  icon={<Trash2 className="h-4 w-4" />}
                  label="Remove Medication"
                  tone="danger"
                />
              </div>
            </div>
          </section>

          {extras.doctorNote && (
            <section className="rounded-3xl bg-[var(--color-sanctuary-700)] p-6 text-white">
              <p className="text-[10px] uppercase tracking-wide text-white/60">
                Doctor's Note
              </p>
              <p className="mt-3 font-display text-[18px] leading-snug">
                &ldquo;{extras.doctorNote.body}&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-2 text-[12px] text-white/80">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
                  {extras.doctorNote.author
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                {extras.doctorNote.author}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ item }: { item: AdherenceItem }) {
  const scheduled = new Date(item.scheduledAt);
  const confirmed = item.confirmedAt ? new Date(item.confirmedAt) : null;
  const delayedMin =
    confirmed && item.status === "TAKEN"
      ? Math.round((confirmed.getTime() - scheduled.getTime()) / 60_000)
      : 0;
  const isMissed = item.status === "MISSED";
  const isDelayed = !isMissed && Math.abs(delayedMin) > 10;

  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={`grid h-8 w-8 place-items-center rounded-full ${
          isMissed
            ? "bg-[var(--color-danger-50)] text-[var(--color-danger-600)]"
            : "bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]"
        }`}
      >
        {isMissed ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
      </span>
      <div className="flex-1 text-[13px]">
        <p className="font-semibold text-[var(--color-ink-900)]">
          {isMissed
            ? "Delayed Administration"
            : isDelayed
              ? "Dosage Confirmed (delayed)"
              : "Dosage Confirmed"}
        </p>
        <p className="text-[12px] text-[var(--color-ink-500)]">
          {isMissed
            ? `Dose taken outside scheduled window`
            : `Confirmed via dispenser compartment #${item.containerNumber}`}
        </p>
      </div>
      <div className="text-right text-[12px]">
        <p className="font-semibold text-[var(--color-ink-900)]">
          {scheduled.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </p>
        <p className="text-[11px] uppercase text-[var(--color-ink-400)]">
          {scheduled.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>
    </li>
  );
}

function ActionRow({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone?: "danger";
}) {
  return (
    <button
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13px] transition-colors ${
        tone === "danger"
          ? "text-[var(--color-danger-600)] hover:bg-[var(--color-danger-50)]"
          : "text-[var(--color-ink-700)] hover:bg-[var(--color-cream-100)]"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-[var(--color-ink-400)]">›</span>
    </button>
  );
}

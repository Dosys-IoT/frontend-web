"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Bell, Boxes, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { devicesApi } from "@/lib/api/endpoints";
import { selectNextDose } from "@/lib/domain/next-dose";
import { getMedicationExtras } from "@/lib/mocks";
import { MedicationRow } from "@/components/medications/medication-row";
import { CreateDeviceCard } from "@/components/device/create-device-card";
import { ErrorState } from "@/components/ui/error-state";

function formatNextDose(at: Date | null, now: Date): string | null {
  if (!at) return null;
  const diffMs = at.getTime() - now.getTime();
  const time = at.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (at.toDateString() === now.toDateString()) return `Today, ${time}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (at.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${time}`;
  return `${at.toLocaleDateString("en-US", { weekday: "short" })}, ${time}`;
  // (diffMs is intentionally unused here; reserved for future "in N hours" UX.)
  void diffMs;
}

export default function MedicationsPage() {
  const devicesQ = useQuery({ queryKey: ["devices"], queryFn: devicesApi.list });
  const deviceId = devicesQ.data?.[0]?.id;

  const containersQ = useQuery({
    queryKey: ["containers", deviceId],
    queryFn: () => devicesApi.containers(deviceId!),
    enabled: !!deviceId,
  });

  const schedulesQ = useQuery({
    queryKey: ["schedules", deviceId],
    queryFn: () => devicesApi.schedules(deviceId!),
    enabled: !!deviceId,
  });

  const rows = useMemo(() => {
    const containers = containersQ.data ?? [];
    const schedules = schedulesQ.data ?? [];
    const now = new Date();
    return containers
      .filter((c) => c.medicationName)
      .map((c) => {
        const extras = getMedicationExtras(c.containerNumber);
        const ownSchedules = schedules.filter((s) => s.containerNumber === c.containerNumber);
        const upcoming = selectNextDose(ownSchedules, now);
        return {
          containerNumber: c.containerNumber,
          medicationName: c.medicationName ?? "Unassigned",
          dosageLabel: c.dosageLabel,
          status: extras.status,
          nextDoseLabel: formatNextDose(upcoming?.scheduledAt ?? null, now),
          nextDoseContext: extras.withMealContext ?? null,
          remainingPills: c.remainingPills,
          refillThreshold: extras.refillThreshold,
        };
      });
  }, [containersQ.data, schedulesQ.data]);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[44px] leading-none text-[var(--color-ink-900)]">
            Medications
          </h1>
          <p className="mt-3 text-[15px] text-[var(--color-ink-500)]">
            Manage your clinical prescriptions and compartment synchronization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href="/medications/new">
              <Plus className="h-4 w-4" />
              Add New Medication
            </Link>
          </Button>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        {devicesQ.isLoading ? (
          <SkeletonRows />
        ) : devicesQ.isError || containersQ.isError || schedulesQ.isError ? (
          <ErrorState
            onRetry={() => {
              devicesQ.refetch();
              if (deviceId) {
                containersQ.refetch();
                schedulesQ.refetch();
              }
            }}
          />
        ) : !deviceId ? (
          <CreateDeviceCard />
        ) : containersQ.isLoading || schedulesQ.isLoading ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          rows.map((r) => <MedicationRow key={r.containerNumber} {...r} />)
        )}
      </section>

      <section className="mt-2 grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon={<Bell className="h-4 w-4" />}
          title="Dose Reminders"
          body="Each schedule triggers a reminder at the exact time you set, so no dose slips through."
        />
        <FeatureCard
          icon={<Boxes className="h-4 w-4" />}
          title="Inventory Sync"
          body="Real-time tracking of compartment weight ensures you never miss a manual refill threshold."
        />
        <FeatureCard
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Pharmacy Connect"
          body="Automated refill requests are sent to your preferred provider when supply hits critical levels."
        />
      </section>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-ink-50)] pt-4 text-[12px] text-[var(--color-ink-400)]">
        <span>System Health: Optimal</span>
        <div className="flex items-center gap-5">
          <a href="#" className="hover:text-[var(--color-ink-700)]">Privacy Policy</a>
          <a href="#" className="hover:text-[var(--color-ink-700)]">Clinical Terms</a>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-sanctuary-500)]" />
            Dosys v2.4.1
          </span>
        </div>
      </footer>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[88px] rounded-3xl bg-white/60 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60 animate-pulse"
        />
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--color-ink-100)] bg-white/50 p-10 text-center">
      <p className="font-display text-2xl text-[var(--color-ink-900)]">
        No medications loaded yet.
      </p>
      <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
        Assign a medication to one of your device compartments to get started.
      </p>
      <Button asChild className="mt-5">
        <Link href="/medications/new">
          <Plus className="h-4 w-4" />
          Add New Medication
        </Link>
      </Button>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
      <span className="inline-grid h-9 w-9 place-items-center rounded-full bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]">
        {icon}
      </span>
      <h3 className="mt-4 text-[15px] font-semibold text-[var(--color-ink-900)]">{title}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-500)]">{body}</p>
    </div>
  );
}

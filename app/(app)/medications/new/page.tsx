"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { devicesApi } from "@/lib/api/endpoints";
import { selectPrimaryDevice } from "@/lib/domain/device-selection";
import type { DayOfWeek } from "@/lib/api/types";
import { CompartmentPicker } from "@/components/medications/compartment-picker";
import {
  FrequencyPicker,
  type DoseFrequency,
} from "@/components/medications/frequency-picker";

const ALL_DAYS: DayOfWeek[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY",
  "FRIDAY", "SATURDAY", "SUNDAY",
];

function parseTime(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(":").map(Number);
  return { hour: h ?? 8, minute: m ?? 0 };
}

function addHours(time: { hour: number; minute: number }, hours: number) {
  const total = time.hour * 60 + time.minute + hours * 60;
  return { hour: Math.floor((total / 60) % 24), minute: total % 60 };
}

export default function AddMedicationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const devicesQ = useQuery({ queryKey: ["devices"], queryFn: devicesApi.list });
  const deviceId = selectPrimaryDevice(devicesQ.data).apiDeviceId;

  const containersQ = useQuery({
    queryKey: ["containers", deviceId],
    queryFn: () => devicesApi.containers(deviceId!),
    enabled: !!deviceId,
  });

  const usedSlots = (containersQ.data ?? [])
    .filter((c) => !!c.medicationName)
    .map((c) => c.containerNumber);

  const [compartment, setCompartment] = useState(1);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [loadedQty, setLoadedQty] = useState("30");
  const [refillThreshold, setRefillThreshold] = useState("5"); // TODO(backend)
  const [pillWeightMg, setPillWeightMg] = useState("0.00"); // TODO(backend)
  const [frequency, setFrequency] = useState<DoseFrequency>("ONCE");
  const [primaryTime, setPrimaryTime] = useState("08:00");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!deviceId) throw new Error("No device available");
      await devicesApi.upsertContainer(deviceId, compartment, {
        medicationName: name,
        dosageLabel: dosage || undefined,
        remainingPills: Number(loadedQty) || 0,
        isEnabled: true,
      });
      if (frequency !== "AS_NEEDED") {
        const t = parseTime(primaryTime);
        await devicesApi.createSchedule(deviceId, {
          containerNumber: compartment,
          time: { hour: t.hour, minute: t.minute },
          daysOfWeek: ALL_DAYS,
          isActive: true,
        });
        if (frequency === "TWICE") {
          const t2 = addHours(t, 12);
          await devicesApi.createSchedule(deviceId, {
            containerNumber: compartment,
            time: { hour: t2.hour, minute: t2.minute },
            daysOfWeek: ALL_DAYS,
            isActive: true,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["containers", deviceId] });
      queryClient.invalidateQueries({ queryKey: ["schedules", deviceId] });
      toast.success(`${name || "Medication"} added.`);
      router.push("/medications");
    },
    onError: (err) => {
      toast.error(err.message || "Could not save the medication.");
    },
  });

  const canSubmit =
    !!deviceId &&
    !usedSlots.includes(compartment) &&
    name.trim().length > 1 &&
    !mutation.isPending;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-7">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] text-[var(--color-ink-400)]">
            <Link href="/medications" className="hover:text-[var(--color-ink-700)]">
              Medications
            </Link>{" "}
            ›{" "}
            <span className="font-medium text-[var(--color-ink-700)]">New Entry</span>
          </p>
          <h1 className="mt-2 font-display text-[44px] leading-none text-[var(--color-ink-900)]">
            Add Medication
          </h1>
          <p className="mt-3 max-w-[560px] text-[14px] text-[var(--color-ink-500)]">
            Configure your clinical regimen. Ensure high precision for device calibration
            by entering exact pill weights.
          </p>
        </div>
        <DeviceStatusPill connected={!!deviceId} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">
          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <SectionTitle icon="🔗" label="Medication Details" />
            <div className="mt-4 grid gap-4">
              <div>
                <Label htmlFor="med-name">Medication Name</Label>
                <Input
                  id="med-name"
                  className="mt-1.5"
                  placeholder="e.g. Lisinopril 10mg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="dosage">Dosage Label</Label>
                  <Input
                    id="dosage"
                    className="mt-1.5"
                    placeholder="e.g. 10mg Tablet"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="loaded">Loaded Quantity</Label>
                  <div className="mt-1.5 relative">
                    <Input
                      id="loaded"
                      type="number"
                      min={0}
                      value={loadedQty}
                      onChange={(e) => setLoadedQty(e.target.value)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[var(--color-ink-400)]">
                      Pills
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="refill">
                    Refill Threshold{" "}
                    <span className="text-[11px] font-normal text-[var(--color-ink-400)]">
                      (mock)
                    </span>
                  </Label>
                  <div className="mt-1.5 relative">
                    <Input
                      id="refill"
                      type="number"
                      min={0}
                      value={refillThreshold}
                      onChange={(e) => setRefillThreshold(e.target.value)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[var(--color-ink-400)]">
                      Pills
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <div className="flex items-center justify-between">
              <SectionTitle icon="⚖" label="Precision Calibration" />
              <Button variant="secondary" size="sm" type="button" disabled>
                Calibrate Now
              </Button>
            </div>
            <p className="mt-2 text-[12px] text-[var(--color-ink-500)]">
              Required for accurate dispensing weight checks.{" "}
              <span className="text-[var(--color-amber-500)]">(mock — backend pending)</span>
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1.2fr]">
              <div>
                <Label htmlFor="pill-weight">Individual Pill Weight</Label>
                <div className="mt-1.5 relative">
                  <Input
                    id="pill-weight"
                    type="number"
                    step="0.01"
                    value={pillWeightMg}
                    onChange={(e) => setPillWeightMg(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[var(--color-ink-400)]">
                    mg
                  </span>
                </div>
              </div>
              <p className="rounded-2xl bg-[var(--color-cream-100)] p-4 text-[12px] leading-relaxed text-[var(--color-ink-500)]">
                Place 5 pills on the device calibration tray to automatically calculate
                the mean weight for higher accuracy.
              </p>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-5">
          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <SectionTitle icon="" label="Device Mapping" />
            <p className="mt-1 text-[12px] uppercase tracking-wide text-[var(--color-ink-400)]">
              Assigned Compartment
            </p>
            <div className="mt-3">
              <CompartmentPicker
                value={compartment}
                onChange={setCompartment}
                disabledNumbers={usedSlots}
              />
            </div>
            {usedSlots.includes(compartment) && (
              <p className="mt-2 text-[12px] text-[var(--color-danger-600)]">
                Compartment {compartment} is already in use.
              </p>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <SectionTitle icon="" label="Schedule Configuration" />
            <div className="mt-4 grid gap-4">
              <div>
                <Label>Pills per Dose</Label>
                <div className="mt-1.5 flex h-12 items-center rounded-xl border border-[var(--color-ink-100)] bg-[var(--color-cream-50)] px-4 text-[14px] text-[var(--color-ink-500)]">
                  1 Pill <span className="ml-auto text-[var(--color-ink-400)]">▾</span>
                </div>
              </div>
              <div>
                <Label>Daily Frequency</Label>
                <div className="mt-1.5">
                  <FrequencyPicker value={frequency} onChange={setFrequency} />
                </div>
              </div>
              <div>
                <Label htmlFor="primary-time">Primary Dose Time</Label>
                <Input
                  id="primary-time"
                  type="time"
                  className="mt-1.5"
                  value={primaryTime}
                  onChange={(e) => setPrimaryTime(e.target.value)}
                  disabled={frequency === "AS_NEEDED"}
                />
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-3xl bg-[var(--color-ink-900)] p-6 text-white">
            <div className="absolute inset-0 grain pointer-events-none" />
            <Sparkles className="h-5 w-5 text-[var(--color-sanctuary-300)]" />
            <p className="mt-12 text-[11px] uppercase tracking-[0.18em] text-white/60">
              Medical Grade Accuracy
            </p>
          </section>
        </div>
      </div>

      <footer className="flex items-center justify-end gap-4">
        <Link
          href="/medications"
          className="text-[13px] text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]"
        >
          Discard Draft
        </Link>
        <Button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit}
          size="lg"
        >
          <ShieldCheck className="h-4 w-4" />
          {mutation.isPending ? "Saving…" : "Save Medication"}
        </Button>
      </footer>

      {mutation.error && (
        <p className="text-right text-[13px] text-[var(--color-danger-600)]">
          Could not save: {(mutation.error as Error).message}
        </p>
      )}
    </div>
  );
}

function SectionTitle({ icon, label }: { icon: string; label: string }) {
  return (
    <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">
      <span className="mr-2 text-[var(--color-sanctuary-600)]">{icon}</span>
      {label}
    </h2>
  );
}

function DeviceStatusPill({ connected }: { connected: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--color-sanctuary-200)] bg-[var(--color-sanctuary-50)] px-4 py-3">
      <p className="text-[10px] uppercase tracking-wide text-[var(--color-sanctuary-700)]/70">
        Device Status
      </p>
      <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-sanctuary-700)]">
        <ShieldCheck className="h-3.5 w-3.5" />
        {connected ? "Connected & Synchronized" : "No device"}
      </p>
    </div>
  );
}

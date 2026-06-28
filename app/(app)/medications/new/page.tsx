"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { CompartmentPicker } from "@/components/medications/compartment-picker";
import { FrequencyPicker, type DoseFrequency } from "@/components/medications/frequency-picker";
import { devicesApi, edgeApi } from "@/lib/api/endpoints";
import type { UpsertContainerRequest } from "@/lib/api/types";
import { selectPrimaryDevice } from "@/lib/domain/device-selection";
import {
  ALL_DAYS,
  addHours,
  buildScheduleRequest,
  formatTimeInput,
  parseTimeInput,
} from "@/lib/domain/medication-form";

const PILL_OPTIONS = [1, 2, 3];

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
    .filter((container) => !!container.medicationName)
    .map((container) => container.containerNumber);

  const [containerNumber, setContainerNumber] = useState(1);
  const [name, setName] = useState("");
  const [dosageLabel, setDosageLabel] = useState("");
  const [remainingPills, setRemainingPills] = useState("30");
  const [pillsPerDose, setPillsPerDose] = useState(1);
  const [frequency, setFrequency] = useState<DoseFrequency>("ONCE");
  const [primaryTime, setPrimaryTime] = useState("08:00");

  const secondaryTime = useMemo(() => {
    const parsed = parseTimeInput(primaryTime);
    return formatTimeInput(addHours(parsed, 12));
  }, [primaryTime]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!deviceId) throw new Error("No device available");

      const containerPayload: UpsertContainerRequest = {
        medicationName: name.trim(),
        dosageLabel: dosageLabel.trim() || undefined,
        remainingPills: Number(remainingPills) || 0,
        isEnabled: true,
      };

      await devicesApi.upsertContainer(deviceId, containerNumber, containerPayload);

      for (const schedule of buildSchedules()) {
        await devicesApi.createSchedule(deviceId, schedule);
      }

      try {
        await edgeApi.configSync(String(deviceId));
      } catch (error) {
        toast.info(`Medication saved, but config sync failed: ${getErrorMessage(error)}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["containers", deviceId] });
      queryClient.invalidateQueries({ queryKey: ["schedules", deviceId] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast.success(`${name || "Medication"} saved.`);
      router.push("/medications");
    },
    onError: (error) => {
      console.error("Medication save failed", {
        deviceId,
        containerNumber,
        payload: {
          medicationName: name.trim(),
          dosageLabel: dosageLabel.trim() || undefined,
          remainingPills: Number(remainingPills) || 0,
          isEnabled: true,
          schedules: buildSchedules(),
        },
        error,
      });
      toast.error(`Could not save the medication: ${getErrorMessage(error)}`);
    },
  });

  const canSubmit =
    !!deviceId &&
    !usedSlots.includes(containerNumber) &&
    name.trim().length > 1 &&
    !mutation.isPending;

  function buildSchedules() {
    if (frequency === "AS_NEEDED") return [];
    const first = buildScheduleRequest(
      containerNumber,
      parseTimeInput(primaryTime),
      ALL_DAYS,
      true
    );
    if (frequency === "TWICE") {
      const second = buildScheduleRequest(
        containerNumber,
        parseTimeInput(secondaryTime),
        ALL_DAYS,
        true
      );
      return [first, second];
    }
    return [first];
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-7">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] text-[var(--color-ink-400)]">
            <Link href="/medications" className="hover:text-[var(--color-ink-700)]">
              Medications
            </Link>{" "}
            &gt;{" "}
            <span className="font-medium text-[var(--color-ink-700)]">New Entry</span>
          </p>
          <h1 className="mt-2 font-display text-[44px] leading-none text-[var(--color-ink-900)]">
            Add Medication
          </h1>
          <p className="mt-3 max-w-[620px] text-[14px] text-[var(--color-ink-500)]">
            Create the container and real schedules used by the ESP32. No calibration or weight
            workflow is involved here.
          </p>
        </div>
        <DeviceStatusPill connected={!!deviceId} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-5">
          <section className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
            <SectionTitle label="Medication Details" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="med-name">Medication Name</Label>
                <Input
                  id="med-name"
                  className="mt-1.5"
                  placeholder="e.g. Lisinopril"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="dosage">Dosage Label</Label>
                <Input
                  id="dosage"
                  className="mt-1.5"
                  placeholder="e.g. 10mg"
                  value={dosageLabel}
                  onChange={(e) => setDosageLabel(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="loaded">Loaded Quantity</Label>
                <Input
                  id="loaded"
                  type="number"
                  min={0}
                  className="mt-1.5"
                  value={remainingPills}
                  onChange={(e) => setRemainingPills(e.target.value)}
                />
              </div>
              <div>
                <Label>Pills per Dose</Label>
                <div className="mt-1.5 flex gap-2">
                  {PILL_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPillsPerDose(option)}
                      className={
                        "rounded-full px-4 py-2 text-[13px] font-medium transition-colors " +
                        (pillsPerDose === option
                          ? "bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]"
                          : "bg-[var(--color-cream-100)] text-[var(--color-ink-500)] hover:bg-[var(--color-sanctuary-50)]")
                      }
                    >
                      {option} pill{option > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
            <SectionTitle label="Assigned Compartment" />
            <p className="mt-1 text-[12px] uppercase tracking-wide text-[var(--color-ink-400)]">
              Container number
            </p>
            <div className="mt-3">
              <CompartmentPicker
                value={containerNumber}
                onChange={setContainerNumber}
                disabledNumbers={usedSlots}
              />
            </div>
            {usedSlots.includes(containerNumber) && (
              <p className="mt-2 text-[12px] text-[var(--color-danger-600)]">
                Compartment {containerNumber} is already in use.
              </p>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
            <SectionTitle label="Schedule Configuration" />
            <div className="mt-4 grid gap-4">
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
                />
              </div>
              <div>
                <Label>Secondary Dose Time</Label>
                <div className="mt-1.5 rounded-xl border border-[var(--color-ink-100)] bg-[var(--color-cream-50)] px-4 py-3 text-[14px] text-[var(--color-ink-500)]">
                  {frequency === "TWICE" ? secondaryTime : "Not used"}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-[var(--color-ink-900)] p-6 text-white shadow-[var(--shadow-card)]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">
              Real schedule flow
            </p>
            <p className="mt-4 text-[14px] leading-6 text-white/80">
              Container data is saved first. Then one or two schedules are created depending on the
              selected frequency. As Needed skips schedule creation.
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-[13px] text-white/80">
              <p className="font-medium text-white">Pills per dose</p>
              <p className="mt-1">
                Selected: {pillsPerDose} pill{pillsPerDose > 1 ? "s" : ""}. This value is kept in
                the UI for operator clarity and is not sent to the backend because the API does not
                persist it yet.
              </p>
            </div>
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
        <Button onClick={() => mutation.mutate()} disabled={!canSubmit} size="lg">
          <ShieldCheck className="h-4 w-4" />
          {mutation.isPending ? "Saving..." : "Save Medication"}
        </Button>
      </footer>
    </div>
  );
}

function SectionTitle({ label }: { label: string }) {
  return <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">{label}</h2>;
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

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const body = "body" in error ? (error as { body?: unknown }).body : undefined;
    if (body && typeof body === "object" && "message" in body) {
      const message = (body as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
    if ("message" in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  return "Request failed.";
}

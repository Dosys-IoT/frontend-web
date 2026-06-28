"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { CompartmentPicker } from "@/components/medications/compartment-picker";
import { FrequencyPicker, type DoseFrequency } from "@/components/medications/frequency-picker";
import { devicesApi, edgeApi } from "@/lib/api/endpoints";
import type { ScheduleResponse, UpsertContainerRequest } from "@/lib/api/types";
import { selectPrimaryDevice } from "@/lib/domain/device-selection";
import {
  ALL_DAYS,
  addHours,
  buildScheduleRequest,
  formatTimeInput,
  parseTimeInput,
} from "@/lib/domain/medication-form";

const PILL_OPTIONS = [1, 2, 3];

interface ExistingState {
  frequency: DoseFrequency;
  primaryTime: string;
  secondaryTime: string;
}

export default function EditMedicationPage({
  params,
}: {
  params: Promise<{ containerNumber: string }>;
}) {
  const { containerNumber: raw } = use(params);
  const containerNumber = Number(raw);
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

  const schedulesQ = useQuery({
    queryKey: ["schedules", deviceId],
    queryFn: () => devicesApi.schedules(deviceId!),
    enabled: !!deviceId,
  });

  const container = (containersQ.data ?? []).find((c) => c.containerNumber === containerNumber);
  const ownSchedules = useMemo(
    () => (schedulesQ.data ?? []).filter((s) => s.containerNumber === containerNumber),
    [schedulesQ.data, containerNumber]
  );

  const [name, setName] = useState("");
  const [dosageLabel, setDosageLabel] = useState("");
  const [remainingPills, setRemainingPills] = useState("30");
  const [pillsPerDose, setPillsPerDose] = useState(1);
  const [frequency, setFrequency] = useState<DoseFrequency>("ONCE");
  const [primaryTime, setPrimaryTime] = useState("08:00");

  useEffect(() => {
    if (!container) return;
    setName(container.medicationName ?? "");
    setDosageLabel(container.dosageLabel ?? "");
    setRemainingPills(String(container.remainingPills ?? 0));
  }, [container]);

  useEffect(() => {
    if (!ownSchedules.length) {
      setFrequency("AS_NEEDED");
      setPrimaryTime("08:00");
      return;
    }

    const next = deriveExistingState(ownSchedules);
    setFrequency(next.frequency);
    setPrimaryTime(next.primaryTime);
  }, [ownSchedules]);

  const secondaryTime = useMemo(() => {
    return formatTimeInput(addHours(parseTimeInput(primaryTime), 12));
  }, [primaryTime]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!deviceId || !container) throw new Error("Missing device or container");

      const containerPayload: UpsertContainerRequest = {
        medicationName: name.trim(),
        dosageLabel: dosageLabel.trim() || undefined,
        remainingPills: Number(remainingPills) || 0,
        isEnabled: true,
      };

      await devicesApi.upsertContainer(deviceId, containerNumber, containerPayload);

      await Promise.all(ownSchedules.map((schedule) => devicesApi.deleteSchedule(deviceId, schedule.id)));

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
      toast.success("Changes saved.");
      router.push(`/medications/${containerNumber}`);
    },
    onError: (error) => {
      console.error("Medication update failed", {
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
      toast.error(`Could not save the changes: ${getErrorMessage(error)}`);
    },
  });

  const canSubmit =
    !!deviceId &&
    !!container &&
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

  if (!container && containersQ.isFetched) {
    return (
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-4">
        <Link
          href="/medications"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-sanctuary-700)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Medications
        </Link>
        <div className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
          <h1 className="font-display text-[32px] text-[var(--color-ink-900)]">
            Container not found
          </h1>
          <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
            The selected container is not linked to this device yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-7">
      <header>
        <Link
          href={`/medications/${containerNumber}`}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-sanctuary-700)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Inventory
        </Link>
        <h1 className="mt-3 font-display text-[44px] leading-none text-[var(--color-ink-900)]">
          Edit Medication
        </h1>
        <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
          Update the real container and schedules for{" "}
          <span className="font-semibold text-[var(--color-sanctuary-700)]">
            {name || `Container ${containerNumber}`}
          </span>
          .
        </p>
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Paracetamol"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="dosage">Dosage Label</Label>
                <Input
                  id="dosage"
                  className="mt-1.5"
                  value={dosageLabel}
                  onChange={(e) => setDosageLabel(e.target.value)}
                  placeholder="e.g. 10mg"
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
            <div className="mt-3">
              <CompartmentPicker
                value={containerNumber}
                onChange={() => undefined}
                disabledNumbers={[]}
              />
            </div>
            <p className="mt-2 text-[12px] text-[var(--color-ink-500)]">
              Container number {containerNumber} is fixed for this edit view.
            </p>
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
              Medication sync
            </p>
            <p className="mt-4 text-[14px] leading-6 text-white/80">
              Saving the container updates the backend first. Then schedules are rebuilt from the
              selected frequency and time, and the Edge config sync is triggered so the ESP32 picks
              up the runtime config.
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-[13px] text-white/80">
              <p className="font-medium text-white">Pills per dose</p>
              <p className="mt-1">
                Selected: {pillsPerDose} pill{pillsPerDose > 1 ? "s" : ""}. This remains a UI
                control because the backend does not persist it yet.
              </p>
            </div>
          </section>
        </div>
      </div>

      <footer className="flex items-center gap-4">
        <Button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit}
          size="lg"
        >
          <ShieldCheck className="h-4 w-4" />
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Link
          href={`/medications/${containerNumber}`}
          className="text-[13px] text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]"
        >
          Cancel Updates
        </Link>
      </footer>
    </div>
  );
}

function deriveExistingState(schedules: ScheduleResponse[]): ExistingState {
  if (schedules.length >= 2) {
    const [first, second] = [...schedules].sort(compareScheduleTime);
    return {
      frequency: "TWICE",
      primaryTime: formatTimeInput(first.time),
      secondaryTime: formatTimeInput(second.time),
    };
  }

  const [single] = schedules;
  if (!single) {
    return {
      frequency: "AS_NEEDED",
      primaryTime: "08:00",
      secondaryTime: "20:00",
    };
  }

  return {
    frequency: "ONCE",
    primaryTime: formatTimeInput(single.time),
    secondaryTime: formatTimeInput(addHours(single.time, 12)),
  };
}

function compareScheduleTime(a: ScheduleResponse, b: ScheduleResponse) {
  const aMinutes = a.time.hour * 60 + a.time.minute;
  const bMinutes = b.time.hour * 60 + b.time.minute;
  return aMinutes - bMinutes;
}

function SectionTitle({ label }: { label: string }) {
  return <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">{label}</h2>;
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

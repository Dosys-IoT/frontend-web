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
import { CustomScheduleEditor } from "@/components/medications/custom-schedule-editor";
import { devicesApi, edgeApi } from "@/lib/api/endpoints";
import type { DayOfWeek, UpsertContainerRequest } from "@/lib/api/types";
import { selectPrimaryDevice } from "@/lib/domain/device-selection";
import {
  buildScheduleRequests,
  validateScheduleDraft,
} from "@/lib/domain/medication-schedules";

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
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [times, setTimes] = useState<string[]>(["08:00"]);

  const scheduleValidation = useMemo(
    () => validateScheduleDraft(selectedDays, times),
    [selectedDays, times]
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!deviceId) throw new Error("No device available");
      if (usedSlots.includes(containerNumber)) {
        throw new Error(`Compartment ${containerNumber} is already in use`);
      }
      const schedules = buildScheduleRequests(containerNumber, selectedDays, times);
      if (schedules.length === 0) {
        throw new Error("Add at least one valid reminder time");
      }

      const containerPayload: UpsertContainerRequest = {
        medicationName: name.trim(),
        dosageLabel: dosageLabel.trim() || undefined,
        remainingPills: Number(remainingPills) || 0,
        isEnabled: true,
      };

      await devicesApi.upsertContainer(deviceId, containerNumber, containerPayload);
      for (const schedule of schedules) {
        await devicesApi.createSchedule(deviceId, schedule);
      }

      try {
        await edgeApi.configSync(String(deviceId));
      } catch (error) {
        toast.info(`Medication saved, but device sync failed: ${getErrorMessage(error)}`);
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
          schedules: buildScheduleRequests(containerNumber, selectedDays, times),
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
    schedulesAreValid(scheduleValidation) &&
    !mutation.isPending;

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
          <p className="mt-3 max-w-[720px] text-[14px] text-[var(--color-ink-500)]">
            Create the container and custom reminder schedules used by the ESP32.
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
                  placeholder="e.g. Paracetamol"
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
            <CustomScheduleEditor
              daysOfWeek={selectedDays}
              times={times}
              onDaysChange={setSelectedDays}
              onTimesChange={setTimes}
              dayError={scheduleValidation.dayError}
              timeError={scheduleValidation.timeError}
              duplicateError={scheduleValidation.duplicateError}
            />
            <div className="mt-4 rounded-2xl border border-[var(--color-ink-100)] bg-[var(--color-cream-50)] p-4 text-[13px] text-[var(--color-ink-500)]">
              Selected times: {times.length > 0 ? times.join(", ") : "none"}
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

function schedulesAreValid(validation: { dayError?: string; timeError?: string; duplicateError?: string }) {
  return !validation.dayError && !validation.timeError && !validation.duplicateError;
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

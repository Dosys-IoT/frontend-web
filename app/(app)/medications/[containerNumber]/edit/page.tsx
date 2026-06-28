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
import { CustomScheduleEditor } from "@/components/medications/custom-schedule-editor";
import { devicesApi, edgeApi } from "@/lib/api/endpoints";
import type { DayOfWeek, UpsertContainerRequest } from "@/lib/api/types";
import { selectPrimaryDevice } from "@/lib/domain/device-selection";
import {
  buildScheduleRequests,
  deriveScheduleDraft,
  validateScheduleDraft,
} from "@/lib/domain/medication-schedules";

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
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const scheduleSeedKey = useMemo(
    () =>
      `${deviceId ?? "none"}:${containerNumber}:${ownSchedules
        .map((schedule) => {
          const time = `${schedule.time.hour}:${schedule.time.minute}:${schedule.time.second ?? 0}`;
          return `${schedule.id}:${time}:${schedule.daysOfWeek.join(",")}`;
        })
        .join("|")}`,
    [containerNumber, deviceId, ownSchedules]
  );
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!container) return;
    setName(container.medicationName ?? "");
    setDosageLabel(container.dosageLabel ?? "");
    setRemainingPills(String(container.remainingPills ?? 0));
  }, [container]);

  useEffect(() => {
    if (!containersQ.isFetched || !schedulesQ.isFetched || !container) return;
    if (hydratedKey === scheduleSeedKey) return;
    const draft = deriveScheduleDraft(ownSchedules);
    setSelectedDays(draft.daysOfWeek);
    setTimes(draft.times);
    setHydratedKey(scheduleSeedKey);
  }, [container, containersQ.isFetched, hydratedKey, ownSchedules, scheduleSeedKey, schedulesQ.isFetched]);

  const scheduleValidation = useMemo(
    () => validateScheduleDraft(selectedDays, times),
    [selectedDays, times]
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!deviceId || !container) throw new Error("Missing device or container");
      if (times.length === 0) throw new Error("Add at least one reminder time");
      if (!selectedDays.length) throw new Error("Select at least one day");

      const containerPayload: UpsertContainerRequest = {
        medicationName: name.trim(),
        dosageLabel: dosageLabel.trim() || undefined,
        remainingPills: Number(remainingPills) || 0,
        isEnabled: true,
      };

      await devicesApi.upsertContainer(deviceId, containerNumber, containerPayload);

      await Promise.all(
        ownSchedules.map((schedule) => devicesApi.deleteSchedule(deviceId, schedule.id))
      );

      const schedules = buildScheduleRequests(containerNumber, selectedDays, times);
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
          schedules: buildScheduleRequests(containerNumber, selectedDays, times),
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
    times.length > 0 &&
    selectedDays.length > 0 &&
    !scheduleValidation.dayError &&
    !scheduleValidation.timeError &&
    !scheduleValidation.duplicateError &&
    !mutation.isPending;

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
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
            <SectionTitle label="Assigned Compartment" />
            <div className="mt-3">
              <CompartmentPicker value={containerNumber} onChange={() => undefined} disabledNumbers={[]} />
            </div>
            <p className="mt-2 text-[12px] text-[var(--color-ink-500)]">
              Container number {containerNumber} is fixed for this edit view.
            </p>
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

      <footer className="flex items-center gap-4">
        <Button onClick={() => mutation.mutate()} disabled={!canSubmit} size="lg">
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

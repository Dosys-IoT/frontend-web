"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowLeft, Lightbulb, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/components/ui/toast";
import { devicesApi } from "@/lib/api/endpoints";
import type { DayOfWeek, ScheduleResponse } from "@/lib/api/types";
import { TimeSlotCard } from "@/components/medications/time-slot-card";
import { getMedicationExtras } from "@/lib/mocks";
import { selectPrimaryDevice } from "@/lib/domain/device-selection";

const ALL_DAYS: DayOfWeek[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY",
  "FRIDAY", "SATURDAY", "SUNDAY",
];

interface SlotState {
  id: number | null;
  hour: number;
  minute: number;
  contextLabel?: string;
}

function buildInitialSlots(schedules: ScheduleResponse[]): SlotState[] {
  // Mock context labels by index — TODO(backend): per-schedule notes.
  const contexts = ["Taken with breakfast", "Empty stomach required"];
  return schedules
    .map((s) => ({
      id: s.id,
      hour: s.time.hour,
      minute: s.time.minute,
    }))
    .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
    .map((s, i) => ({ ...s, contextLabel: contexts[i] }));
}

export default function EditMedicationPage({
  params,
}: {
  params: Promise<{ containerNumber: string }>;
}) {
  const { containerNumber: raw } = use(params);
  const containerNumber = Number(raw);
  const extras = getMedicationExtras(containerNumber);
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

  const container = (containersQ.data ?? []).find(
    (c) => c.containerNumber === containerNumber
  );
  const ownSchedules = useMemo(
    () =>
      (schedulesQ.data ?? []).filter((s) => s.containerNumber === containerNumber),
    [schedulesQ.data, containerNumber]
  );

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [slots, setSlots] = useState<SlotState[]>([]);
  const [lowStockWarn, setLowStockWarn] = useState(true);
  const [autoOrder, setAutoOrder] = useState(false);
  const [notes, setNotes] = useState(""); // TODO(backend): clinicalNotes field

  // Sync server state into local form once loaded.
  useEffect(() => {
    if (container) {
      setName(container.medicationName ?? "");
      setDosage(container.dosageLabel ?? "");
    }
  }, [container]);

  useEffect(() => {
    if (schedulesQ.data) setSlots(buildInitialSlots(ownSchedules));
  }, [schedulesQ.data, ownSchedules]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!deviceId || !container) throw new Error("Missing device or container");

      await devicesApi.upsertContainer(deviceId, containerNumber, {
        medicationName: name,
        dosageLabel: dosage || undefined,
        remainingPills: container.remainingPills,
        isEnabled: container.isEnabled,
      });

      const keptIds = new Set(slots.filter((s) => s.id !== null).map((s) => s.id!));
      // DELETE removed
      await Promise.all(
        ownSchedules
          .filter((s) => !keptIds.has(s.id))
          .map((s) => devicesApi.deleteSchedule(deviceId, s.id))
      );
      // PUT updated + POST new
      await Promise.all(
        slots.map((s) =>
          s.id === null
            ? devicesApi.createSchedule(deviceId, {
                containerNumber,
                time: { hour: s.hour, minute: s.minute },
                daysOfWeek: ALL_DAYS,
                isActive: true,
              })
            : devicesApi.updateSchedule(deviceId, s.id, {
                containerNumber,
                time: { hour: s.hour, minute: s.minute },
                daysOfWeek: ALL_DAYS,
                isActive: true,
              })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["containers", deviceId] });
      queryClient.invalidateQueries({ queryKey: ["schedules", deviceId] });
      toast.success("Changes saved.");
      router.push(`/medications/${containerNumber}`);
    },
    onError: (err) => {
      toast.error(err.message || "Could not save your changes.");
    },
  });

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
          Update dosage protocols and scheduling for{" "}
          <span className="text-[var(--color-sanctuary-700)] font-semibold">
            {name || "—"}
          </span>
          .
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-5">
          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <SectionTitle label="Dosage Details" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="med-name">Medication Name</Label>
                <Input
                  id="med-name"
                  className="mt-1.5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dosage">Dosage Label</Label>
                <Input
                  id="dosage"
                  className="mt-1.5"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 20mg Oral Tablet"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <SectionTitle label="Delivery Schedule" />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {slots.map((s, i) => (
                <TimeSlotCard
                  key={s.id ?? `new-${i}`}
                  hour={s.hour}
                  minute={s.minute}
                  contextLabel={s.contextLabel}
                  onTimeChange={(h, m) =>
                    setSlots((curr) =>
                      curr.map((x, idx) => (idx === i ? { ...x, hour: h, minute: m } : x))
                    )
                  }
                  onRemove={() =>
                    setSlots((curr) => curr.filter((_, idx) => idx !== i))
                  }
                />
              ))}
              <button
                type="button"
                onClick={() =>
                  setSlots((curr) => [
                    ...curr,
                    { id: null, hour: 12, minute: 0 },
                  ])
                }
                className="flex aspect-[3/2.4] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-ink-100)] text-[var(--color-ink-400)] hover:border-[var(--color-sanctuary-300)] hover:text-[var(--color-sanctuary-700)]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-ink-50)]">
                  <Plus className="h-4 w-4" />
                </span>
                <span className="text-[12px]">Add Slot</span>
              </button>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <SectionTitle label="Smart Refill Alerts" />
            <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
              <div className="rounded-2xl bg-[var(--color-cream-100)] p-5 text-center">
                <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
                  Remaining
                </p>
                <p className="mt-1 font-display text-[44px] leading-none text-[var(--color-ink-900)]">
                  {container?.remainingPills ?? 0}
                </p>
                <p className="text-[12px] text-[var(--color-ink-500)]">Capsules</p>
              </div>
              <div className="flex flex-col justify-center gap-4">
                <ToggleRow
                  title="Low Stock Warning"
                  body="Notify when below 5 units"
                  checked={lowStockWarn}
                  onChange={setLowStockWarn}
                />
                <ToggleRow
                  title="Auto-Order Enrollment"
                  body="Connect to MedLink Pharmacy"
                  checked={autoOrder}
                  onChange={setAutoOrder}
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
              Clinical Notes &amp; Observations{" "}
              <span className="ml-1 normal-case text-[var(--color-amber-500)]">(mock)</span>
            </p>
            <textarea
              className="mt-3 min-h-[100px] w-full resize-none rounded-2xl border border-[var(--color-ink-100)] bg-[var(--color-cream-50)] p-4 text-[13px] text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-400)] focus:border-[var(--color-sanctuary-500)] focus:outline-none focus:bg-white"
              placeholder="Add specific instructions or side effects observed…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-5">
          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
              Current Protocol
            </p>
            <div className="mt-3 grid h-[140px] place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-ink-900)] to-[var(--color-sanctuary-900)]">
              <span className="font-display text-3xl text-white/90">
                {name?.[0] ?? "—"}
              </span>
            </div>
            <h3 className="mt-4 font-display text-[26px] text-[var(--color-ink-900)]">
              {name || "—"}
            </h3>
            <p className="text-[12px] text-[var(--color-ink-500)]">
              {extras.prescriptionLabel ?? dosage}
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-[13px]">
              <ProtocolRow
                label="Frequency"
                value={`${slots.length || 0}× Daily`}
              />
              <ProtocolRow label="Method" value="Oral" />
              <ProtocolRow
                label="Supply"
                value={
                  container && container.remainingPills > extras.refillThreshold
                    ? "Healthy"
                    : "Low"
                }
              />
            </ul>
            <div className="mt-5 border-t border-[var(--color-ink-50)] pt-4">
              <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
                Device Pairing
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-sanctuary-100)] text-[12px] font-semibold text-[var(--color-sanctuary-700)]">
                  C{containerNumber}
                </span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-[var(--color-ink-900)]">
                    Dosys Case #0{containerNumber}2
                  </p>
                  <Badge tone="sanctuary" className="mt-0.5 normal-case">
                    Connected
                  </Badge>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-[var(--color-sanctuary-100)] p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[var(--color-sanctuary-700)]">
                <Lightbulb className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[var(--color-sanctuary-900)]">
                  Refill Logic
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-sanctuary-900)]/80">
                  Dosys monitors your pill weight in the smart case. If you skip a dose,
                  we automatically recalculate your refill alert date to prevent wasted
                  trips.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="flex items-center gap-4">
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !container}
          size="lg"
        >
          {mutation.isPending ? "Saving…" : "Save Changes"}
        </Button>
        <Link
          href={`/medications/${containerNumber}`}
          className="text-[13px] text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]"
        >
          Cancel Updates
        </Link>
        <button
          className="ml-auto text-[13px] font-medium text-[var(--color-danger-600)] hover:underline"
          type="button"
        >
          ⊘ Archive Med
        </button>
      </footer>

      {mutation.error && (
        <p className="text-right text-[13px] text-[var(--color-danger-600)]">
          Could not save: {(mutation.error as Error).message}
        </p>
      )}
    </div>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">{label}</h2>
  );
}

function ToggleRow({
  title,
  body,
  checked,
  onChange,
}: {
  title: string;
  body: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[14px] font-semibold text-[var(--color-ink-900)]">{title}</p>
        <p className="text-[12px] text-[var(--color-ink-500)]">{body}</p>
      </div>
      <Toggle checked={checked} onCheckedChange={onChange} label={title} />
    </div>
  );
}

function ProtocolRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between text-[var(--color-ink-500)]">
      <span>{label}</span>
      <span className="font-semibold text-[var(--color-ink-900)]">{value}</span>
    </li>
  );
}

"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, Pencil, Share2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComplianceBars } from "@/components/medications/compliance-bars";
import { useToast } from "@/components/ui/toast";
import { devicesApi, edgeApi } from "@/lib/api/endpoints";
import { selectPrimaryDevice } from "@/lib/domain/device-selection";
import {
  buildComplianceWindow,
  buildMedicationIntakeRows,
  flattenAdherenceCalendars,
  formatIntakeStatusLabel,
} from "@/lib/domain/medication-intakes";
import { getLimaMonthKey, getPreviousLimaMonthKey } from "@/lib/utils/date-time";

export default function MedicationDetailPage({
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

  const monthAnchor = useMemo(() => new Date(), []);
  const currentMonth = getLimaMonthKey(monthAnchor);
  const previousMonth = getPreviousLimaMonthKey(monthAnchor);

  const currentAdherenceQ = useQuery({
    queryKey: ["adherence", deviceId, currentMonth],
    queryFn: () => devicesApi.adherenceCalendar(deviceId!, currentMonth),
    enabled: !!deviceId && !!currentMonth,
  });

  const previousAdherenceQ = useQuery({
    queryKey: ["adherence", deviceId, previousMonth],
    queryFn: () => devicesApi.adherenceCalendar(deviceId!, previousMonth),
    enabled: !!deviceId && !!previousMonth && previousMonth !== currentMonth,
  });

  const container = (containersQ.data ?? []).find(
    (entry) => entry.containerNumber === containerNumber
  );

  const allIntakes = useMemo(
    () =>
      flattenAdherenceCalendars([
        currentAdherenceQ.data ?? { month: currentMonth, days: [] },
        previousAdherenceQ.data ?? { month: previousMonth, days: [] },
      ]).filter((item) => item.containerNumber === containerNumber),
    [containerNumber, currentAdherenceQ.data, currentMonth, previousAdherenceQ.data, previousMonth]
  );

  const weeklyDays = useMemo(
    () => buildComplianceWindow(allIntakes, monthAnchor),
    [allIntakes, monthAnchor]
  );

  const activityItems = useMemo(
    () =>
      buildMedicationIntakeRows(
        allIntakes,
        container?.medicationName ?? "",
        container?.dosageLabel ?? null
      ).slice(0, 8),
    [allIntakes, container?.dosageLabel, container?.medicationName]
  );

  const lowStock = !!container && container.remainingPills <= 5;

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!deviceId || !container) throw new Error("Missing device or container");
      const confirmed = window.confirm(
        "This will remove the medication from this container and disable its schedules. Continue?"
      );
      if (!confirmed) return { removed: false, syncFailed: false };

      const schedules = (await devicesApi.schedules(deviceId)).filter(
        (schedule) => schedule.containerNumber === containerNumber
      );

      for (const schedule of schedules) {
        await devicesApi.deleteSchedule(deviceId, schedule.id);
      }

      await devicesApi.upsertContainer(deviceId, containerNumber, {
        medicationName: "",
        dosageLabel: "",
        remainingPills: 0,
        isEnabled: false,
      });

      let syncFailed = false;
      try {
        await edgeApi.configSync(String(deviceId));
      } catch (error) {
        syncFailed = true;
        console.warn("Device sync after remove failed", error);
      }

      return { removed: true, syncFailed };
    },
    onSuccess: async (result) => {
      if (!result.removed) return;
      await queryClient.invalidateQueries({ queryKey: ["containers", deviceId] });
      await queryClient.invalidateQueries({ queryKey: ["schedules", deviceId] });
      await queryClient.invalidateQueries({ queryKey: ["devices"] });
      await queryClient.invalidateQueries({ queryKey: ["adherence", deviceId] });

      if (result.syncFailed) {
        toast.info(
          "Medication removed, but device sync failed. Please sync manually from Device Diagnostics."
        );
      } else {
        toast.success("Medication removed.");
      }
      router.push("/medications");
    },
    onError: (error) => {
      toast.error(`Could not remove the medication: ${getErrorMessage(error)}`);
    },
  });

  const medicationName = container?.medicationName?.trim() || `Container ${containerNumber}`;
  const dosageLabel = container?.dosageLabel?.trim() || "No dosage label";

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] text-[var(--color-ink-400)]">
            <Link href="/medications" className="hover:text-[var(--color-ink-700)]">
              Medications
            </Link>{" "}
            /{" "}
            <span className="font-medium uppercase text-[var(--color-ink-700)]">
              {medicationName}
            </span>
          </p>
          <h1 className="mt-2 font-display text-[40px] leading-none text-[var(--color-ink-900)]">
            Medication Detail
          </h1>
          <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
            Real intake history, schedule compliance and device actions for container #{containerNumber}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/medications/${containerNumber}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit Details
            </Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/medications/${containerNumber}/report`} target="_blank" rel="noreferrer">
              <Share2 className="h-3.5 w-3.5" />
              Share Report
            </Link>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="border-[var(--color-danger-200)] text-[var(--color-danger-700)] hover:bg-[var(--color-danger-50)]"
            onClick={() => removeMutation.mutate()}
            disabled={!container || removeMutation.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {removeMutation.isPending ? "Removing..." : "Remove Medication"}
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="grid grid-cols-[260px_1fr] gap-6 rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="grid h-[260px] place-items-center rounded-3xl bg-gradient-to-br from-[var(--color-ink-900)] to-[var(--color-sanctuary-900)]">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-white/10 backdrop-blur">
                <span className="font-display text-4xl text-white/90">
                  {medicationName[0] ?? "M"}
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <Badge tone="sanctuary" className="self-start">
                Linked Device
              </Badge>
              <h2 className="mt-3 font-display text-[34px] leading-none text-[var(--color-ink-900)]">
                {medicationName}
              </h2>
              <p className="mt-1 text-[13px] text-[var(--color-ink-500)]">{dosageLabel}</p>

              <div className="mt-auto grid gap-3">
                <div className="rounded-2xl bg-[var(--color-cream-100)] p-4">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
                    Remaining Pills
                  </p>
                  <p className="mt-1 font-display text-3xl text-[var(--color-ink-900)]">
                    {container?.remainingPills ?? 0}
                  </p>
                  <p className="text-[12px] text-[var(--color-ink-500)]">
                    Container #{containerNumber}
                  </p>
                </div>
                {lowStock && (
                  <div className="rounded-2xl border border-[var(--color-amber-200)] bg-[var(--color-amber-50)] p-4 text-[13px] text-[var(--color-amber-900)]">
                    Low stock: this medication is below 20%. Refill soon.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-[var(--color-ink-900)]">
                Weekly Compliance Schedule
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-[var(--color-sanctuary-700)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-sanctuary-600)]" /> Taken
                </span>
                <span className="inline-flex items-center gap-1.5 text-[var(--color-danger-700)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-danger-200)]" /> Missed
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

          <section className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-[var(--color-ink-900)]">
                Detailed Activity Log
              </h3>
              <span className="text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">
                Real intakes only
              </span>
            </div>
            <ul className="mt-4 flex flex-col divide-y divide-[var(--color-ink-50)]">
              {activityItems.length === 0 ? (
                <li className="py-6 text-center text-[13px] text-[var(--color-ink-400)]">
                  No activity recorded yet.
                </li>
              ) : (
                activityItems.map((item) => <ActivityRow key={item.id} item={item} />)
              )}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
            <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
              Device Overview
            </p>
            <div className="mt-4 grid gap-3 text-[13px] text-[var(--color-ink-500)]">
              <div className="flex items-center justify-between">
                <span>Container</span>
                <span className="font-semibold text-[var(--color-ink-900)]">#{containerNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="font-semibold text-[var(--color-ink-900)]">
                  {container?.isEnabled ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Recorded intakes</span>
                <span className="font-semibold text-[var(--color-ink-900)]">{allIntakes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Intake</span>
                <span className="font-semibold text-[var(--color-ink-900)]">
                  {activityItems[0]?.confirmedLabel || activityItems[0]?.scheduledLabel || "No records"}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
            <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
              Medication Sync
            </p>
            <p className="mt-3 text-[13px] leading-6 text-[var(--color-ink-500)]">
              Remove Medication disables the schedules and clears this container before syncing the device.
            </p>
            <p className="mt-3 text-[12px] text-[var(--color-ink-400)]">
              Use Share Report from the header to print or save the intake history as PDF.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function ActivityRow({
  item,
}: {
  item: ReturnType<typeof buildMedicationIntakeRows>[number];
}) {
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 grid h-8 w-8 place-items-center rounded-full ${
            item.status === "MISSED"
              ? "bg-[var(--color-danger-50)] text-[var(--color-danger-600)]"
              : "bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]"
          }`}
        >
          {item.status === "MISSED" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </span>
        <div>
          <p className="text-[13px] font-semibold text-[var(--color-ink-900)]">
            {item.medicationName}
          </p>
          <p className="text-[12px] text-[var(--color-ink-500)]">
            Container #{item.containerNumber}
            {item.dosageLabel ? `  -  ${item.dosageLabel}` : ""}
          </p>
          <p className="text-[12px] text-[var(--color-ink-500)]">
            Scheduled: {item.scheduledLabel || "Unavailable"}
            {item.confirmedLabel ? `  -  Confirmed: ${item.confirmedLabel}` : ""}
          </p>
        </div>
      </div>
      <div className="sm:text-right">
        <Badge
          tone={item.status === "TAKEN" ? "sanctuary" : item.status === "MISSED" ? "amber" : "ink"}
        >
          {formatIntakeStatusLabel(item.status)}
        </Badge>
        <p className="mt-1 text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">
          {item.localDateLabel}  -  {item.localDayKey}
        </p>
      </div>
    </li>
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


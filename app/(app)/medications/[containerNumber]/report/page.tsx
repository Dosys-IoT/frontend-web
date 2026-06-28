"use client";

import { use, useEffect, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { devicesApi } from "@/lib/api/endpoints";
import { selectPrimaryDevice } from "@/lib/domain/device-selection";
import {
  buildMedicationIntakeRows,
  flattenAdherenceCalendars,
  filterIntakesForRange,
  formatIntakeStatusLabel,
} from "@/lib/domain/medication-intakes";
import {
  formatLimaDate,
  formatLimaDateTime,
  getLimaMonthKey,
  getPreviousLimaMonthKey,
} from "@/lib/utils/date-time";

export default function MedicationReportPage({
  params,
}: {
  params: Promise<{ containerNumber: string }>;
}) {
  const { containerNumber: raw } = use(params);
  const containerNumber = Number(raw);

  const devicesQ = useQuery({ queryKey: ["devices"], queryFn: devicesApi.list });
  const deviceId = selectPrimaryDevice(devicesQ.data).apiDeviceId;

  const containersQ = useQuery({
    queryKey: ["containers", deviceId],
    queryFn: () => devicesApi.containers(deviceId!),
    enabled: !!deviceId,
  });

  const anchor = useMemo(() => new Date(), []);
  const currentMonth = getLimaMonthKey(anchor);
  const previousMonth = getPreviousLimaMonthKey(anchor);

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

  const reportRows = useMemo(() => {
    const start = new Date(anchor);
    start.setDate(start.getDate() - 6);
    const end = new Date(anchor);
    end.setHours(23, 59, 59, 999);
    return buildMedicationIntakeRows(
      filterIntakesForRange(allIntakes, start, end),
      container?.medicationName ?? "",
      container?.dosageLabel ?? null
    ).sort((a, b) => (a.scheduledAt < b.scheduledAt ? -1 : 1));
  }, [allIntakes, anchor, container?.dosageLabel, container?.medicationName]);

  const readyToPrint =
    containersQ.isFetched && currentAdherenceQ.isFetched && previousAdherenceQ.isFetched;

  useEffect(() => {
    if (!readyToPrint) return;
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, [readyToPrint]);

  return (
    <div className="min-h-screen bg-white px-6 py-8 text-[var(--color-ink-900)] print:px-0 print:py-0">
      <div className="mx-auto flex w-full max-w-[980px] flex-col gap-6">
        <header className="flex items-start justify-between gap-4 print:hidden">
          <div>
            <p className="text-[12px] text-[var(--color-ink-500)]">
              <Link href={`/medications/${containerNumber}`} className="underline">
                Back to medication
              </Link>
            </p>
            <h1 className="mt-2 font-display text-[36px] leading-none">Share Report</h1>
          </div>
          <Button onClick={() => window.print()}>Print / Save PDF</Button>
        </header>

        <section className="rounded-3xl border border-[var(--color-ink-100)] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">
                Medication report
              </p>
              <h2 className="mt-2 font-display text-[30px] leading-none">
                {container?.medicationName?.trim() || `Container ${containerNumber}`}
              </h2>
              <p className="mt-1 text-[14px] text-[var(--color-ink-500)]">
                {container?.dosageLabel?.trim() || "No dosage label"}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-cream-100)] px-4 py-3 text-[13px]">
              <p>
                Container <span className="font-semibold">#{containerNumber}</span>
              </p>
              <p>
                Remaining pills{" "}
                <span className="font-semibold">{container?.remainingPills ?? 0}</span>
              </p>
              <p>
                Generated{" "}
                <span className="font-semibold">{formatLimaDateTime(new Date())}</span>
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-2 text-[13px] text-[var(--color-ink-500)]">
            <p>
              Report range:{" "}
              <span className="font-semibold text-[var(--color-ink-900)]">
                Last 7 days
              </span>
            </p>
            <p>
              Intake dates are normalized to America/Lima and sorted chronologically for printing.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--color-ink-100)] p-6">
          <h3 className="text-[18px] font-semibold">Intake records</h3>
          {!readyToPrint ? (
            <p className="mt-4 text-[14px] text-[var(--color-ink-500)]">Loading report...</p>
          ) : null}
          {!readyToPrint ? null : reportRows.length === 0 ? (
            <p className="mt-4 text-[14px] text-[var(--color-ink-500)]">
              No intake records found for this period.
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--color-ink-100)]">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead className="bg-[var(--color-cream-50)]">
                  <tr className="text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Scheduled</th>
                    <th className="px-4 py-3">Recorded</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Pills</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row) => (
                    <tr key={row.id} className="border-t border-[var(--color-ink-100)]">
                      <td className="px-4 py-3">
                        <div className="font-medium">{formatLimaDate(row.scheduledAt)}</div>
                        <div className="text-[12px] text-[var(--color-ink-500)]">
                          {row.localDayKey}
                        </div>
                      </td>
                      <td className="px-4 py-3">{row.scheduledLabel || "Unavailable"}</td>
                      <td className="px-4 py-3">{row.confirmedLabel || "Pending"}</td>
                      <td className="px-4 py-3">{formatIntakeStatusLabel(row.status)}</td>
                      <td className="px-4 py-3">{row.pillsTaken ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

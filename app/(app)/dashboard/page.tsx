"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { devicesApi } from "@/lib/api/endpoints";
import { readSession } from "@/lib/auth/session";
import { selectNextDose } from "@/lib/domain/next-dose";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { UpcomingDoseCard } from "@/components/dashboard/upcoming-dose-card";
import { WeeklyScoreCard } from "@/components/dashboard/weekly-score-card";
import { CompartmentsGrid } from "@/components/dashboard/compartments-grid";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { HistoryPanel } from "@/components/dashboard/history-panel";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const session = typeof window !== "undefined" ? readSession() : null;

  const devicesQ = useQuery({
    queryKey: ["devices"],
    queryFn: devicesApi.list,
  });

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

  const envQ = useQuery({
    queryKey: ["env", deviceId],
    queryFn: () => devicesApi.latestEnvironment(deviceId!),
    enabled: !!deviceId,
  });

  const adherenceQ = useQuery({
    queryKey: ["adherence", deviceId, monthKey(new Date())],
    queryFn: () => devicesApi.adherenceCalendar(deviceId!, monthKey(new Date())),
    enabled: !!deviceId,
  });

  const upcoming = useMemo(
    () => selectNextDose(schedulesQ.data ?? [], new Date()),
    [schedulesQ.data]
  );

  const { weeklyScore, missedCount, dosesRemainingToday } = useMemo(() => {
    const days = adherenceQ.data?.days ?? [];
    const flatRecent = days.flatMap((d) => d.items).slice(-50);
    const taken = flatRecent.filter((i) => i.status === "TAKEN").length;
    const missed = flatRecent.filter((i) => i.status === "MISSED").length;
    const total = taken + missed;
    const score = total === 0 ? 100 : Math.round((taken / total) * 100);

    const today = new Date().toISOString().slice(0, 10);
    const todayItems = days.find((d) => d.date === today)?.items ?? [];
    const remaining = todayItems.filter((i) => i.status !== "TAKEN" && !i.confirmedAt).length;

    return {
      weeklyScore: score,
      missedCount: missed,
      dosesRemainingToday: remaining || (upcoming ? 1 : 0),
    };
  }, [adherenceQ.data, upcoming]);

  const alerts = useMemo(() => {
    const list: { id: string; type: "refill" | "environment"; title: string; body: string }[] = [];
    (containersQ.data ?? [])
      .filter((c) => c.isEnabled && c.remainingPills > 0 && c.remainingPills <= 5)
      .forEach((c) => {
        list.push({
          id: `refill-${c.id}`,
          type: "refill",
          title: `Refill required: ${c.medicationName ?? `Container ${c.containerNumber}`}`,
          body: `Only ${c.remainingPills} doses remaining in Compartment ${c.containerNumber}. Refill soon.`,
        });
      });
    if (envQ.data?.riskStatus === "RISK") {
      list.push({
        id: "env-risk",
        type: "environment",
        title: "Environmental Alert",
        body: `Humidity ${Math.round(envQ.data.humidity)}%, temperature ${envQ.data.temperature.toFixed(
          1
        )}°C. Outside safe storage range.`,
      });
    }
    return list;
  }, [containersQ.data, envQ.data]);

  const history = useMemo(() => {
    const days = adherenceQ.data?.days ?? [];
    return days
      .flatMap((d) => d.items.map((i) => ({ day: d.date, ...i })))
      .sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1))
      .slice(0, 4)
      .map((i) => {
        const scheduled = new Date(i.scheduledAt);
        const confirmed = i.confirmedAt ? new Date(i.confirmedAt) : null;
        const delayedMin =
          confirmed && i.status === "TAKEN"
            ? Math.round((confirmed.getTime() - scheduled.getTime()) / 60000)
            : 0;
        const status: "on-time" | "delayed" | "missed" =
          i.status === "MISSED"
            ? "missed"
            : Math.abs(delayedMin) > 10
              ? "delayed"
              : "on-time";
        return {
          id: `${i.scheduleId}-${i.scheduledAt}`,
          title: `Compartment ${i.containerNumber}`,
          detail: `Scheduled ${scheduled.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}${delayedMin && i.status === "TAKEN" ? ` (delayed ${delayedMin}m)` : ""}`,
          status,
        };
      });
  }, [adherenceQ.data]);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <DashboardHeader
        firstName={session?.user.firstName ?? "there"}
        dosesRemaining={dosesRemainingToday}
        deviceLinked={!!deviceId}
        humidity={envQ.data?.humidity ?? null}
        onSync={() => {
          devicesQ.refetch();
          if (deviceId) {
            containersQ.refetch();
            schedulesQ.refetch();
            envQ.refetch();
            adherenceQ.refetch();
          }
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <UpcomingDoseCard dose={upcoming} containers={containersQ.data ?? []} />
        <WeeklyScoreCard score={weeklyScore} missedDoses={missedCount} />
      </div>

      <CompartmentsGrid containers={containersQ.data ?? []} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AlertsPanel alerts={alerts} />
        <HistoryPanel entries={history} />
      </div>
    </div>
  );
}

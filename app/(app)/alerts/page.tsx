"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { devicesApi } from "@/lib/api/endpoints";
import { deriveAlerts } from "@/lib/domain/alerts";
import { selectPrimaryDevice } from "@/lib/domain/device-selection";
import { AlertCard } from "@/components/alerts/alert-card";
import { CreateDeviceCard } from "@/components/device/create-device-card";
import { ErrorState } from "@/components/ui/error-state";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AlertsPage() {
  const devicesQ = useQuery({ queryKey: ["devices"], queryFn: devicesApi.list });
  const selectedDevice = selectPrimaryDevice(devicesQ.data);
  const device = selectedDevice.device;
  const deviceId = selectedDevice.apiDeviceId;

  const containersQ = useQuery({
    queryKey: ["containers", deviceId],
    queryFn: () => devicesApi.containers(deviceId!),
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

  const alerts = useMemo(
    () =>
      deriveAlerts({
        device,
        containers: containersQ.data,
        environment: envQ.data,
        adherence: adherenceQ.data,
        now: new Date(),
      }),
    [device, containersQ.data, envQ.data, adherenceQ.data]
  );

  const loading =
    containersQ.isLoading || envQ.isLoading || adherenceQ.isLoading;
  const hasError =
    devicesQ.isError ||
    containersQ.isError ||
    envQ.isError ||
    adherenceQ.isError;

  const refetchAll = () => {
    devicesQ.refetch();
    if (deviceId) {
      containersQ.refetch();
      envQ.refetch();
      adherenceQ.refetch();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-400)]">
            System Pulse
          </p>
          <h1 className="mt-2 font-display text-[44px] leading-none text-[var(--color-ink-900)]">
            Alerts Center
          </h1>
          <p className="mt-2 max-w-[460px] text-[14px] text-[var(--color-ink-500)]">
            Live alerts from your device — stock levels, storage conditions and
            missed doses.
          </p>
        </div>

        {deviceId && (
          <div className="grid grid-cols-[1fr_auto] items-center gap-5 rounded-3xl bg-[var(--color-sanctuary-700)] px-6 py-5 text-white">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/60">
                Active Alerts
              </p>
              <p className="mt-2 font-display text-[44px] leading-none">
                {String(alerts.length).padStart(2, "0")}
              </p>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
              ⚑
            </span>
          </div>
        )}
      </header>

      <section className="flex flex-col gap-3">
        {devicesQ.isLoading ? (
          <SkeletonRows />
        ) : hasError ? (
          <ErrorState onRetry={refetchAll} />
        ) : !deviceId ? (
          <CreateDeviceCard />
        ) : loading ? (
          <SkeletonRows />
        ) : alerts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--color-ink-100)] bg-white/50 p-10 text-center">
            <p className="font-display text-2xl text-[var(--color-ink-900)]">
              All clear.
            </p>
            <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
              No active alerts. Stock, storage and adherence are all within range.
            </p>
          </div>
        ) : (
          alerts.map((a) => <AlertCard key={a.id} alert={a} />)
        )}
      </section>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[104px] rounded-3xl bg-white/60 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60 animate-pulse"
        />
      ))}
    </>
  );
}

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Droplets, Thermometer, Wifi, WifiOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { devicesApi } from "@/lib/api/endpoints";
import { getDeviceStatus } from "@/lib/domain/device-status";
import { EnvironmentChart } from "@/components/device/environment-chart";
import { CreateDeviceCard } from "@/components/device/create-device-card";
import { ErrorState } from "@/components/ui/error-state";

export default function DevicePage() {
  const devicesQ = useQuery({ queryKey: ["devices"], queryFn: devicesApi.list });
  const device = devicesQ.data?.[0];
  const deviceId = device?.id;

  // Stable 24h window so the history query key doesn't change every render.
  const range = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);

  const envQ = useQuery({
    queryKey: ["env", deviceId],
    queryFn: () => devicesApi.latestEnvironment(deviceId!),
    enabled: !!deviceId,
  });

  const historyQ = useQuery({
    queryKey: ["env-history", deviceId, range.from, range.to],
    queryFn: () => devicesApi.environmentHistory(deviceId!, range.from, range.to),
    enabled: !!deviceId,
  });

  const status = getDeviceStatus(device);

  const refetchAll = () => {
    devicesQ.refetch();
    if (deviceId) {
      envQ.refetch();
      historyQ.refetch();
    }
  };

  const hasError = devicesQ.isError || envQ.isError || historyQ.isError;
  const loading = envQ.isLoading || historyQ.isLoading;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <header>
        <h1 className="font-display text-[44px] leading-none text-[var(--color-ink-900)]">
          Device &amp; Environment
        </h1>
        <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
          Connection status and storage conditions of your Dosys device.
        </p>
      </header>

      {devicesQ.isLoading ? (
        <Skeleton />
      ) : hasError ? (
        <ErrorState onRetry={refetchAll} />
      ) : !deviceId ? (
        <CreateDeviceCard />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Connection status — US18 */}
          <section
            className={
              "flex items-center justify-between rounded-3xl p-6 text-white " +
              (status.online
                ? "bg-[var(--color-sanctuary-700)]"
                : "bg-[var(--color-ink-900)]")
            }
          >
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/60">
                {device?.name ?? "Device"}
              </p>
              <p className="mt-2 inline-flex items-center gap-2 font-display text-[30px] leading-none">
                {status.online ? (
                  <Wifi className="h-6 w-6" />
                ) : (
                  <WifiOff className="h-6 w-6" />
                )}
                {status.online ? "Online" : "Offline"}
              </p>
              <p className="mt-2 text-[12px] text-white/60">
                Last signal: {status.lastSeenLabel}
              </p>
            </div>
            <Badge
              tone={status.online ? "sanctuary" : "danger"}
              className="bg-white/15 text-white"
            >
              <span
                className={
                  "h-1.5 w-1.5 rounded-full " +
                  (status.online
                    ? "animate-pulse bg-[var(--color-sanctuary-300)]"
                    : "bg-[var(--color-danger-200)]")
                }
              />
              {status.online ? "Connected" : "No signal"}
            </Badge>
          </section>

          {/* Current readings */}
          <div className="grid gap-5 sm:grid-cols-2">
            <ReadingCard
              icon={<Thermometer className="h-4 w-4" />}
              label="Temperature"
              value={envQ.data ? `${envQ.data.temperature.toFixed(1)} C` : "No reading"}
              risk={envQ.data ? envQ.data.riskStatus !== "NORMAL" : false}
            />
            <ReadingCard
              icon={<Droplets className="h-4 w-4" />}
              label="Humidity"
              value={envQ.data ? `${Math.round(envQ.data.humidity)}%` : "No reading"}
              risk={envQ.data ? envQ.data.riskStatus !== "NORMAL" : false}
            />
          </div>

          {/* 24h trend — US22 */}
          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">
                Last 24 hours
              </h2>
              <span className="text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">
                Temperature &amp; Humidity
              </span>
            </div>
            <div className="mt-5">
              {loading ? (
                <div className="h-[200px] animate-pulse rounded-2xl bg-[var(--color-cream-50)]" />
              ) : (
                <EnvironmentChart readings={historyQ.data ?? []} />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ReadingCard({
  icon,
  label,
  value,
  risk,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  risk?: boolean;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
      <div className="flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--color-ink-900)]">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]">
            {icon}
          </span>
          {label}
        </h3>
        <Badge tone={risk ? "danger" : "sanctuary"} className="normal-case">
          {risk ? "At risk" : "Good"}
        </Badge>
      </div>
      <p className="mt-4 font-display text-[36px] leading-none text-[var(--color-ink-900)]">
        {value}
      </p>
      <p className="mt-2 text-[12px] text-[var(--color-ink-500)]">Latest reading</p>
    </section>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-[124px] animate-pulse rounded-3xl bg-white/60 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60" />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="h-[150px] animate-pulse rounded-3xl bg-white/60 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60" />
        <div className="h-[150px] animate-pulse rounded-3xl bg-white/60 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60" />
      </div>
      <div className="h-[280px] animate-pulse rounded-3xl bg-white/60 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60" />
    </div>
  );
}

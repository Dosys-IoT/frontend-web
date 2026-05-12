"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Battery, Speaker, Volume2, Wifi, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { devicesApi } from "@/lib/api/endpoints";
import {
  MOCK_COMPARTMENT_STATUS,
  MOCK_DEVICE_TELEMETRY,
  MOCK_SENSOR_EVENTS,
} from "@/lib/mocks";
import { CompartmentStatusGrid } from "@/components/device/compartment-status-grid";
import { SensorLog } from "@/components/device/sensor-log";

export default function DevicePage() {
  const devicesQ = useQuery({ queryKey: ["devices"], queryFn: devicesApi.list });
  const device = devicesQ.data?.[0];
  const deviceId = device?.id;

  const envQ = useQuery({
    queryKey: ["env", deviceId],
    queryFn: () => devicesApi.latestEnvironment(deviceId!),
    enabled: !!deviceId,
  });

  const telemetry = MOCK_DEVICE_TELEMETRY; // TODO(backend): real telemetry
  const humidity = envQ.data?.humidity ?? 34;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[44px] leading-none text-[var(--color-ink-900)]">
            Device
          </h1>
          <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
            Monitoring sanctuary hardware health and environment.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/device/calibration">⤾ Recalibrate Sensors</Link>
          </Button>
          <Button variant="secondary" size="sm">
            <Speaker className="h-3.5 w-3.5" />
            Test Speaker
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT */}
        <div className="flex flex-col gap-5">
          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">
                5-Compartment Physical Status
              </h2>
              <Badge tone="sanctuary" className="normal-case">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-sanctuary-500)]" />
                Live View
              </Badge>
            </div>
            <div className="mt-5">
              <CompartmentStatusGrid data={MOCK_COMPARTMENT_STATUS} />
            </div>
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
              <h3 className="text-[14px] font-semibold text-[var(--color-ink-900)]">
                Humidity Level
              </h3>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">
                Live reading
              </p>
              <div className="mt-4 h-2.5 rounded-full bg-[var(--color-cream-100)]">
                <div
                  className="h-full rounded-full bg-[var(--color-sanctuary-500)]"
                  style={{ width: `${Math.min(100, humidity)}%` }}
                />
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="font-display text-[32px] leading-none text-[var(--color-ink-900)]">
                  {Math.round(humidity)}%
                </span>
                <Badge tone="sanctuary" className="mb-1 normal-case">
                  Good
                </Badge>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-[var(--color-ink-500)]">
                Optimal conditions for dry pill preservation.
              </p>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
              <h3 className="text-[14px] font-semibold text-[var(--color-ink-900)]">
                Audio Reminders
              </h3>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]">
                  <Volume2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--color-ink-900)]">
                    Active
                  </p>
                  <p className="text-[12px] text-[var(--color-ink-500)]">
                    Volume: {telemetry.audioReminderVolume}%
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[12px] text-[var(--color-ink-500)]">
                Chime: &ldquo;{telemetry.audioChimeName}&rdquo; set as default.
              </p>
            </section>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-5">
          <section className="rounded-3xl bg-[var(--color-sanctuary-700)] p-6 text-white">
            <div className="flex items-start justify-between">
              <p className="text-[10px] uppercase tracking-wide text-white/60">
                Serial {telemetry.serial}
              </p>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                <Battery className="h-4 w-4" />
              </span>
            </div>
            <h2 className="mt-3 font-display text-[26px] leading-tight">
              {device?.name ?? "Dosys Home Sanctuary"}
            </h2>

            <dl className="mt-5 divide-y divide-white/10 text-[13px]">
              <DRow label="Last Sync" value={`${telemetry.lastSyncMinutesAgo} minutes ago`} />
              <DRow
                label="Battery Life"
                value={
                  <>
                    {telemetry.batteryPct}% <Battery className="ml-1 inline h-3.5 w-3.5" />
                  </>
                }
              />
              <DRow
                label="WiFi Strength"
                value={
                  <>
                    {telemetry.wifiRssiDbm} dBm{" "}
                    {telemetry.wifiRssiDbm > -70 ? (
                      <Wifi className="ml-1 inline h-3.5 w-3.5" />
                    ) : (
                      <WifiOff className="ml-1 inline h-3.5 w-3.5" />
                    )}
                  </>
                }
              />
              <DRow
                label="Firmware"
                value={`${telemetry.firmwareVersion} (${telemetry.firmwareChannel})`}
              />
            </dl>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-[var(--color-ink-900)]">
                Sensor Log
              </h3>
              <span className="text-[11px] text-[var(--color-ink-400)]">↻</span>
            </div>
            <div className="mt-4">
              <SensorLog events={MOCK_SENSOR_EVENTS} />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <p className="text-[13px] font-semibold text-[var(--color-ink-900)]">
              Desiccant Replacement
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-ink-500)]">
              Your humidity buffer is at{" "}
              <span className="font-semibold text-[var(--color-ink-900)]">
                {telemetry.desiccantPct}%
              </span>{" "}
              capacity. Consider replacing it in the next{" "}
              {telemetry.desiccantReplaceInDays} days for optimal pill integrity.
            </p>
            <button className="mt-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-sanctuary-700)] hover:underline">
              Order Replacement
            </button>
          </section>
        </div>
      </div>

      <footer className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">
        <span>Clinical Sanctuary Interface · Secure Link Established</span>
      </footer>
    </div>
  );
}

function DRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-white/60">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

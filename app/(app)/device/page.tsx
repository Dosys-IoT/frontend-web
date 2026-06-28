"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Droplets,
  Loader2,
  Play,
  RefreshCw,
  Radio,
  Shield,
  Thermometer,
  Wifi,
  Lightbulb,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { useToast } from "@/components/ui/toast";
import { EnvironmentChart } from "@/components/device/environment-chart";
import { CreateDeviceCard } from "@/components/device/create-device-card";
import { devicesApi, edgeApi } from "@/lib/api/endpoints";
import type { ApiError, EdgeMqttStatusResponse } from "@/lib/api/types";
import { selectPrimaryDevice } from "@/lib/domain/device-selection";
import { getDeviceStatus } from "@/lib/domain/device-status";
import { formatLimaDateTime } from "@/lib/utils/date-time";

const REFRESH_INTERVAL_MS = 60_000;
const FALLBACK_DEVICE_ID = process.env.NEXT_PUBLIC_DEFAULT_DEVICE_ID ?? "1";

type CommandKind = "audio" | "led" | "status" | "sync";

export default function DevicePage() {
  const toast = useToast();
  const devicesQ = useQuery({ queryKey: ["devices"], queryFn: devicesApi.list });
  const selectedDevice = selectPrimaryDevice(devicesQ.data);
  const deviceId = selectedDevice.apiDeviceId;
  const deviceLabel = selectedDevice.displayDeviceId ?? FALLBACK_DEVICE_ID;
  const [pendingCommand, setPendingCommand] = useState<CommandKind | null>(null);

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);

  const backendStatusQ = useQuery({
    queryKey: ["device", "backend-status", deviceId],
    queryFn: () => devicesApi.status(deviceId!),
    enabled: !!deviceId,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const latestEnvQ = useQuery({
    queryKey: ["device", "environment-latest", deviceId],
    queryFn: () => devicesApi.latestEnvironment(deviceId!),
    enabled: !!deviceId,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const historyQ = useQuery({
    queryKey: ["device", "environment-history", deviceId, range.from, range.to],
    queryFn: () => devicesApi.environmentHistory(deviceId!, range.from, range.to),
    enabled: !!deviceId,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const edgeHealthQ = useQuery({
    queryKey: ["device", "edge-health"],
    queryFn: edgeApi.health,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const edgeMqttQ = useQuery({
    queryKey: ["device", "edge-mqtt"],
    queryFn: edgeApi.mqttStatus,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const status = getDeviceStatus(backendStatusQ.data, {
    now: new Date(),
    latestEnvironmentAt: latestEnvQ.data?.recordedAt ?? null,
  });

  const combinedState = useMemo(() => {
    if (status.presence === "none") return { label: "No signal", tone: "amber" as const };
    if (status.presence === "online") return { label: "Online", tone: "sanctuary" as const };
    if (status.presence === "stale") return { label: "Stale", tone: "amber" as const };
    return { label: "Offline", tone: "danger" as const };
  }, [status.presence]);

  const backendErrorStatus = getErrorStatus(backendStatusQ.error);
  const backendLabel = backendErrorStatus
    ? (backendErrorStatus === 401 ? "Login required" : "Unavailable")
    : backendStatusQ.data?.status ?? "Unknown";
  const backendTone = backendErrorStatus
    ? (backendErrorStatus === 401 ? "amber" : "danger")
    : statusTone(false, backendStatusQ.data?.status);

  const edgeHealthLabel = edgeHealthQ.error
    ? "Down"
    : edgeHealthQ.data?.status ?? "Up";

  const mqttLabel = edgeMqttQ.error
    ? "Disconnected"
    : edgeMqttQ.data?.connected
      ? "Connected"
      : edgeMqttQ.data?.status ?? "Disconnected";

  const refetchAll = () => {
    devicesQ.refetch();
    backendStatusQ.refetch();
    latestEnvQ.refetch();
    historyQ.refetch();
    edgeHealthQ.refetch();
    edgeMqttQ.refetch();
  };

  const runCommand = async (kind: CommandKind) => {
    setPendingCommand(kind);
    try {
      if (kind === "audio") {
        await edgeApi.audioTest(deviceLabel);
        toast.success("Audio test sent");
      } else if (kind === "led") {
        await edgeApi.ledTest(deviceLabel);
        toast.success("LED test sent");
      } else if (kind === "status") {
        await edgeApi.statusRequest(deviceLabel);
        toast.success("Status request sent");
      } else {
        await edgeApi.configSync(deviceLabel);
        toast.success("Config sync sent");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPendingCommand(null);
    }
  };

  const hasCriticalError =
    devicesQ.isError && !devicesQ.isLoading && !selectedDevice.device;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <header className="grain overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,var(--color-ink-950),var(--color-sanctuary-800))] p-6 text-white shadow-[var(--shadow-hero)] md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/60">
              <Shield className="h-4 w-4" />
              Device status
            </div>
            <h1 className="mt-3 font-display text-[40px] leading-none text-white md:text-[52px]">
              Hardware live status
            </h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-6 text-white/75">
              Monitor the Dosys device and keep the most useful controls here. The technical
              diagnostics screen remains available by URL for debugging.
            </p>
            <p className="mt-3 text-[12px] text-white/60">
              Linked device: {selectedDevice.device?.name ?? "None"} | Device ID: {deviceLabel}
              {selectedDevice.hardwareDeviceId != null
                ? ` | Hardware ID: ${selectedDevice.hardwareDeviceId}`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={refetchAll}
              className="bg-white text-[var(--color-ink-900)] hover:bg-white/90"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh status
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <HeroStat label="Device ID" value={deviceLabel} tone="neutral" icon={<Shield className="h-4 w-4" />} />
          <HeroStat
            label="Backend API"
            value={backendLabel}
            tone={backendTone}
            icon={<Wifi className="h-4 w-4" />}
          />
          <HeroStat label="Edge API" value={edgeHealthLabel} tone={statusTone(edgeHealthQ.isError, edgeHealthQ.data?.status)} icon={<Radio className="h-4 w-4" />} />
          <HeroStat label="MQTT" value={mqttLabel} tone={mqttTone(edgeMqttQ.isError, edgeMqttQ.data)} icon={<Activity className="h-4 w-4" />} />
        </div>
      </header>

      {hasCriticalError ? (
        <ErrorState onRetry={refetchAll} />
      ) : !devicesQ.isLoading && !deviceId ? (
        <CreateDeviceCard />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="p-6">
            <SectionHeader
              eyebrow="Live status"
              title={combinedState.label}
              description="Online is based on the latest heartbeat or recent environment telemetry."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoField label="Last heartbeat" value={formatLimaDateTime(backendStatusQ.data?.lastSeenAt)} />
              <InfoField label="Last signal" value={status.lastSeenLabel} />
              <InfoField label="Signal source" value={status.lastSignalSource ?? "none"} />
              <InfoField label="Last environment" value={formatLimaDateTime(latestEnvQ.data?.recordedAt)} />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge tone={combinedState.tone} className="normal-case">
                {combinedState.label}
              </Badge>
              <p className="text-[13px] text-[var(--color-ink-500)]">
                Last signal: {status.lastSeenLabel}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader
              eyebrow="Environment"
              title="Latest temperature and humidity"
              description="Latest backend reading when available."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MetricTile
                icon={<Thermometer className="h-4 w-4" />}
                label="Temperature"
                value={latestEnvQ.data ? `${latestEnvQ.data.temperature.toFixed(1)} C` : "No reading"}
                tone={latestEnvQ.data ? envTone(latestEnvQ.data.riskStatus) : "neutral"}
              />
              <MetricTile
                icon={<Droplets className="h-4 w-4" />}
                label="Humidity"
                value={latestEnvQ.data ? `${latestEnvQ.data.humidity.toFixed(1)} %` : "No reading"}
                tone={latestEnvQ.data ? envTone(latestEnvQ.data.riskStatus) : "neutral"}
              />
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoField
                label="Risk status"
                value={latestEnvQ.data?.riskStatus ?? "Unknown"}
              />
              <InfoField
                label="Recorded at"
                value={formatLimaDateTime(latestEnvQ.data?.recordedAt)}
              />
            </dl>
          </Card>

          <Card className="p-6">
            <SectionHeader
              eyebrow="Device controls"
              title="Send hardware commands"
              description="Commands go to the Edge, then are relayed to the ESP32."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <CommandButton
                label="Probar audio"
                icon={<Play className="h-4 w-4" />}
                loading={pendingCommand === "audio"}
                disabled={pendingCommand !== null && pendingCommand !== "audio"}
                onClick={() => runCommand("audio")}
              />
              <CommandButton
                label="Probar LEDs"
                icon={<Lightbulb className="h-4 w-4" />}
                loading={pendingCommand === "led"}
                disabled={pendingCommand !== null && pendingCommand !== "led"}
                onClick={() => runCommand("led")}
              />
              <CommandButton
                label="Solicitar estado"
                icon={<Activity className="h-4 w-4" />}
                loading={pendingCommand === "status"}
                disabled={pendingCommand !== null && pendingCommand !== "status"}
                onClick={() => runCommand("status")}
              />
              <CommandButton
                label="Sincronizar config"
                icon={<Zap className="h-4 w-4" />}
                loading={pendingCommand === "sync"}
                disabled={pendingCommand !== null && pendingCommand !== "sync"}
                onClick={() => runCommand("sync")}
              />
            </div>
            <p className="mt-4 text-[12px] text-[var(--color-ink-500)]">
              Frontend does not store MQTT credentials. It only calls HTTP endpoints on Backend and Edge.
            </p>
          </Card>

          <Card className="p-6">
            <SectionHeader
              eyebrow="Connectivity"
              title="Backend, Edge and MQTT"
              description="User-friendly summary of the device path."
            />
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoField label="Backend API" value={backendLabel} />
              <InfoField label="Edge API" value={edgeHealthLabel} />
              <InfoField label="MQTT" value={mqttLabel} />
              <InfoField label="Last signal" value={status.lastSeenLabel} />
            </dl>
            <div className="mt-4">
              {backendStatusQ.isError && backendStatusQ.error ? (
                <InlineError message={getErrorMessage(backendStatusQ.error)} />
              ) : null}
              {latestEnvQ.isError && latestEnvQ.error ? (
                <InlineError message={getErrorMessage(latestEnvQ.error)} />
              ) : null}
              {edgeHealthQ.isError ? <InlineError message={getErrorMessage(edgeHealthQ.error)} /> : null}
              {edgeMqttQ.isError ? <InlineError message={getErrorMessage(edgeMqttQ.error)} /> : null}
            </div>
          </Card>

          <Card className="p-6 xl:col-span-2">
            <SectionHeader
              eyebrow="Trend"
              title="Last 24 hours"
              description="Temperature and humidity history returned by the backend."
            />
            <div className="mt-5">
              {historyQ.isLoading ? (
                <div className="h-[220px] animate-pulse rounded-2xl bg-[var(--color-cream-50)]" />
              ) : (
                <EnvironmentChart readings={historyQ.data ?? []} />
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-ink-400)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-[24px] leading-tight text-[var(--color-ink-900)]">
        {title}
      </h2>
      <p className="mt-2 text-[13px] leading-5 text-[var(--color-ink-500)]">{description}</p>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--color-cream-50)]/80 p-4">
      <dt className="text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">{label}</dt>
      <dd className="mt-1 text-[14px] font-medium text-[var(--color-ink-900)]">{value || "Unavailable"}</dd>
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "neutral" | "sanctuary" | "amber" | "danger";
}) {
  return (
    <div className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-[var(--color-cream-50)]/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-[12px] font-medium text-[var(--color-ink-500)]">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[var(--color-sanctuary-700)]">
            {icon}
          </span>
          {label}
        </div>
        <Badge tone={tone} className="normal-case">
          {toneLabel(tone)}
        </Badge>
      </div>
      <p className="mt-4 font-display text-[30px] leading-none text-[var(--color-ink-900)]">
        {value}
      </p>
    </div>
  );
}

function HeroStat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "neutral" | "sanctuary" | "amber" | "danger";
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white/10 p-4 text-white backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wide text-white/60">
          {icon}
          {label}
        </span>
        <Badge tone={tone} className="bg-white/15 text-white">
          {toneLabel(tone)}
        </Badge>
      </div>
      <p className="mt-3 font-display text-[24px] leading-none">{value}</p>
    </div>
  );
}

function CommandButton({
  label,
  icon,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="secondary"
      className="justify-start"
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </Button>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <p className="mt-3 rounded-2xl border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] px-4 py-3 text-[13px] text-[var(--color-danger-600)]">
      {message}
    </p>
  );
}

function getErrorMessage(error: unknown): string {
  const apiError = error as ApiError | undefined;
  return apiError?.message || "Request failed. Check the Edge or Backend connection.";
}

function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

function statusTone(
  isError: boolean,
  status?: string
): "neutral" | "sanctuary" | "amber" | "danger" {
  if (isError) return "danger";
  const normalized = (status ?? "").toUpperCase();
  if (["UP", "OK", "ONLINE", "CONNECTED", "HEALTHY", "READY"].includes(normalized)) {
    return "sanctuary";
  }
  if (["DEGRADED", "WARNING", "PARTIAL"].includes(normalized)) {
    return "amber";
  }
  if (!normalized) return "neutral";
  return "danger";
}

function mqttTone(
  isError: boolean,
  mqtt?: EdgeMqttStatusResponse | null
): "neutral" | "sanctuary" | "amber" | "danger" {
  if (isError) return "danger";
  if (mqtt?.connected) return "sanctuary";
  if (mqtt?.status && mqtt.status.toUpperCase().includes("DEG")) return "amber";
  return mqtt?.status ? "amber" : "danger";
}

function envTone(status?: string): "neutral" | "sanctuary" | "amber" | "danger" {
  const normalized = (status ?? "NORMAL").toUpperCase();
  if (normalized === "NORMAL") return "sanctuary";
  if (normalized === "WARNING") return "amber";
  return "danger";
}

function toneLabel(tone: "neutral" | "sanctuary" | "amber" | "danger"): string {
  switch (tone) {
    case "sanctuary":
      return "Live";
    case "amber":
      return "Warn";
    case "danger":
      return "Down";
    default:
      return "Info";
  }
}

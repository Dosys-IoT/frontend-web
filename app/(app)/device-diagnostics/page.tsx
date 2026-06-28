"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  Clock3,
  Droplets,
  Loader2,
  Play,
  RefreshCw,
  Radio,
  ShieldAlert,
  Thermometer,
  Wifi,
  Lightbulb,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { devicesApi, edgeApi } from "@/lib/api/endpoints";
import type {
  ApiError,
  EdgeRecentEventResponse,
  EdgeMqttStatusResponse,
  EdgeRecentEventsResponse,
} from "@/lib/api/types";

const DEVICE_ID = process.env.NEXT_PUBLIC_DEFAULT_DEVICE_ID ?? "1";
const POLL_INTERVAL_MS = 15_000;

type CommandKind = "audio" | "led" | "status" | "sync";

export default function DeviceDiagnosticsPage() {
  const toast = useToast();
  const backendDeviceId = Number.parseInt(DEVICE_ID, 10) || 1;
  const [pendingCommand, setPendingCommand] = useState<CommandKind | null>(null);

  const backendStatusQ = useQuery({
    queryKey: ["iot", "backend-status", backendDeviceId],
    queryFn: () => devicesApi.status(backendDeviceId),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const latestEnvQ = useQuery({
    queryKey: ["iot", "environment-latest", backendDeviceId],
    queryFn: () => devicesApi.latestEnvironment(backendDeviceId),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const edgeHealthQ = useQuery({
    queryKey: ["iot", "edge-health"],
    queryFn: edgeApi.health,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const edgeMqttQ = useQuery({
    queryKey: ["iot", "edge-mqtt"],
    queryFn: edgeApi.mqttStatus,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const cachedConfigQ = useQuery({
    queryKey: ["iot", "cached-config", DEVICE_ID],
    queryFn: () => edgeApi.cachedConfig(DEVICE_ID),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const recentEventsQ = useQuery({
    queryKey: ["iot", "recent-events"],
    queryFn: edgeApi.recentEvents,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const refetchAll = () => {
    backendStatusQ.refetch();
    latestEnvQ.refetch();
    edgeHealthQ.refetch();
    edgeMqttQ.refetch();
    cachedConfigQ.refetch();
    recentEventsQ.refetch();
  };

  const runCommand = async (kind: CommandKind) => {
    setPendingCommand(kind);
    try {
      let response;
      if (kind === "audio") {
        response = await edgeApi.audioTest(DEVICE_ID);
        toast.success(response.message ?? `Audio test sent to device ${DEVICE_ID}.`);
      } else if (kind === "led") {
        response = await edgeApi.ledTest(DEVICE_ID);
        toast.success(response.message ?? `LED test sent to device ${DEVICE_ID}.`);
      } else if (kind === "status") {
        response = await edgeApi.statusRequest(DEVICE_ID);
        toast.success(response.message ?? `Status request sent to device ${DEVICE_ID}.`);
      } else {
        response = await edgeApi.configSync(DEVICE_ID);
        toast.success(response.message ?? `Config sync requested for device ${DEVICE_ID}.`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPendingCommand(null);
    }
  };

  const backendStatus = backendStatusQ.data;
  const backendStatusError = backendStatusQ.error as unknown as ApiError | undefined;
  const latestEnv = latestEnvQ.data;
  const latestEnvError = latestEnvQ.error as unknown as ApiError | undefined;
  const edgeHealth = edgeHealthQ.data;
  const edgeMqtt = edgeMqttQ.data;
  const cachedConfig = cachedConfigQ.data;
  const recentEvents = normalizeRecentEvents(recentEventsQ.data);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <header className="grain overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,var(--color-ink-950),var(--color-sanctuary-800))] p-6 text-white shadow-[var(--shadow-hero)] md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/60">
              <Activity className="h-4 w-4" />
              IoT Diagnostics
            </div>
            <h1 className="mt-3 font-display text-[40px] leading-none text-white md:text-[52px]">
              Hardware live status
            </h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-6 text-white/75">
              Monitor the ESP32, Edge and Backend path for device {DEVICE_ID}. This view stays
              responsive even when the Edge is offline.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/device">
                <ArrowLeft className="h-4 w-4" />
                Back to Device
              </Link>
            </Button>
            <Button variant="outline" onClick={refetchAll} className="border-white/20 text-white hover:bg-white/10">
              <RefreshCw className="h-4 w-4" />
              Refresh all
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <HeroStat
            label="Device ID"
            value={DEVICE_ID}
            tone="neutral"
            icon={<ShieldAlert className="h-4 w-4" />}
          />
          <HeroStat
            label="Backend API"
            value={backendStatusLabel(backendStatusQ.isLoading, backendStatusError, backendStatus?.status)}
            tone={backendStatusTone(backendStatusError, backendStatus?.status)}
            icon={<Wifi className="h-4 w-4" />}
          />
          <HeroStat
            label="Edge API"
            value={statusLabel(edgeHealthQ.isError, edgeHealth?.status, edgeHealthQ.isLoading)}
            tone={statusTone(edgeHealthQ.isError, edgeHealth?.status)}
            icon={<Radio className="h-4 w-4" />}
          />
          <HeroStat
            label="MQTT"
            value={mqttLabel(edgeMqttQ.isError, edgeMqtt)}
            tone={mqttTone(edgeMqttQ.isError, edgeMqtt)}
            icon={<Activity className="h-4 w-4" />}
          />
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <SectionHeader
            eyebrow="Backend"
            title="Device heartbeat"
            description="Latest state returned by the REST API for the linked device."
          />
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoField
              label="Status"
              value={
                backendStatus
                  ? backendStatus.status
                  : backendStatusError?.status === 401
                    ? "Unauthorized"
                    : "Unavailable"
              }
            />
            <InfoField label="Last seen" value={formatDate(backendStatus?.lastSeenAt)} />
            <InfoField label="Firmware" value={backendStatus?.firmwareVersion ?? "Unknown"} />
            <InfoField
              label="Hardware checks"
              value={joinFlags([
                labelBool(backendStatus?.rtcOk, "RTC"),
                labelBool(backendStatus?.sht3xOk, "SHT3X"),
                labelBool(backendStatus?.dfPlayerOk, "DFPlayer"),
                labelBool(backendStatus?.sdCardOk, "SD"),
                labelBool(backendStatus?.switchOk, "Switch"),
              ])}
            />
            <InfoField
              label="Button pin"
              value={backendStatus?.buttonPin != null ? String(backendStatus.buttonPin) : "15"}
            />
            <InfoField
              label="RSSI"
              value={backendStatus?.rssi != null ? `${backendStatus.rssi} dBm` : "Unknown"}
            />
          </dl>
          {backendStatusQ.isError && backendStatusError?.status !== 401 && (
            <InlineError message={getErrorMessage(backendStatusQ.error)} />
          )}
        </Card>

        <Card className="p-6">
          <SectionHeader
            eyebrow="Environment"
            title="Latest temperature and humidity"
            description="Uses the latest backend reading when available."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MetricTile
              icon={<Thermometer className="h-4 w-4" />}
              label="Temperature"
              value={latestEnv ? `${latestEnv.temperature.toFixed(1)} C` : "No reading"}
              tone={latestEnv ? envTone(latestEnv.riskStatus) : "neutral"}
            />
            <MetricTile
              icon={<Droplets className="h-4 w-4" />}
              label="Humidity"
              value={latestEnv ? `${latestEnv.humidity.toFixed(1)} %` : "No reading"}
              tone={latestEnv ? envTone(latestEnv.riskStatus) : "neutral"}
            />
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoField
              label="Risk status"
              value={
                latestEnv
                  ? latestEnv.riskStatus
                  : latestEnvError?.status === 401
                    ? "Unauthorized"
                    : "Unknown"
              }
            />
            <InfoField
              label="Recorded at"
              value={latestEnv ? formatDate(latestEnv.recordedAt) : "Unavailable"}
            />
          </dl>
          {latestEnvQ.isError && latestEnvError?.status !== 401 && (
            <InlineError message={getErrorMessage(latestEnvQ.error)} />
          )}
        </Card>

        <Card className="p-6">
          <SectionHeader
            eyebrow="Edge"
            title="Runtime and MQTT"
            description="Checks the Cloud Run edge bridge and its broker status."
          />
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoField label="Health" value={edgeHealth?.status ?? (edgeHealthQ.isError ? "Unavailable" : "Loading")} />
            <InfoField label="Uptime" value={formatDuration(edgeHealth?.uptimeSeconds)} />
            <InfoField
              label="MQTT"
              value={edgeMqtt?.connected ? "Connected" : edgeMqtt?.status ?? "Unavailable"}
            />
            <InfoField label="Broker" value={edgeMqtt?.broker ?? "HiveMQ Cloud"} />
          </dl>
          {edgeHealthQ.isError && <InlineError message={getErrorMessage(edgeHealthQ.error)} />}
          {edgeMqttQ.isError && <InlineError message={getErrorMessage(edgeMqttQ.error)} />}
        </Card>

        <Card className="p-6">
          <SectionHeader
            eyebrow="Config"
            title="Cached runtime configuration"
            description="Configuration cached by the Edge for this device."
          />
          {cachedConfig?.available ? (
            <div className="mt-5 space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <InfoField
                  label="Config version"
                  value={String(cachedConfig.config?.configVersion ?? "Unknown")}
                />
                <InfoField label="Server time" value={formatDate(cachedConfig.config?.serverTime)} />
                <InfoField label="Timezone" value={cachedConfig.config?.timezone ?? "America/Lima"} />
                <InfoField
                  label="Request ID"
                  value={cachedConfig.config?.requestId ?? "Not provided"}
                />
              </dl>

              <div className="grid gap-3 sm:grid-cols-3">
                <MiniCounter label="Containers" value={cachedConfig.config?.containers?.length ?? 0} />
                <MiniCounter label="Schedules" value={cachedConfig.config?.schedules?.length ?? 0} />
                <MiniCounter
                  label="Temp warning"
                  value={cachedConfig.config?.environmentThresholds?.temperatureWarning ?? 28}
                />
              </div>

              <div className="rounded-2xl bg-[var(--color-cream-50)]/80 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-ink-500)]">
                  Containers
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(cachedConfig.config?.containers ?? []).length > 0 ? (
                    cachedConfig.config?.containers?.map((container) => (
                      <Badge key={String(container.containerNumber)} tone="ink" className="normal-case">
                        C{container.containerNumber}: {container.remainingPills ?? 0} pills
                      </Badge>
                    ))
                  ) : (
                    <p className="text-[13px] text-[var(--color-ink-500)]">No cached containers yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-[14px] text-[var(--color-ink-500)]">
              Cached config is not available yet.
            </p>
          )}
          {cachedConfigQ.isError && <InlineError message={getErrorMessage(cachedConfigQ.error)} />}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="p-6">
          <SectionHeader
            eyebrow="Diagnostics"
            title="Recent Edge events"
            description="Recent events reported by the bridge for this device."
          />
          <div className="mt-5 space-y-3">
            {recentEvents.length > 0 ? (
              recentEvents.slice(0, 8).map((event, index) => (
                <EventRow key={event.id?.toString() ?? `${event.createdAt ?? "event"}-${index}`} event={event} />
              ))
            ) : (
              <p className="text-[14px] text-[var(--color-ink-500)]">
                No recent diagnostics events yet.
              </p>
            )}
          </div>
          {recentEventsQ.isError && <InlineError message={getErrorMessage(recentEventsQ.error)} />}
        </Card>

        <Card className="p-6">
          <SectionHeader
            eyebrow="Commands"
            title="Trigger hardware actions"
            description="Commands are sent to the Edge, then relayed to the ESP32."
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
      </div>
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
      <dd className="mt-1 text-[14px] font-medium text-[var(--color-ink-900)]">{value}</dd>
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

function MiniCounter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[var(--color-cream-50)]/80 p-4">
      <p className="text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">{label}</p>
      <p className="mt-2 font-display text-[28px] leading-none text-[var(--color-ink-900)]">
        {value}
      </p>
    </div>
  );
}

function EventRow({ event }: { event: EdgeRecentEventResponse }) {
  return (
    <div className="rounded-2xl border border-[var(--color-ink-50)]/60 bg-[var(--color-cream-50)]/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-[var(--color-ink-900)]">
          {event.eventType ?? event.topic ?? "Event"}
        </p>
        <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">
          <Clock3 className="h-3.5 w-3.5" />
          {formatDate(event.createdAt)}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-5 text-[var(--color-ink-500)]">
        {event.summary ?? stringifyPayload(event.payload) ?? "No summary provided."}
      </p>
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <p className="mt-4 rounded-2xl border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] px-4 py-3 text-[13px] text-[var(--color-danger-600)]">
      {message}
    </p>
  );
}

function getErrorMessage(error: unknown): string {
  const apiError = error as ApiError | undefined;
  return apiError?.message || "Request failed. Check the Edge or Backend connection.";
}

function stringifyPayload(payload: unknown): string | null {
  if (payload == null) return null;
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload);
  } catch {
    return null;
  }
}

function normalizeRecentEvents(
  data: EdgeRecentEventResponse[] | EdgeRecentEventsResponse | undefined
): EdgeRecentEventResponse[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? data.events ?? data.data ?? [];
}

function formatDate(value?: string | null): string {
  if (!value) return "Unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatDuration(seconds?: number | null): string {
  if (seconds == null) return "Unavailable";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

function labelBool(value: boolean | null | undefined, label: string): string {
  if (value == null) return `${label}: ?`;
  return `${label}: ${value ? "OK" : "No"}`;
}

function joinFlags(flags: string[]): string {
  return flags.join(" | ");
}

function statusLabel(isError: boolean, status?: string, loading?: boolean): string {
  if (loading) return "Loading";
  if (isError) return "Unavailable";
  return status ?? "Unknown";
}

function mqttLabel(isError: boolean, mqtt?: EdgeMqttStatusResponse): string {
  if (mqtt?.connected) return "Connected";
  if (isError) return "Unavailable";
  return mqtt?.status ?? "Disconnected";
}

function backendStatusLabel(
  loading: boolean,
  error: ApiError | undefined,
  status?: string
): string {
  if (loading) return "Loading";
  if (error?.status === 401) return "Unauthorized";
  if (error) return "Unavailable";
  return status ?? "Unknown";
}

function backendStatusTone(
  error: ApiError | undefined,
  status?: string
): "neutral" | "sanctuary" | "amber" | "danger" {
  if (error?.status === 401) return "amber";
  return statusTone(!!error, status);
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
  mqtt?: EdgeMqttStatusResponse
): "neutral" | "sanctuary" | "amber" | "danger" {
  if (isError) return "danger";
  if (mqtt?.connected) return "sanctuary";
  if (mqtt?.status && mqtt.status.toUpperCase().includes("DEG")) return "amber";
  return "danger";
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Radio, RefreshCw, Shield, Volume2, Wifi } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { accessApi, devicesApi, edgeApi } from "@/lib/api/endpoints";
import type { AlarmSettingsRequest, ApiError } from "@/lib/api/types";
import { selectPrimaryDevice } from "@/lib/domain/device-selection";
import { getDeviceStatus } from "@/lib/domain/device-status";
import { formatLimaDateTime, formatRelativeLastSeen } from "@/lib/utils/date-time";

const REFRESH_INTERVAL_MS = 60_000;
const DEFAULT_DEVICE_ID = process.env.NEXT_PUBLIC_DEFAULT_DEVICE_ID ?? "1";

type AdvancedCommand = "sync" | "status";

export default function ProfilePage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [pendingCommand, setPendingCommand] = useState<AdvancedCommand | null>(null);

  const meQ = useQuery({ queryKey: ["me"], queryFn: accessApi.me });
  const devicesQ = useQuery({ queryKey: ["devices"], queryFn: devicesApi.list });
  const selectedDevice = selectPrimaryDevice(devicesQ.data);
  const deviceId = selectedDevice.apiDeviceId;
  const displayDeviceId = selectedDevice.displayDeviceId ?? DEFAULT_DEVICE_ID;

  const statusQ = useQuery({
    queryKey: ["profile", "status", deviceId],
    queryFn: () => devicesApi.status(deviceId!),
    enabled: !!deviceId,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const environmentQ = useQuery({
    queryKey: ["profile", "environment-latest", deviceId],
    queryFn: () => devicesApi.latestEnvironment(deviceId!),
    enabled: !!deviceId,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const edgeHealthQ = useQuery({
    queryKey: ["profile", "edge-health"],
    queryFn: edgeApi.health,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const edgeMqttQ = useQuery({
    queryKey: ["profile", "edge-mqtt"],
    queryFn: edgeApi.mqttStatus,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const [alarmForm, setAlarmForm] = useState<AlarmSettingsRequest>({
    alarmVolumePercent: 80,
    quietHoursEnabled: false,
    quietHoursStart: "21:00",
    quietHoursEnd: "06:00",
    quietHoursVolumePercent: 50,
  });

  useEffect(() => {
    if (!selectedDevice.device) return;
    setAlarmForm({
      alarmVolumePercent: selectedDevice.device.alarmVolumePercent ?? 80,
      quietHoursEnabled: selectedDevice.device.quietHoursEnabled ?? false,
      quietHoursStart: selectedDevice.device.quietHoursStart ?? "21:00",
      quietHoursEnd: selectedDevice.device.quietHoursEnd ?? "06:00",
      quietHoursVolumePercent: selectedDevice.device.quietHoursVolumePercent ?? 50,
    });
  }, [selectedDevice.device]);

  const profileStatus = getDeviceStatus(statusQ.data, {
    now: new Date(),
    latestEnvironmentAt: environmentQ.data?.recordedAt ?? null,
  });

  const saveAlarmMutation = useMutation({
    mutationFn: async () => {
      if (!deviceId) throw new Error("No linked device available");
      await devicesApi.updateAlarmSettings(deviceId, alarmForm);
      try {
        await edgeApi.configSync(displayDeviceId);
        return { synced: true };
      } catch (error) {
        toast.info(`Alarm settings saved, but device sync failed: ${getErrorMessage(error)}`);
        return { synced: false };
      }
    },
    onSuccess: ({ synced }) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["profile", "status", deviceId] });
      toast.success(
        synced ? "Alarm settings saved and device synced." : "Alarm settings saved."
      );
    },
    onError: (error) => {
      toast.error(`Could not save alarm settings: ${getErrorMessage(error)}`);
    },
  });

  const runAdvancedCommand = async (kind: AdvancedCommand) => {
    if (!displayDeviceId) return;
    setPendingCommand(kind);
    try {
      if (kind === "sync") {
        await edgeApi.configSync(displayDeviceId);
        toast.success("Config sync sent");
      } else {
        await edgeApi.statusRequest(displayDeviceId);
        toast.success("Status request sent");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPendingCommand(null);
    }
  };

  const user = meQ.data;
  const fullName = user ? `${user.firstName} ${user.lastName}` : "Profile";
  const initials = user ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}` : "?";
  const syncTone = useMemo(() => {
    if (profileStatus.presence === "online") return "sanctuary" as const;
    if (profileStatus.presence === "stale") return "amber" as const;
    if (profileStatus.presence === "offline") return "danger" as const;
    return "neutral" as const;
  }, [profileStatus.presence]);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <header className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[var(--color-ink-700)] to-[var(--color-sanctuary-900)] font-display text-2xl text-white">
              {initials}
            </span>
            <div>
              <h1 className="font-display text-[40px] leading-none text-[var(--color-ink-900)]">
                Profile
              </h1>
              <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
                {fullName}
                {user ? ` · ${user.email}` : ""}
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="h-4 w-4" />
            Refresh profile data
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-ink-400)]">
                Connected Device
              </p>
              <h2 className="mt-2 text-[24px] font-semibold text-[var(--color-ink-900)]">
                {selectedDevice.device?.name ?? "No linked device"}
              </h2>
            </div>
            <Badge tone={syncTone} className="normal-case">
              {presenceLabel(profileStatus.presence)}
            </Badge>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoTile label="Device ID" value={displayDeviceId} />
            <InfoTile
              label="Sync status"
              value={presenceLabel(profileStatus.presence)}
              hint={profileStatus.lastSeenLabel}
            />
            <InfoTile
              label="Last heartbeat"
              value={formatLimaDateTime(statusQ.data?.lastSeenAt) || "Unavailable"}
            />
            <InfoTile
              label="Last signal"
              value={formatRelativeLastSeen(profileStatus.lastSignalAt)}
              hint={profileStatus.lastSignalSource ?? "none"}
            />
            <InfoTile
              label="Firmware version"
              value={statusQ.data?.firmwareVersion ?? "Unknown"}
            />
            <InfoTile
              label="Hardware version"
              value={statusQ.data?.hardwareVersion ?? "Unknown"}
            />
            <InfoTile
              label="WiFi"
              value={boolLabel(statusQ.data?.wifiConnected)}
            />
            <InfoTile
              label="MQTT"
              value={
                edgeMqttQ.data?.connected
                  ? "Connected"
                  : edgeMqttQ.data?.status ?? boolLabel(statusQ.data?.mqttConnected)
              }
            />
            <InfoTile
              label="Temperature"
              value={
                environmentQ.data ? `${environmentQ.data.temperature.toFixed(1)} C` : "No reading"
              }
            />
            <InfoTile
              label="Humidity"
              value={
                environmentQ.data ? `${environmentQ.data.humidity.toFixed(1)} %` : "No reading"
              }
            />
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-ink-400)]">
            Alarm
          </p>
          <h2 className="mt-2 text-[24px] font-semibold text-[var(--color-ink-900)]">
            Alarm volume
          </h2>
          <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
            Save these settings to the backend and sync them to the ESP32 runtime config.
          </p>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <label className="text-[14px] font-medium text-[var(--color-ink-900)]">
                Alarm volume
              </label>
              <span className="text-[13px] font-semibold text-[var(--color-sanctuary-700)]">
                {alarmForm.alarmVolumePercent}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={alarmForm.alarmVolumePercent}
              onChange={(event) =>
                setAlarmForm((current) => ({
                  ...current,
                  alarmVolumePercent: Number(event.target.value),
                }))
              }
              className="mt-3 w-full accent-[var(--color-sanctuary-600)]"
            />
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-[var(--color-ink-100)] bg-[var(--color-cream-50)] p-4">
            <input
              type="checkbox"
              checked={alarmForm.quietHoursEnabled}
              onChange={(event) =>
                setAlarmForm((current) => ({
                  ...current,
                  quietHoursEnabled: event.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 accent-[var(--color-sanctuary-600)]"
            />
            <div>
              <p className="text-[14px] font-semibold text-[var(--color-ink-900)]">
                Reduce volume after 9 PM
              </p>
              <p className="mt-1 text-[12px] text-[var(--color-ink-500)]">
                After 9 PM, alarms play at 50% of the selected volume.
              </p>
            </div>
          </label>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoTile label="Quiet hours" value={`${alarmForm.quietHoursStart} - ${alarmForm.quietHoursEnd}`} />
            <InfoTile
              label="Quiet volume"
              value={`${alarmForm.quietHoursVolumePercent}%`}
            />
          </div>

          <div className="mt-5">
            <Button
              onClick={() => saveAlarmMutation.mutate()}
              disabled={!deviceId || saveAlarmMutation.isPending}
              className="w-full"
            >
              <Volume2 className="h-4 w-4" />
              {saveAlarmMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-[var(--color-danger-100)] bg-[var(--color-danger-50)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-danger-600)]">
              Advanced
            </p>
            <h2 className="mt-2 text-[24px] font-semibold text-[var(--color-ink-900)]">
              Device operations
            </h2>
            <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
              Keep this focused on real device state and safe controls. No diagnostics shortcut is
              exposed here.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => runAdvancedCommand("status")}
              disabled={!deviceId || pendingCommand !== null}
            >
              {pendingCommand === "status" ? <Activity className="h-4 w-4 animate-pulse" /> : <Activity className="h-4 w-4" />}
              Request device status
            </Button>
            <Button
              onClick={() => runAdvancedCommand("sync")}
              disabled={!deviceId || pendingCommand !== null}
            >
              {pendingCommand === "sync" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Sync device config
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile label="Device ID" value={displayDeviceId} />
          <InfoTile
            label="Config version"
            value={selectedDevice.device?.configVersion?.toString() ?? "Unknown"}
          />
          <InfoTile
            label="Last sync time"
            value={formatLimaDateTime(selectedDevice.device?.updatedAt) || "Unavailable"}
          />
          <InfoTile
            label="Edge / MQTT"
            value={`${edgeHealthQ.data?.status ?? "UNKNOWN"} / ${
              edgeMqttQ.data?.connected ? "Connected" : edgeMqttQ.data?.status ?? "Disconnected"
            }`}
          />
        </div>
      </section>
    </div>
  );
}

function InfoTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-ink-50)] bg-[var(--color-cream-50)] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-400)]">{label}</p>
      <p className="mt-2 text-[15px] font-semibold text-[var(--color-ink-900)]">{value}</p>
      {hint ? <p className="mt-1 text-[12px] text-[var(--color-ink-500)]">{hint}</p> : null}
    </div>
  );
}

function presenceLabel(value: "online" | "stale" | "offline" | "none") {
  if (value === "online") return "Online";
  if (value === "stale") return "Stale";
  if (value === "offline") return "Offline";
  return "No signal";
}

function boolLabel(value: boolean | null | undefined) {
  if (value === true) return "Connected";
  if (value === false) return "Disconnected";
  return "Unknown";
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const apiError = error as Partial<ApiError>;
    if (typeof apiError.message === "string" && apiError.message.trim()) {
      return apiError.message;
    }
  }
  return "Request failed.";
}

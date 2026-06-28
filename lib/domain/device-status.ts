import { formatRelativeLastSeen } from "@/lib/utils/date-time";

/** Online/stale/offline thresholds tuned to the real ESP32 telemetry cadence. */
export const HEARTBEAT_ONLINE_MIN = 40;
export const HEARTBEAT_STALE_MIN = 90;
export const ENVIRONMENT_ONLINE_MIN = 10;

export type DevicePresence = "online" | "stale" | "offline" | "none";

export interface DeviceSignalLike {
  lastSeenAt?: string | null;
}

export interface DeviceStatusInput {
  now?: Date;
  latestEnvironmentAt?: string | null;
  recentSignalAt?: string | null;
}

export interface DeviceStatus {
  presence: DevicePresence;
  online: boolean;
  minutesAgo: number | null;
  lastSeenLabel: string;
  lastSignalAt: string | null;
  lastSignalSource: "heartbeat" | "environment" | "event" | null;
}

export function getDeviceStatus(
  device: DeviceSignalLike | null | undefined,
  input: DeviceStatusInput | Date = {}
): DeviceStatus {
  const now = input instanceof Date ? input : input.now ?? new Date();
  const environmentAt = input instanceof Date ? null : input.latestEnvironmentAt ?? null;
  const recentSignalAt = input instanceof Date ? null : input.recentSignalAt ?? null;

  const heartbeatAt = device?.lastSeenAt ?? null;
  const candidates = [
    heartbeatAt ? { source: "heartbeat" as const, value: heartbeatAt } : null,
    environmentAt ? { source: "environment" as const, value: environmentAt } : null,
    recentSignalAt ? { source: "event" as const, value: recentSignalAt } : null,
  ].filter(Boolean) as Array<{ source: "heartbeat" | "environment" | "event"; value: string }>;

  if (candidates.length === 0) {
    return {
      presence: "none",
      online: false,
      minutesAgo: null,
      lastSeenLabel: "No signal yet",
      lastSignalAt: null,
      lastSignalSource: null,
    };
  }

  const latest = candidates.sort(
    (left, right) => new Date(right.value).getTime() - new Date(left.value).getTime()
  )[0];
  const latestDate = new Date(latest.value);
  const minutesAgo = Number.isNaN(latestDate.getTime())
    ? null
    : Math.max(0, Math.floor((now.getTime() - latestDate.getTime()) / 60_000));

  const heartbeatMinutes = heartbeatAt
    ? Math.max(0, Math.floor((now.getTime() - new Date(heartbeatAt).getTime()) / 60_000))
    : null;
  const envMinutes = environmentAt
    ? Math.max(0, Math.floor((now.getTime() - new Date(environmentAt).getTime()) / 60_000))
    : null;
  const eventMinutes = recentSignalAt
    ? Math.max(0, Math.floor((now.getTime() - new Date(recentSignalAt).getTime()) / 60_000))
    : null;

  const isOnline =
    (heartbeatMinutes != null && heartbeatMinutes <= HEARTBEAT_ONLINE_MIN) ||
    (envMinutes != null && envMinutes <= ENVIRONMENT_ONLINE_MIN) ||
    (eventMinutes != null && eventMinutes <= HEARTBEAT_ONLINE_MIN);

  const hasAnyRecentSignal =
    (heartbeatMinutes != null && heartbeatMinutes <= HEARTBEAT_STALE_MIN) ||
    (envMinutes != null && envMinutes <= HEARTBEAT_STALE_MIN) ||
    (eventMinutes != null && eventMinutes <= HEARTBEAT_STALE_MIN);

  const presence: DevicePresence = (() => {
    if (minutesAgo == null) return "none";
    if (isOnline) return "online";
    if (hasAnyRecentSignal) return "stale";
    return "offline";
  })();

  return {
    presence,
    online: isOnline,
    minutesAgo,
    lastSeenLabel: formatRelativeLastSeen(latestDate, now),
    lastSignalAt: latest.value,
    lastSignalSource: latest.source,
  };
}


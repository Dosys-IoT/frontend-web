import type { DeviceResponse } from "@/lib/api/types";

/** Minutes without a heartbeat before the device is considered offline (US18 / TS04). */
export const OFFLINE_THRESHOLD_MIN = 10;

export interface DeviceStatus {
  online: boolean;
  /** Whole minutes since the last heartbeat, or null if it never connected. */
  minutesAgo: number | null;
  /** Human label, e.g. "3 minutes ago" / "Never connected". */
  lastSeenLabel: string;
}

export function getDeviceStatus(
  device: DeviceResponse | undefined | null,
  now: Date = new Date()
): DeviceStatus {
  if (!device?.lastSeenAt) {
    return { online: false, minutesAgo: null, lastSeenLabel: "Never connected" };
  }

  const minutesAgo = Math.max(
    0,
    Math.floor((now.getTime() - new Date(device.lastSeenAt).getTime()) / 60_000)
  );

  return {
    online: minutesAgo < OFFLINE_THRESHOLD_MIN,
    minutesAgo,
    lastSeenLabel: formatAgo(minutesAgo),
  };
}

function formatAgo(minutes: number): string {
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

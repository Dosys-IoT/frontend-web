import type {
  AdherenceCalendarResponse,
  ContainerResponse,
  DeviceResponse,
  EnvironmentReadingResponse,
} from "@/lib/api/types";
import { getDeviceStatus } from "@/lib/domain/device-status";

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertType = "environmental" | "inventory" | "missed_dose" | "device";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  body: string;
  occurredAt: string; // ISO
}

const LOW_STOCK_THRESHOLD = 5;
const MISSED_LOOKBACK_DAYS = 7;
const MAX_MISSED_ALERTS = 6;

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

interface DeriveInput {
  device?: DeviceResponse | null;
  containers?: ContainerResponse[];
  environment?: EnvironmentReadingResponse | null;
  adherence?: AdherenceCalendarResponse | null;
  now?: Date;
}

/**
 * Builds the live alert feed from real device data. There is no /alerts
 * endpoint — alerts are a *view* over containers (stock), the latest
 * environment reading (storage risk) and intake records (missed doses).
 * They resolve on their own once the underlying data changes (e.g. a refill).
 */
export function deriveAlerts({
  device = null,
  containers = [],
  environment = null,
  adherence = null,
  now = new Date(),
}: DeriveInput): Alert[] {
  const nowIso = now.toISOString();
  const alerts: Alert[] = [];

  // --- Device offline (US18) ---
  if (device) {
    const status = getDeviceStatus(device, now);
    if (!status.online) {
      alerts.push({
        id: "device-offline",
        severity: "warning",
        type: "device",
        title: `Device offline: ${device.name}`,
        body:
          status.minutesAgo === null
            ? "The device has never connected. Check power and Wi-Fi."
            : `No signal for ${status.lastSeenLabel.toLowerCase()}. Reminders may not be firing — check power and Wi-Fi.`,
        occurredAt: device.lastSeenAt ?? nowIso,
      });
    }
  }

  // --- Inventory: out of stock / low stock ---
  for (const c of containers) {
    if (!c.isEnabled) continue;
    const label = c.medicationName ?? `Compartment ${c.containerNumber}`;
    if (c.remainingPills <= 0) {
      alerts.push({
        id: `stock-out-${c.id}`,
        severity: "critical",
        type: "inventory",
        title: `Out of stock: ${label}`,
        body: `Compartment ${c.containerNumber} is empty. Refill now to avoid missed doses.`,
        occurredAt: nowIso,
      });
    } else if (c.remainingPills <= LOW_STOCK_THRESHOLD) {
      alerts.push({
        id: `stock-low-${c.id}`,
        severity: "warning",
        type: "inventory",
        title: `Low stock: ${label}`,
        body: `Only ${c.remainingPills} dose${c.remainingPills === 1 ? "" : "s"} left in Compartment ${c.containerNumber}. Refill soon.`,
        occurredAt: nowIso,
      });
    }
  }

  // --- Environment: storage risk ---
  if (environment && environment.riskStatus === "RISK") {
    alerts.push({
      id: "env-risk",
      severity: "critical",
      type: "environmental",
      title: "Environmental alert: unsafe storage",
      body: `Humidity ${Math.round(environment.humidity)}%, temperature ${environment.temperature.toFixed(
        1
      )}°C — outside the safe storage range.`,
      occurredAt: environment.recordedAt ?? nowIso,
    });
  }

  // --- Missed doses (recent) ---
  const cutoff = new Date(now.getTime() - MISSED_LOOKBACK_DAYS * 86_400_000);
  const missed = (adherence?.days ?? [])
    .flatMap((d) => d.items)
    .filter((i) => i.status === "MISSED" && new Date(i.scheduledAt) >= cutoff)
    .sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1))
    .slice(0, MAX_MISSED_ALERTS);

  for (const i of missed) {
    const when = new Date(i.scheduledAt).toLocaleString("en-US", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });
    alerts.push({
      id: `missed-${i.scheduleId}-${i.scheduledAt}`,
      severity: "info",
      type: "missed_dose",
      title: `Missed dose: Compartment ${i.containerNumber}`,
      body: `The dose scheduled for ${when} was not taken.`,
      occurredAt: i.scheduledAt,
    });
  }

  return alerts.sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return a.occurredAt < b.occurredAt ? 1 : -1;
  });
}

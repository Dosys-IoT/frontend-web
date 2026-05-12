// TODO(backend): full Alerts module — see lib/mocks/index.ts for endpoints.

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertType =
  | "environmental"
  | "inventory"
  | "missed_dose"
  | "device"
  | "calibration";
export type AlertStatus = "active" | "archived" | "snoozed" | "resolved";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  body: string;
  location?: string;
  sku?: string;
  patient?: string;
  ward?: string;
  occurredAt: string; // ISO
  status: AlertStatus;
  primaryAction?: "Mark Resolved" | "Contact Patient" | "Open Med";
}

const ANCHOR_NOW = "2026-05-11T20:30:00.000Z";

function isoMinusMin(minutes: number) {
  return new Date(new Date(ANCHOR_NOW).getTime() - minutes * 60_000).toISOString();
}

export const MOCK_ALERTS: Alert[] = [
  {
    id: "al-1",
    severity: "critical",
    type: "environmental",
    title: "Environmental Breach: Humidity High",
    body: "Storage Unit 4B detected humidity levels of 68% (Limit: 55%). Medication integrity may be compromised.",
    location: "Main Pharmacy Wing",
    occurredAt: isoMinusMin(12),
    status: "active",
    primaryAction: "Mark Resolved",
  },
  {
    id: "al-2",
    severity: "warning",
    type: "inventory",
    title: "Inventory Alert: Low Stock",
    body: "Warfarin 5mg Sodium Tablets are below the reorder point of 50 units. Current count: 12.",
    sku: "WRF-S-001",
    occurredAt: isoMinusMin(45),
    status: "active",
    primaryAction: "Open Med",
  },
  {
    id: "al-3",
    severity: "info",
    type: "missed_dose",
    title: "Patient Adherence: Missed Dose",
    body: "Patient Alice Henderson missed their 08:00 AM Lisinopril dose. Scheduled follow-up required.",
    patient: "Alice Henderson",
    ward: "Geriatric Ward",
    occurredAt: isoMinusMin(120),
    status: "active",
    primaryAction: "Contact Patient",
  },
  {
    id: "al-4",
    severity: "warning",
    type: "calibration",
    title: "Drift Detected on Scale 02",
    body: "Cumulative drift exceeds 0.5%. Recalibration recommended before next dispensing cycle.",
    occurredAt: isoMinusMin(240),
    status: "active",
    primaryAction: "Mark Resolved",
  },
  {
    id: "al-5",
    severity: "info",
    type: "device",
    title: "Firmware update available",
    body: "Dosys firmware v2.4.2 is ready to install. No action required during normal usage.",
    occurredAt: isoMinusMin(480),
    status: "archived",
    primaryAction: "Mark Resolved",
  },
];

export interface AlertsResponseMetrics {
  averageResponseTime: string;
  resolutionRatePct: number;
  aiInsight: string;
}

export const MOCK_ALERTS_METRICS: AlertsResponseMetrics = {
  averageResponseTime: "14m 20s",
  resolutionRatePct: 92,
  aiInsight: "Unit 4B alerts are occurring 20% more on Thursdays.",
};

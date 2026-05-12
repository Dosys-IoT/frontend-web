// TODO(backend): extend DeviceResponse + add /sensor-events endpoint.

export interface DeviceTelemetry {
  serial: string;
  batteryPct: number;
  wifiRssiDbm: number;
  firmwareVersion: string;
  firmwareChannel: "stable" | "beta";
  lastSyncMinutesAgo: number;
  audioReminderVolume: number;
  audioReminderActive: boolean;
  audioChimeName: string;
  desiccantPct: number;
  desiccantReplaceInDays: number;
}

export const MOCK_DEVICE_TELEMETRY: DeviceTelemetry = {
  serial: "#DS-9921-X",
  batteryPct: 92,
  wifiRssiDbm: -42,
  firmwareVersion: "v2.4.1",
  firmwareChannel: "stable",
  lastSyncMinutesAgo: 4,
  audioReminderVolume: 75,
  audioReminderActive: true,
  audioChimeName: "Gentle Morning Sanctuary",
  desiccantPct: 45,
  desiccantReplaceInDays: 14,
};

export type SensorEventKind =
  | "calibration"
  | "tamper"
  | "battery"
  | "humidity"
  | "wifi";

export interface SensorEvent {
  id: string;
  kind: SensorEventKind;
  title: string;
  detail: string;
  occurredAt: string; // ISO
  severity: "info" | "warning" | "critical";
}

// Deterministic ISO timestamps anchored to a fixed reference so the UI
// renders identically across reloads without hydration churn.
const ANCHOR = "2026-05-11T06:00:00.000Z";

function isoMinusHours(hours: number) {
  return new Date(new Date(ANCHOR).getTime() - hours * 3_600_000).toISOString();
}

export const MOCK_SENSOR_EVENTS: SensorEvent[] = [
  {
    id: "se-1",
    kind: "calibration",
    title: "Calibration Successful",
    detail: "Drift ratio +0.02% within tolerance.",
    occurredAt: isoMinusHours(2),
    severity: "info",
  },
  {
    id: "se-2",
    kind: "tamper",
    title: "Lid Tamper Detected",
    detail: "Compartment 3 lid opened outside scheduled window.",
    occurredAt: isoMinusHours(20),
    severity: "warning",
  },
  {
    id: "se-3",
    kind: "battery",
    title: "Battery Charged (98%)",
    detail: "Charging cycle completed.",
    occurredAt: isoMinusHours(54),
    severity: "info",
  },
  {
    id: "se-4",
    kind: "humidity",
    title: "Humidity Spike",
    detail: "Briefly reached 58% during a 12-minute window.",
    occurredAt: isoMinusHours(96),
    severity: "warning",
  },
];

// Calibration page: live measurement simulation parameters.
export interface CalibrationState {
  currentMg: number;
  stabilityPct: number;
  driftPct: number;
  certStatus: "Valid" | "Drifted" | "Expired";
  lastCalibratedISO: string;
}

export const MOCK_CALIBRATION: CalibrationState = {
  currentMg: 499.82,
  stabilityPct: 98.4,
  driftPct: 0.02,
  certStatus: "Valid",
  lastCalibratedISO: "2026-04-24T08:30:00.000Z",
};

// 5-compartment physical status overlay for the Device screen.
export type CompartmentPhysicalStatus =
  | "active"
  | "empty"
  | "stuck"
  | "checking";

export interface CompartmentStatus {
  containerNumber: number;
  status: CompartmentPhysicalStatus;
  fillPct: number; // 0–100
  label: string;
}

export const MOCK_COMPARTMENT_STATUS: CompartmentStatus[] = [
  { containerNumber: 1, status: "active", fillPct: 65, label: "65% Full" },
  { containerNumber: 2, status: "active", fillPct: 30, label: "30% Full" },
  { containerNumber: 3, status: "empty", fillPct: 0, label: "N/A" },
  { containerNumber: 4, status: "active", fillPct: 40, label: "40% Full" },
  { containerNumber: 5, status: "stuck", fillPct: 0, label: "Check Tray" },
];

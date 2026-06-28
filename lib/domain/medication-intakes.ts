import type {
  AdherenceCalendarResponse,
  AdherenceItem,
  IntakeStatus,
} from "@/lib/api/types";
import {
  formatLimaDate,
  formatLimaDateTime,
  getLimaDateKey,
  getLimaDayKey,
} from "@/lib/utils/date-time";

export type TimelineStatus = IntakeStatus | "PENDING" | "UNKNOWN";

export interface MedicationIntakeRow {
  id: string;
  scheduleId: number;
  containerNumber: number;
  medicationName: string;
  dosageLabel: string | null;
  scheduledAt: string;
  confirmedAt: string | null;
  status: TimelineStatus;
  scheduledLabel: string;
  confirmedLabel: string;
  localDateLabel: string;
  localDayKey: string;
  pillsTaken?: number;
}

export interface ComplianceDayState {
  label: string;
  state: "taken" | "pending" | "missed";
  isToday?: boolean;
}

export function flattenAdherenceCalendars(calendars: AdherenceCalendarResponse[]): AdherenceItem[] {
  return calendars.flatMap((calendar) => calendar.days.flatMap((day) => day.items));
}

export function buildMedicationIntakeRows(
  items: AdherenceItem[],
  medicationName: string,
  dosageLabel: string | null
): MedicationIntakeRow[] {
  return [...items]
    .sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1))
    .map((item) => ({
      id: `${item.scheduleId}-${item.scheduledAt}-${item.confirmedAt ?? "pending"}`,
      scheduleId: item.scheduleId,
      containerNumber: item.containerNumber,
      medicationName,
      dosageLabel,
      scheduledAt: item.scheduledAt,
      confirmedAt: item.confirmedAt,
      status: item.status,
      scheduledLabel: formatLimaDateTime(item.scheduledAt),
      confirmedLabel: formatLimaDateTime(item.confirmedAt),
      localDateLabel: formatLimaDate(item.scheduledAt),
      localDayKey: getLimaDayKey(item.scheduledAt),
      pillsTaken: item.status === "TAKEN" ? 1 : undefined,
    }));
}

export function buildComplianceWindow(items: AdherenceItem[], anchor: Date = new Date()) {
  const map = new Map<string, AdherenceItem[]>();
  for (const item of items) {
    const key = getLimaDateKey(item.scheduledAt);
    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);
  }

  const days: ComplianceDayState[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(anchor);
    date.setDate(date.getDate() - i);
    const key = getLimaDateKey(date);
    const dayItems = map.get(key) ?? [];
    let state: ComplianceDayState["state"] = "pending";
    if (dayItems.length > 0) {
      if (dayItems.some((item) => item.status === "MISSED")) {
        state = "missed";
      } else if (dayItems.some((item) => item.status === "TAKEN")) {
        state = "taken";
      }
    }
    days.push({
      label: getLimaDayKey(date),
      state,
      isToday: key === getLimaDateKey(anchor),
    });
  }

  return days;
}

export function filterIntakesForRange(items: AdherenceItem[], from: Date, to: Date) {
  const fromTime = from.getTime();
  const toTime = to.getTime();
  return items.filter((item) => {
    const scheduled = new Date(item.scheduledAt);
    if (Number.isNaN(scheduled.getTime())) return false;
    const scheduledTime = scheduled.getTime();
    return scheduledTime >= fromTime && scheduledTime <= toTime;
  });
}

export function formatIntakeStatusLabel(status: TimelineStatus) {
  if (status === "TAKEN") return "Taken";
  if (status === "MISSED") return "Missed";
  if (status === "PENDING") return "Pending";
  return "Unknown";
}

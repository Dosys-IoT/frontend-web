import type { DayOfWeek, LocalTimeDTO, UpsertScheduleRequest } from "@/lib/api/types";

export const ALL_DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export function parseTimeInput(value: string): LocalTimeDTO {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number.parseInt(hourRaw ?? "0", 10);
  const minute = Number.parseInt(minuteRaw ?? "0", 10);
  return {
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

export function formatTimeInput(value: LocalTimeDTO): string {
  const hour = String(value.hour).padStart(2, "0");
  const minute = String(value.minute).padStart(2, "0");
  return `${hour}:${minute}`;
}

export function formatUnknownTimeInput(value: LocalTimeDTO | string): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const parts = trimmed.split(":");
    if (parts.length < 2) return "";
    const hour = Number.parseInt(parts[0] ?? "0", 10);
    const minute = Number.parseInt(parts[1] ?? "0", 10);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";
    return formatTimeInput({ hour, minute });
  }
  return formatTimeInput(value);
}

export function addHours(value: LocalTimeDTO, hours: number): LocalTimeDTO {
  const total = value.hour * 60 + value.minute + hours * 60;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return {
    hour: Math.floor(normalized / 60),
    minute: normalized % 60,
  };
}

export function buildScheduleRequest(
  containerNumber: number,
  time: LocalTimeDTO,
  daysOfWeek: DayOfWeek[] = ALL_DAYS,
  isActive = true
): UpsertScheduleRequest {
  return {
    containerNumber,
    time,
    daysOfWeek,
    isActive,
  };
}

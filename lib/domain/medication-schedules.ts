import type { DayOfWeek, ScheduleResponse, UpsertScheduleRequest } from "@/lib/api/types";
import { formatTimeInput, parseTimeInput } from "@/lib/domain/medication-form";

export const DAY_OPTIONS: { value: DayOfWeek; shortLabel: string; label: string }[] = [
  { value: "MONDAY", shortLabel: "Mon", label: "Monday" },
  { value: "TUESDAY", shortLabel: "Tue", label: "Tuesday" },
  { value: "WEDNESDAY", shortLabel: "Wed", label: "Wednesday" },
  { value: "THURSDAY", shortLabel: "Thu", label: "Thursday" },
  { value: "FRIDAY", shortLabel: "Fri", label: "Friday" },
  { value: "SATURDAY", shortLabel: "Sat", label: "Saturday" },
  { value: "SUNDAY", shortLabel: "Sun", label: "Sunday" },
];

export interface ScheduleDraftValidation {
  dayError?: string;
  timeError?: string;
  duplicateError?: string;
}

const TWELVE_HOUR_PATTERN = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i;
const TWENTY_FOUR_HOUR_PATTERN = /^(\d{1,2}):(\d{2})$/;

export function normalizeTimeInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const amPmMatch = trimmed.toUpperCase().match(TWELVE_HOUR_PATTERN);
  if (amPmMatch) {
    const hour12 = Number.parseInt(amPmMatch[1] ?? "", 10);
    const minute = Number.parseInt(amPmMatch[2] ?? "", 10);
    const suffix = amPmMatch[3]?.toUpperCase();
    if (!Number.isFinite(hour12) || !Number.isFinite(minute) || hour12 < 1 || hour12 > 12 || minute < 0 || minute > 59) {
      return "";
    }
    const hour = suffix === "PM" ? (hour12 % 12) + 12 : hour12 % 12;
    return formatTimeInput({ hour, minute });
  }

  const twentyFourHourMatch = trimmed.match(TWENTY_FOUR_HOUR_PATTERN);
  if (!twentyFourHourMatch) return "";

  const hour = Number.parseInt(twentyFourHourMatch[1] ?? "", 10);
  const minute = Number.parseInt(twentyFourHourMatch[2] ?? "", 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return "";
  }

  return formatTimeInput({ hour, minute });
}

export function sortTimeInputs(times: string[]): string[] {
  return [...times]
    .map((time) => normalizeTimeInput(time))
    .filter((time): time is string => !!time)
    .sort((a, b) => {
      const left = parseTimeInput(a);
      const right = parseTimeInput(b);
      return left.hour * 60 + left.minute - (right.hour * 60 + right.minute);
    });
}

export function buildScheduleRequests(
  containerNumber: number,
  daysOfWeek: DayOfWeek[],
  times: string[]
): UpsertScheduleRequest[] {
  const normalizedDays = [...daysOfWeek];
  return sortTimeInputs(times).map((time) => ({
    containerNumber,
    time: parseTimeInput(time),
    daysOfWeek: normalizedDays,
    isActive: true,
  }));
}

export function validateScheduleDraft(
  daysOfWeek: DayOfWeek[],
  times: string[]
): ScheduleDraftValidation {
  const normalizedTimes = times
    .map((time) => normalizeTimeInput(time))
    .filter((time): time is string => !!time);
  const validation: ScheduleDraftValidation = {};
  const invalidTime = times.some((time) => time.trim().length > 0 && !normalizeTimeInput(time));

  if (daysOfWeek.length === 0) {
    validation.dayError = "Select at least one day.";
  }

  if (normalizedTimes.length === 0) {
    validation.timeError = "Add at least one valid time.";
  } else if (invalidTime) {
    validation.timeError = "Use a valid time like 08:00, 20:30 or 8:00 PM.";
  }

  if (normalizedTimes.length !== new Set(normalizedTimes).size) {
    validation.duplicateError = "Remove duplicate times before saving.";
  }

  return validation;
}

export function deriveScheduleDraft(schedules: ScheduleResponse[]): {
  daysOfWeek: DayOfWeek[];
  times: string[];
} {
  if (schedules.length === 0) {
    return { daysOfWeek: [], times: ["08:00"] };
  }

  const sorted = [...schedules].sort(compareScheduleResponseTime);
  const firstDays = sorted[0]?.daysOfWeek ?? [];
  const referenceKey = daySetKey(firstDays);
  const sharedDays = sorted.every((schedule) => daySetKey(schedule.daysOfWeek) === referenceKey)
    ? [...firstDays]
    : Array.from(new Set(sorted.flatMap((schedule) => schedule.daysOfWeek))).sort(daySort);

  const times = sortTimeInputs(sorted.map((schedule) => formatTimeInput(schedule.time)));
  return {
    daysOfWeek: sharedDays,
    times: times.length > 0 ? times : ["08:00"],
  };
}

function compareScheduleResponseTime(a: ScheduleResponse, b: ScheduleResponse) {
  const left = a.time.hour * 60 + a.time.minute;
  const right = b.time.hour * 60 + b.time.minute;
  return left - right;
}

function daySetKey(days: DayOfWeek[]) {
  return [...days].sort(daySort).join(",");
}

function daySort(a: DayOfWeek, b: DayOfWeek) {
  return DAY_OPTIONS.findIndex((d) => d.value === a) - DAY_OPTIONS.findIndex((d) => d.value === b);
}

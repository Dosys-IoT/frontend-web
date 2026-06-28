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

export function normalizeTimeInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const parts = trimmed.split(":");
  if (parts.length < 2) return "";

  const hour = Number.parseInt(parts[0] ?? "", 10);
  const minute = Number.parseInt(parts[1] ?? "", 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return "";

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
  const normalizedTimes = sortTimeInputs(times);
  const validation: ScheduleDraftValidation = {};

  if (daysOfWeek.length === 0) {
    validation.dayError = "Select at least one day.";
  }

  if (normalizedTimes.length === 0) {
    validation.timeError = "Add at least one valid time.";
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

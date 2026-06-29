import type { DayOfWeek, ScheduleResponse } from "@/lib/api/types";
import { parseTimeInput } from "@/lib/domain/medication-form";
import { formatUnknownTimeInput } from "@/lib/domain/medication-form";

export interface UpcomingDose {
  schedule: ScheduleResponse;
  scheduledAt: Date;
  minutesUntil: number;
}

const DAY_INDEX: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/**
 * Builds a Date for the next occurrence of `schedule.time` on one of its
 * active `daysOfWeek`, scanning forward from `now` for up to 7 days.
 * Returns null if the schedule has no active days.
 *
 * Exported so `selectNextDose` can stay focused on the *selection* decision
 * (which schedule wins) while date math is handled here.
 */
export function nextOccurrence(schedule: ScheduleResponse, now: Date): Date | null {
  if (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0) return null;
  const wantedDays = new Set(schedule.daysOfWeek.map((d) => DAY_INDEX[d]));
  const normalizedTime = formatUnknownTimeInput(schedule.time);
  if (!normalizedTime) return null;
  const parsedTime = parseTimeInput(normalizedTime);
  for (let offset = 0; offset < 7; offset++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    if (!wantedDays.has(candidate.getDay())) continue;
    candidate.setHours(parsedTime.hour, parsedTime.minute, parsedTime.second ?? 0, 0);
    if (candidate.getTime() > now.getTime()) return candidate;
  }
  return null;
}

/**
 * 🧑‍💻 USER CONTRIBUTION REQUESTED
 * ----------------------------------------------------------------
 * Pick the single upcoming dose to highlight on the Dashboard's
 * "Upcoming Dose" card.
 *
 * Inputs:
 *   - schedules:  all schedules for the active device
 *   - now:        current time (passed in so it's testable)
 *
 * What to decide (business logic — there's no single right answer):
 *   1. Ignore inactive schedules (`isActive === false`)? Almost certainly yes.
 *   2. Use `nextOccurrence(schedule, now)` to get each candidate's next firing.
 *   3. Return the one that fires *soonest in the future*.
 *   4. Return `null` if nothing is scheduled in the next 7 days.
 *
 * Edge cases to consider:
 *   - Two schedules firing at the same minute → which wins? (e.g. lowest containerNumber).
 *   - A dose scheduled for "right now" (within ±60 seconds) — show it as upcoming or hide it?
 *
 * Implementation goes below (≈ 8–12 lines).
 */
export function selectNextDose(
  schedules: ScheduleResponse[],
  now: Date = new Date()
): UpcomingDose | null {
  let best: UpcomingDose | null = null;
  for (const s of schedules) {
    if (!s.isActive) continue;
    const at = nextOccurrence(s, now);
    if (!at) continue;
    if (
      !best ||
      at.getTime() < best.scheduledAt.getTime() ||
      (at.getTime() === best.scheduledAt.getTime() &&
        s.containerNumber < best.schedule.containerNumber)
    ) {
      best = {
        schedule: s,
        scheduledAt: at,
        minutesUntil: Math.round((at.getTime() - now.getTime()) / 60_000),
      };
    }
  }
  return best;
}

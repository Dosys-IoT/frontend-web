"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DayOfWeek } from "@/lib/api/types";
import { DAY_OPTIONS, normalizeTimeInput, sortTimeInputs } from "@/lib/domain/medication-schedules";

interface CustomScheduleEditorProps {
  daysOfWeek: DayOfWeek[];
  times: string[];
  onDaysChange: (next: DayOfWeek[]) => void;
  onTimesChange: (next: string[]) => void;
  dayError?: string;
  timeError?: string;
  duplicateError?: string;
}

export function CustomScheduleEditor({
  daysOfWeek,
  times,
  onDaysChange,
  onTimesChange,
  dayError,
  timeError,
  duplicateError,
}: CustomScheduleEditorProps) {
  const [drafts, setDrafts] = useState<string[]>(times);
  const draftSignature = useMemo(() => times.join("|"), [times]);

  useEffect(() => {
    setDrafts(times);
  }, [draftSignature, times]);

  const toggleDay = (value: DayOfWeek) => {
    const exists = daysOfWeek.includes(value);
    onDaysChange(
      exists ? daysOfWeek.filter((day) => day !== value) : [...daysOfWeek, value]
    );
  };

  const updateTime = (index: number, value: string) => {
    const next = [...drafts];
    next[index] = value;
    setDrafts(next);
    onTimesChange(next);
  };

  const normalizeDraft = (index: number) => {
    const normalized = normalizeTimeInput(drafts[index] ?? "");
    const next = [...drafts];
    next[index] = normalized || (drafts[index] ?? "").trim();
    setDrafts(next);
    onTimesChange(normalized ? sortTimeInputs(next) : next);
  };

  const addTime = () => {
    const next = [...drafts, ""];
    setDrafts(next);
    onTimesChange(next);
  };

  const removeTime = (index: number) => {
    const next = drafts.filter((_, i) => i !== index);
    setDrafts(next);
    onTimesChange(next.length > 0 ? sortTimeInputs(next) : []);
  };

  return (
    <div className="grid gap-5">
      <div>
        <Label>Dose schedule</Label>
        <p className="mt-1 text-[12px] text-[var(--color-ink-500)]">
          Choose the exact days and add as many reminder times as you need.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DAY_OPTIONS.map((day) => {
            const active = daysOfWeek.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={
                  "rounded-full px-3.5 py-2 text-[12px] font-medium transition-colors " +
                  (active
                    ? "bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]"
                    : "bg-[var(--color-cream-100)] text-[var(--color-ink-500)] hover:bg-[var(--color-sanctuary-50)]")
                }
              >
                {day.shortLabel}
              </button>
            );
          })}
        </div>
        {dayError && <p className="mt-2 text-[12px] text-[var(--color-danger-600)]">{dayError}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <Label>Reminder times</Label>
          <Button type="button" variant="secondary" size="sm" onClick={addTime}>
            <Plus className="h-3.5 w-3.5" />
            Add time
          </Button>
        </div>

        <div className="mt-3 grid gap-3">
          {drafts.map((time, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-2xl border border-[var(--color-ink-100)] bg-[var(--color-cream-50)] p-3"
            >
              <Input
                type="text"
                value={time}
                onChange={(e) => updateTime(index, e.target.value)}
                onBlur={() => normalizeDraft(index)}
                placeholder="HH:mm"
                className="max-w-[180px]"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => removeTime(index)}
                className="ml-auto"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          ))}
        </div>

        {timeError && <p className="mt-2 text-[12px] text-[var(--color-danger-600)]">{timeError}</p>}
        {duplicateError && (
          <p className="mt-2 text-[12px] text-[var(--color-danger-600)]">{duplicateError}</p>
        )}
      </div>
    </div>
  );
}

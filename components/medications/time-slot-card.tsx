"use client";

import { Sun, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlotCardProps {
  hour: number;
  minute: number;
  contextLabel?: string;
  onTimeChange: (hour: number, minute: number) => void;
  onRemove?: () => void;
}

function fmt12h(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return { hh, period };
}

export function TimeSlotCard({
  hour,
  minute,
  contextLabel,
  onTimeChange,
  onRemove,
}: TimeSlotCardProps) {
  const { hh, period } = fmt12h(hour);
  const stamp = `${String(hh).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const inputValue = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return (
    <div className="relative flex flex-col rounded-2xl border-l-4 border-[var(--color-sanctuary-500)] bg-[var(--color-cream-50)] p-4">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-ink-400)]">
          Slot
        </p>
        <Sun className="h-3.5 w-3.5 text-[var(--color-amber-500)]" />
      </div>
      <p className="mt-3 font-display text-[28px] leading-none text-[var(--color-ink-900)]">
        {stamp}
        <span className="ml-1 text-[14px] font-sans tracking-wide text-[var(--color-ink-500)]">
          {period}
        </span>
      </p>
      <p className="mt-2 text-[12px] text-[var(--color-ink-500)]">
        {contextLabel ?? "Recurrence: daily"}
      </p>
      <label className="mt-4 inline-flex items-center gap-2 text-[12px] font-medium text-[var(--color-sanctuary-700)]">
        Edit Time
        <input
          type="time"
          value={inputValue}
          onChange={(e) => {
            const [h, m] = e.target.value.split(":").map(Number);
            onTimeChange(h ?? hour, m ?? minute);
          }}
          className={cn(
            "rounded-md border border-[var(--color-ink-100)] bg-white px-2 py-1 text-[12px]",
            "focus:outline-none focus:border-[var(--color-sanctuary-500)]"
          )}
        />
      </label>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-3 top-3 p-1 text-[var(--color-ink-400)] hover:text-[var(--color-danger-600)]"
          aria-label="Remove slot"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

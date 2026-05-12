"use client";

import { cn } from "@/lib/utils";

export type DoseFrequency = "ONCE" | "TWICE" | "AS_NEEDED";

const OPTIONS: { value: DoseFrequency; label: string }[] = [
  { value: "ONCE", label: "Once Daily" },
  { value: "TWICE", label: "Twice Daily" },
  { value: "AS_NEEDED", label: "As Needed" },
];

interface FrequencyPickerProps {
  value: DoseFrequency;
  onChange: (next: DoseFrequency) => void;
}

export function FrequencyPicker({ value, onChange }: FrequencyPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors",
              active
                ? "bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]"
                : "bg-[var(--color-cream-100)] text-[var(--color-ink-500)] hover:bg-[var(--color-sanctuary-50)]"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

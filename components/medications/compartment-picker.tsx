"use client";

import { cn } from "@/lib/utils";

interface CompartmentPickerProps {
  value: number;
  onChange: (n: number) => void;
  disabledNumbers?: number[];
}

export function CompartmentPicker({
  value,
  onChange,
  disabledNumbers = [],
}: CompartmentPickerProps) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => {
        const disabled = disabledNumbers.includes(n);
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={cn(
              "h-11 w-11 rounded-full text-[14px] font-semibold transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-40",
              active
                ? "bg-[var(--color-sanctuary-600)] text-white shadow-[0_8px_20px_-10px_var(--color-sanctuary-700)]"
                : "bg-[var(--color-cream-100)] text-[var(--color-ink-700)] hover:bg-[var(--color-sanctuary-100)] hover:text-[var(--color-sanctuary-700)]"
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

import { cn } from "@/lib/utils";

interface DosysMarkProps {
  tone?: "light" | "dark";
  showSubtitle?: boolean;
  className?: string;
}

export function DosysMark({ tone = "light", showSubtitle = false, className }: DosysMarkProps) {
  const isDark = tone === "dark";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className={cn(
          "grid h-9 w-9 place-items-center rounded-2xl",
          isDark
            ? "bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]"
            : "bg-white/15 text-white backdrop-blur"
        )}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="6" width="16" height="12" rx="6" />
          <line x1="9" y1="12" x2="15" y2="12" strokeLinecap="round" />
        </svg>
      </span>
      <div className="leading-tight">
        <p className={cn("font-semibold tracking-tight", isDark ? "text-[var(--color-sanctuary-700)]" : "text-white")}>
          Dosys
        </p>
        {showSubtitle && (
          <p
            className={cn(
              "text-[10px] uppercase tracking-[0.18em]",
              isDark ? "text-[var(--color-ink-400)]" : "text-white/60"
            )}
          >
            Clinical Sanctuary
          </p>
        )}
      </div>
    </div>
  );
}

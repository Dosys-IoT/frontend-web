interface WeeklyScoreCardProps {
  score: number;
  missedDoses: number;
  windowDays?: number;
}

export function WeeklyScoreCard({
  score,
  missedDoses,
  windowDays = 14,
}: WeeklyScoreCardProps) {
  const dashArray = 2 * Math.PI * 52;
  const dashOffset = dashArray * (1 - Math.min(Math.max(score, 0), 100) / 100);

  const label =
    score >= 90 ? "Excellent Consistency" : score >= 75 ? "On Track" : "Needs Attention";

  return (
    <div className="flex h-full flex-col items-center rounded-[28px] bg-white p-7 text-center shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 120 120" className="-rotate-90">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--color-sanctuary-100)"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--color-sanctuary-600)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div>
            <p className="font-display text-[34px] leading-none text-[var(--color-ink-900)]">
              {score}%
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-400)]">
              Weekly Score
            </p>
          </div>
        </div>
      </div>

      <p className="mt-5 text-[16px] font-semibold text-[var(--color-ink-900)]">{label}</p>
      <p className="mt-2 max-w-[28ch] text-[13px] leading-relaxed text-[var(--color-ink-500)]">
        You&apos;ve missed {missedDoses} {missedDoses === 1 ? "dose" : "doses"} in the
        last {windowDays} days. Keep it up!
      </p>
    </div>
  );
}

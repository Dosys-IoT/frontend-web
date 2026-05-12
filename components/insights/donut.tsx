interface DonutProps {
  pct: number;
  size?: number;
  thickness?: number;
  label?: string;
}

export function Donut({ pct, size = 160, thickness = 14, label }: DonutProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * c;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-cream-100)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-sanctuary-600)"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-[36px] leading-none text-[var(--color-ink-900)]">
          {Math.round(pct)}%
        </p>
        {label && (
          <p className="mt-1 text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">
            {label}
          </p>
        )}
      </div>
    </div>
  );
}

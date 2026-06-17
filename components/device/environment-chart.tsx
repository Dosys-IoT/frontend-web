"use client";

import { useMemo } from "react";
import type { EnvironmentReadingResponse } from "@/lib/api/types";

interface Props {
  readings: EnvironmentReadingResponse[];
}

const W = 600;
const H = 200;
const PAD_X = 8;
const PAD_Y = 16;

interface Series {
  color: string;
  points: { x: number; y: number }[];
}

function buildSeries(
  readings: EnvironmentReadingResponse[],
  pick: (r: EnvironmentReadingResponse) => number,
  color: string
): { series: Series; min: number; max: number } {
  const values = readings.map(pick);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;

  const points = readings.map((r, i) => {
    const x = PAD_X + (readings.length === 1 ? innerW / 2 : (i / (readings.length - 1)) * innerW);
    const y = PAD_Y + innerH - ((pick(r) - min) / span) * innerH;
    return { x, y };
  });

  return { series: { color, points }, min, max };
}

function toPath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

/** 24h environment report — temperature (°C) and humidity (%) over time (US22). */
export function EnvironmentChart({ readings }: Props) {
  const data = useMemo(() => {
    const sorted = [...readings].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );
    if (sorted.length < 2) return null;

    const temp = buildSeries(sorted, (r) => r.temperature, "var(--color-danger-500)");
    const hum = buildSeries(sorted, (r) => r.humidity, "var(--color-sanctuary-500)");

    const fmt = (iso: string) =>
      new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    return {
      temp,
      hum,
      startLabel: fmt(sorted[0].recordedAt),
      midLabel: fmt(sorted[Math.floor(sorted.length / 2)].recordedAt),
      endLabel: fmt(sorted[sorted.length - 1].recordedAt),
      latestTemp: sorted[sorted.length - 1].temperature,
      latestHum: sorted[sorted.length - 1].humidity,
    };
  }, [readings]);

  if (!data) {
    return (
      <div className="grid h-[200px] place-items-center rounded-2xl bg-[var(--color-cream-50)] text-[13px] text-[var(--color-ink-400)]">
        Not enough readings yet to draw a trend.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-[12px]">
        <LegendDot color="var(--color-danger-500)" label="Temperature" value={`${data.latestTemp.toFixed(1)}°C`} />
        <LegendDot color="var(--color-sanctuary-500)" label="Humidity" value={`${Math.round(data.latestHum)}%`} />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="h-[200px] w-full" preserveAspectRatio="none">
        <path d={toPath(data.hum.series.points)} fill="none" stroke={data.hum.series.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <path d={toPath(data.temp.series.points)} fill="none" stroke={data.temp.series.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      </svg>

      <div className="mt-2 flex justify-between text-[11px] text-[var(--color-ink-400)]">
        <span>{data.startLabel}</span>
        <span>{data.midLabel}</span>
        <span>{data.endLabel}</span>
      </div>
    </div>
  );
}

function LegendDot({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-500)]">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
      <span className="font-semibold text-[var(--color-ink-900)]">{value}</span>
    </span>
  );
}

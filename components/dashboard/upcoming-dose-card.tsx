"use client";

import { Check, Clock, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { UpcomingDose } from "@/lib/domain/next-dose";
import type { ContainerResponse } from "@/lib/api/types";

interface UpcomingDoseCardProps {
  dose: UpcomingDose | null;
  containers: ContainerResponse[];
  onMarkTaken?: () => void;
  onSnooze?: () => void;
}

function formatCountdown(minutes: number) {
  const h = Math.max(0, Math.floor(minutes / 60));
  const m = Math.max(0, Math.floor(minutes % 60));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatClock(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function UpcomingDoseCard({
  dose,
  containers,
  onMarkTaken,
  onSnooze,
}: UpcomingDoseCardProps) {
  if (!dose) {
    return (
      <div className="relative overflow-hidden rounded-[28px] bg-[var(--color-sanctuary-700)] p-7 text-white shadow-[var(--shadow-card)]">
        <Badge tone="sanctuary" className="bg-white/15 text-white">
          <Clock className="h-3 w-3" /> No upcoming dose
        </Badge>
        <p className="mt-5 font-display text-[34px] leading-tight">
          All caught up for now.
        </p>
        <p className="mt-3 max-w-[42ch] text-white/75">
          Your next scheduled dose will appear here when it's within the upcoming
          window.
        </p>
      </div>
    );
  }

  const c = containers.find((x) => x.containerNumber === dose.schedule.containerNumber);
  const title = c?.medicationName ?? `Container ${dose.schedule.containerNumber}`;

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[var(--color-sanctuary-700)] to-[var(--color-sanctuary-600)] p-7 text-white shadow-[var(--shadow-card)] grain">
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
      <Badge tone="sanctuary" className="relative bg-white/15 text-white">
        Upcoming Dose
      </Badge>

      <div className="relative mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-[52%] min-w-[200px]">
          <h2 className="font-display text-[34px] leading-[1.05]">{title}</h2>
          {c?.dosageLabel && (
            <p className="mt-1 text-[13px] uppercase tracking-wide text-white/65">
              {c.dosageLabel}
            </p>
          )}
          <p className="mt-3 max-w-[36ch] text-[14px] leading-relaxed text-white/80">
            Take with a full glass of water. Your heart and bones will thank you.
          </p>
        </div>

        <div className="rounded-2xl bg-white/10 px-5 py-4 text-right backdrop-blur">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/70">
            Time remaining
          </p>
          <p className="font-display text-[42px] leading-none">
            {formatCountdown(dose.minutesUntil)}
          </p>
          <p className="mt-1 text-[12px] text-white/70">
            Scheduled for {formatClock(dose.scheduledAt)}
          </p>
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className="bg-white/95 hover:bg-white"
          onClick={onMarkTaken}
        >
          <Check className="h-4 w-4" />
          I&apos;ve taken it
        </Button>
        <Button
          variant="ghost"
          className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
          onClick={onSnooze}
        >
          <Moon className="h-4 w-4" />
          Snooze 15m
        </Button>
      </div>
    </div>
  );
}

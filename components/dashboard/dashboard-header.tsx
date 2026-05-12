"use client";

import { Calendar, Droplets, Link2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatLongDate, ordinal } from "@/lib/utils";

interface DashboardHeaderProps {
  firstName: string;
  dosesRemaining: number;
  deviceLinked: boolean;
  humidity: number | null;
  onSync?: () => void;
}

export function DashboardHeader({
  firstName,
  dosesRemaining,
  deviceLinked,
  humidity,
  onSync,
}: DashboardHeaderProps) {
  const now = new Date();
  const dateLabel = `${formatLongDate(now).replace(/\d+$/, "")}${ordinal(now.getDate())}`;

  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="inline-flex items-center gap-2 text-[13px] text-[var(--color-ink-500)]">
          <Calendar className="h-4 w-4" /> {dateLabel}
        </p>
        <h1 className="mt-2 font-display text-[44px] leading-[1.05] text-[var(--color-ink-900)]">
          Hello, {firstName}
        </h1>
        <p className="mt-1 text-[15px] text-[var(--color-ink-500)]">
          Your sanctuary is stable. {dosesRemaining} doses remaining for today.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-full bg-white p-1.5 pr-2 shadow-[var(--shadow-soft)]">
        <Badge tone={deviceLinked ? "sanctuary" : "danger"}>
          <Link2 className="h-3 w-3" />
          {deviceLinked ? "Device Linked" : "No Device"}
        </Badge>
        <Badge tone="neutral">
          <Droplets className="h-3 w-3" />
          {humidity == null ? "—" : `${Math.round(humidity)}% Humidity`}
        </Badge>
        <button
          onClick={onSync}
          className="ml-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-sanctuary-700)] hover:bg-[var(--color-sanctuary-100)]"
        >
          <RefreshCw className="h-3 w-3" /> Sync Now
        </button>
      </div>
    </header>
  );
}

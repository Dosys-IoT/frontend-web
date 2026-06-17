"use client";

import { AlertTriangle, Bell, Boxes, Calendar, Droplets, WifiOff } from "lucide-react";
import type { Alert } from "@/lib/domain/alerts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  alert: Alert;
}

const ICON_BY_TYPE = {
  environmental: Droplets,
  inventory: Boxes,
  missed_dose: Bell,
  device: WifiOff,
} as const;

const SEVERITY_META = {
  critical: {
    border: "border-l-[var(--color-danger-500)]",
    chip: "bg-[var(--color-danger-50)] text-[var(--color-danger-600)]",
    iconBg: "bg-[var(--color-danger-50)] text-[var(--color-danger-600)]",
    label: "Critical",
  },
  warning: {
    border: "border-l-[var(--color-sanctuary-500)]",
    chip: "bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]",
    iconBg: "bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]",
    label: "Warning",
  },
  info: {
    border: "border-l-[var(--color-ink-200)]",
    chip: "bg-[var(--color-ink-50)] text-[var(--color-ink-700)]",
    iconBg: "bg-[var(--color-ink-50)] text-[var(--color-ink-500)]",
    label: "Information",
  },
} as const;

function relativeAgo(iso: string, now = Date.now()) {
  const mins = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function AlertCard({ alert }: Props) {
  const Icon = ICON_BY_TYPE[alert.type] ?? AlertTriangle;
  const meta = SEVERITY_META[alert.severity];

  return (
    <article
      className={cn(
        "flex items-start gap-4 rounded-3xl border-l-4 bg-white p-5 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60",
        meta.border
      )}
    >
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", meta.iconBg)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex flex-1 flex-col gap-1.5">
        <Badge className={cn("self-start", meta.chip)}>{meta.label.toUpperCase()}</Badge>
        <h3 className="text-[15px] font-semibold text-[var(--color-ink-900)]">
          {alert.title}
        </h3>
        <p className="text-[13px] leading-relaxed text-[var(--color-ink-500)]">
          {alert.body}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-ink-400)]">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {relativeAgo(alert.occurredAt)}
          </span>
        </div>
      </div>
    </article>
  );
}

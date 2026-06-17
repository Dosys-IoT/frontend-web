"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bell,
  CheckCircle2,
  Mail,
  MessageSquare,
  Volume2,
  Watch,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Label } from "@/components/ui/label";
import { accessApi } from "@/lib/api/endpoints";
import { MOCK_PREFERENCES, type UserPreferences } from "@/lib/mocks";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const meQ = useQuery({ queryKey: ["me"], queryFn: accessApi.me });
  const [prefs, setPrefs] = useState<UserPreferences>(MOCK_PREFERENCES);

  const user = meQ.data;
  const fullName = user ? `${user.firstName} ${user.lastName}` : "—";
  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`
    : "?";

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <header>
        <h1 className="font-display text-[44px] leading-none text-[var(--color-ink-900)]">
          Settings
        </h1>
        <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
          Customize your clinical experience and device interface.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-5">
          {/* Profile card */}
          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[var(--color-ink-700)] to-[var(--color-sanctuary-900)] font-display text-2xl text-white">
                {initials}
              </span>
              <div className="flex-1">
                <h2 className="font-display text-[28px] leading-tight text-[var(--color-ink-900)]">
                  {fullName}
                </h2>
                <p className="text-[12px] text-[var(--color-ink-500)]">
                  Primary Patient Account · ID: {prefs.patientId}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="sanctuary" className="normal-case">
                    {prefs.membershipTier}
                  </Badge>
                  {prefs.verifiedHealthData && (
                    <Badge tone="neutral" className="normal-case">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Health Data
                    </Badge>
                  )}
                </div>
              </div>
              <Button>Save Changes</Button>
            </div>
          </section>

          {/* Reminder Preferences */}
          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <h3 className="text-[14px] font-semibold text-[var(--color-ink-900)]">
              <Bell className="mr-2 inline h-4 w-4 text-[var(--color-sanctuary-600)]" />
              Reminder Preferences
            </h3>

            <div className="mt-4 flex flex-col gap-5">
              <ToggleRow
                title="Voice Assistance"
                body="Spoken medication reminders"
                checked={prefs.voiceAssist}
                onChange={(v) => setPrefs({ ...prefs, voiceAssist: v })}
              />

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-[14px] text-[var(--color-ink-900)]">
                    Reminder Volume
                  </Label>
                  <span className="text-[12px] font-semibold text-[var(--color-ink-700)]">
                    {prefs.reminderVolume}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={prefs.reminderVolume}
                  onChange={(e) =>
                    setPrefs({ ...prefs, reminderVolume: Number(e.target.value) })
                  }
                  className="mt-2 w-full accent-[var(--color-sanctuary-600)]"
                />
              </div>

              <ToggleRow
                title="Frequency Calibration"
                body="Adaptive alerts based on activity"
                checked={prefs.frequencyCalibration}
                onChange={(v) => setPrefs({ ...prefs, frequencyCalibration: v })}
              />
            </div>
          </section>

          {/* Accessibility */}
          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <h3 className="text-[14px] font-semibold text-[var(--color-ink-900)]">
              <Activity className="mr-2 inline h-4 w-4 text-[var(--color-sanctuary-600)]" />
              Accessibility
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <AccessibilityTile
                title="High Contrast Mode"
                body="Optimized for visual clarity"
                enabled={prefs.highContrast}
                onToggle={() =>
                  setPrefs({ ...prefs, highContrast: !prefs.highContrast })
                }
              />
              <AccessibilityTile
                title="Screen Reader"
                body="Full navigation narration"
                enabled={prefs.screenReader}
                onToggle={() =>
                  setPrefs({ ...prefs, screenReader: !prefs.screenReader })
                }
              />
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-5">
          {/* Connected device */}
          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
              Connected Device
            </p>
            <div className="mt-3 grid h-[140px] place-items-center rounded-3xl bg-[var(--color-cream-100)]">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-white shadow-inner">
                <Watch className="h-10 w-10 text-[var(--color-sanctuary-700)]" />
              </span>
            </div>
            <p className="mt-4 text-[15px] font-semibold text-[var(--color-ink-900)]">
              {prefs.connectedDeviceName}
            </p>
            <p className="text-[12px] text-[var(--color-ink-500)]">
              Firmware: {prefs.connectedDeviceFirmware}
            </p>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-[var(--color-cream-100)] p-3">
              <span className="text-[12px] text-[var(--color-ink-500)]">Sync Status</span>
              <span className="text-[12px] font-semibold text-[var(--color-sanctuary-700)]">
                Perfect
              </span>
            </div>

            <Button variant="secondary" size="sm" className="mt-4 w-full">
              Run Diagnostics
            </Button>
          </section>

          {/* Notifications */}
          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <h3 className="text-[14px] font-semibold text-[var(--color-ink-900)]">
              Notifications
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              <NotifRow
                icon={<Mail className="h-4 w-4" />}
                title="Email Updates"
                body="Weekly health reports"
                checked={prefs.notifications.emailUpdates}
                onChange={(v) =>
                  setPrefs({
                    ...prefs,
                    notifications: { ...prefs.notifications, emailUpdates: v },
                  })
                }
              />
              <NotifRow
                icon={<MessageSquare className="h-4 w-4" />}
                title="SMS Alerts"
                body="Critical missed doses"
                checked={prefs.notifications.smsAlerts}
                onChange={(v) =>
                  setPrefs({
                    ...prefs,
                    notifications: { ...prefs.notifications, smsAlerts: v },
                  })
                }
              />
              <NotifRow
                icon={<Volume2 className="h-4 w-4" />}
                title="Push Notifications"
                body="Daily schedule"
                checked={prefs.notifications.pushNotifications}
                onChange={(v) =>
                  setPrefs({
                    ...prefs,
                    notifications: { ...prefs.notifications, pushNotifications: v },
                  })
                }
              />
            </ul>
          </section>

          <section className="rounded-3xl bg-[var(--color-danger-50)] p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-danger-600)]">
              Advanced
            </p>
            <button className="mt-3 block text-[13px] font-semibold text-[var(--color-ink-900)] hover:underline">
              Export Medical History
            </button>
            <button className="mt-2 block text-[13px] font-semibold text-[var(--color-danger-600)] hover:underline">
              Deactivate Account
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  body,
  checked,
  onChange,
}: {
  title: string;
  body: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[14px] font-semibold text-[var(--color-ink-900)]">{title}</p>
        <p className="text-[12px] text-[var(--color-ink-500)]">{body}</p>
      </div>
      <Toggle checked={checked} onCheckedChange={onChange} label={title} />
    </div>
  );
}

function AccessibilityTile({
  title,
  body,
  enabled,
  onToggle,
}: {
  title: string;
  body: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-ink-50)] bg-[var(--color-cream-50)] p-4">
      <p className="text-[14px] font-semibold text-[var(--color-ink-900)]">{title}</p>
      <p className="mt-1 text-[12px] text-[var(--color-ink-500)]">{body}</p>
      <button
        onClick={onToggle}
        className={cn(
          "mt-3 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors",
          enabled
            ? "bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]"
            : "bg-[var(--color-ink-50)] text-[var(--color-ink-500)] hover:bg-[var(--color-ink-100)]"
        )}
      >
        {enabled ? "Enable" : "Disable"}
      </button>
    </div>
  );
}

function NotifRow({
  icon,
  title,
  body,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-cream-100)] text-[var(--color-ink-500)]">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-[13px] font-semibold text-[var(--color-ink-900)]">{title}</p>
        <p className="text-[11px] text-[var(--color-ink-500)]">{body}</p>
      </div>
      <Toggle checked={checked} onCheckedChange={onChange} label={title} />
    </li>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Unlink2, UserRound, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { accessApi, devicesApi, edgeApi } from "@/lib/api/endpoints";
import { selectPrimaryDevice } from "@/lib/domain/device-selection";
import type { AlarmSettingsRequest, ApiError, UpdateProfileRequest } from "@/lib/api/types";
import { formatLimaDateTime } from "@/lib/utils/date-time";

export default function ProfilePage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const meQ = useQuery({ queryKey: ["me"], queryFn: accessApi.me });
  const devicesQ = useQuery({ queryKey: ["devices"], queryFn: devicesApi.list });

  const selectedDevice = selectPrimaryDevice(devicesQ.data);
  const linkedDevice = selectedDevice.device;
  const linkedDeviceId = selectedDevice.apiDeviceId;
  const hasLinkedDevice = linkedDevice != null && linkedDeviceId != null;

  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({
    firstName: "",
    lastName: "",
  });

  const [alarmForm, setAlarmForm] = useState<AlarmSettingsRequest>({
    alarmVolumePercent: 80,
    quietHoursEnabled: false,
    quietHoursStart: "21:00",
    quietHoursEnd: "06:00",
    quietHoursVolumePercent: 50,
  });

  useEffect(() => {
    if (!meQ.data) return;
    setProfileForm({
      firstName: meQ.data.firstName ?? "",
      lastName: meQ.data.lastName ?? "",
    });
  }, [meQ.data]);

  useEffect(() => {
    if (!linkedDevice) return;
    setAlarmForm({
      alarmVolumePercent: linkedDevice.alarmVolumePercent ?? 80,
      quietHoursEnabled: linkedDevice.quietHoursEnabled ?? false,
      quietHoursStart: linkedDevice.quietHoursStart ?? "21:00",
      quietHoursEnd: linkedDevice.quietHoursEnd ?? "06:00",
      quietHoursVolumePercent: linkedDevice.quietHoursVolumePercent ?? 50,
    });
  }, [linkedDevice]);

  const displayName = useMemo(() => {
    const first = profileForm.firstName.trim();
    const last = profileForm.lastName.trim();
    const combined = `${first} ${last}`.trim();
    return combined || meQ.data?.email || "User";
  }, [meQ.data?.email, profileForm.firstName, profileForm.lastName]);

  const initials = useMemo(() => {
    const first = profileForm.firstName.trim().charAt(0);
    const last = profileForm.lastName.trim().charAt(0);
    const merged = `${first}${last}`.trim().toUpperCase();
    if (merged) return merged;
    return (meQ.data?.email?.slice(0, 2) ?? "DU").toUpperCase();
  }, [meQ.data?.email, profileForm.firstName, profileForm.lastName]);

  const updateProfileMutation = useMutation({
    mutationFn: () => accessApi.updateMe(profileForm),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setProfileForm({
        firstName: updated.firstName,
        lastName: updated.lastName,
      });
      toast.success("Profile saved.");
    },
    onError: (error) => {
      toast.error(`Could not save profile: ${getErrorMessage(error)}`);
    },
  });

  const saveAlarmMutation = useMutation({
    mutationFn: async () => {
      if (!linkedDeviceId) throw new Error("No device linked");
      await devicesApi.updateAlarmSettings(linkedDeviceId, alarmForm);
      try {
        await edgeApi.configSync(String(selectedDevice.displayDeviceId ?? linkedDeviceId));
        return true;
      } catch {
        return false;
      }
    },
    onSuccess: (synced) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast.success(
        synced
          ? "Alarm settings saved and device synced."
          : "Alarm settings saved, but device sync failed. Please sync manually."
      );
    },
    onError: (error) => {
      toast.error(`Could not save alarm settings: ${getErrorMessage(error)}`);
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      if (!linkedDeviceId) throw new Error("No device linked");
      return devicesApi.unlinkDevice(linkedDeviceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast.success("Device unlinked.");
    },
    onError: (error) => {
      toast.error(`Could not unlink device: ${getErrorMessage(error)}`);
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <section className="grain overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,var(--color-ink-950),var(--color-sanctuary-800))] p-6 text-white shadow-[var(--shadow-hero)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-white/14 text-[28px] font-semibold tracking-[0.08em] text-white ring-1 ring-white/15">
              {initials}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/60">Profile</p>
              <h1 className="mt-2 font-display text-[36px] leading-none text-white md:text-[44px]">
                {displayName}
              </h1>
              <p className="mt-3 text-[14px] text-white/75">{meQ.data?.email ?? "Unavailable"}</p>
              <p className="mt-2 text-[12px] text-white/55">
                Last updated {formatLimaDateTime(meQ.data?.updatedAt) || "Unavailable"}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => queryClient.invalidateQueries()}
            className="bg-white text-[var(--color-ink-900)] hover:bg-white/90"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh profile
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field
            label="First name"
            value={profileForm.firstName}
            onChange={(value) => setProfileForm((current) => ({ ...current, firstName: value }))}
            inverted
          />
          <Field
            label="Last name"
            value={profileForm.lastName}
            onChange={(value) => setProfileForm((current) => ({ ...current, lastName: value }))}
            inverted
          />
          <Field
            label="Email"
            value={meQ.data?.email ?? ""}
            onChange={() => undefined}
            readOnly
            inverted
          />
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            onClick={() => updateProfileMutation.mutate()}
            disabled={updateProfileMutation.isPending}
            className="bg-white text-[var(--color-ink-950)] hover:bg-white/90"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-ink-400)]">Alarm</p>
        <h2 className="mt-2 text-[24px] font-semibold text-[var(--color-ink-900)]">
          Device alarm settings
        </h2>
        <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
          After 9 PM, alarms play at 50% of the selected volume.
        </p>

        {!hasLinkedDevice ? (
          <div className="mt-5 rounded-2xl border border-[var(--color-ink-100)] bg-[var(--color-cream-50)] p-4 text-[14px] text-[var(--color-ink-600)]">
            No device linked.
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between">
          <label className="text-[14px] font-medium text-[var(--color-ink-900)]">Alarm volume</label>
          <span className="text-[13px] font-semibold text-[var(--color-sanctuary-700)]">
            {alarmForm.alarmVolumePercent}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={alarmForm.alarmVolumePercent}
          onChange={(event) =>
            setAlarmForm((current) => ({
              ...current,
              alarmVolumePercent: Number(event.target.value),
            }))
          }
          disabled={!hasLinkedDevice}
          className="mt-3 w-full accent-[var(--color-sanctuary-600)]"
        />

        <label className="mt-5 flex items-start gap-3 rounded-2xl border border-[var(--color-ink-100)] bg-[var(--color-cream-50)] p-4">
          <input
            type="checkbox"
            checked={alarmForm.quietHoursEnabled}
            onChange={(event) =>
              setAlarmForm((current) => ({
                ...current,
                quietHoursEnabled: event.target.checked,
              }))
            }
            disabled={!hasLinkedDevice}
            className="mt-1 h-4 w-4 accent-[var(--color-sanctuary-600)]"
          />
          <div>
            <p className="text-[14px] font-semibold text-[var(--color-ink-900)]">
              Reduce volume after 9 PM
            </p>
            <p className="mt-1 text-[12px] text-[var(--color-ink-500)]">
              After 9 PM, alarms play at 50% of the selected volume.
            </p>
          </div>
        </label>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <AlarmSummary
            label="Quiet hours"
            value={`${alarmForm.quietHoursStart} - ${alarmForm.quietHoursEnd}`}
          />
          <AlarmSummary
            label="Quiet volume"
            value={`${alarmForm.quietHoursVolumePercent}%`}
          />
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            onClick={() => saveAlarmMutation.mutate()}
            disabled={!hasLinkedDevice || saveAlarmMutation.isPending}
          >
            <Volume2 className="h-4 w-4" />
            {saveAlarmMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--color-danger-100)] bg-[var(--color-danger-50)] p-6 shadow-[var(--shadow-card)]">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-danger-600)]">
          Advanced
        </p>
        <h2 className="mt-2 flex items-center gap-2 text-[24px] font-semibold text-[var(--color-ink-900)]">
          <UserRound className="h-5 w-5 text-[var(--color-danger-600)]" />
          Unlink device
        </h2>
        <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
          Unlinking stops device sync without deleting medication history.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              if (
                window.confirm(
                  "This will unlink your device from your profile. Medication history will remain, but the device will stop syncing. Continue?"
                )
              ) {
                unlinkMutation.mutate();
              }
            }}
            disabled={!hasLinkedDevice || unlinkMutation.isPending}
          >
            <Unlink2 className="h-4 w-4" />
            {unlinkMutation.isPending ? "Unlinking..." : "Unlink device"}
          </Button>
        </div>

        {!hasLinkedDevice ? (
          <div className="mt-5 rounded-2xl border border-[var(--color-ink-100)] bg-[var(--color-cream-50)] p-4 text-[14px] text-[var(--color-ink-600)]">
            No device linked.
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly = false,
  inverted = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  inverted?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span
        className={
          inverted
            ? "text-[12px] font-medium text-white/70"
            : "text-[13px] font-medium text-[var(--color-ink-700)]"
        }
      >
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        className={
          inverted
            ? "rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-[14px] text-white outline-none transition-colors placeholder:text-white/35 focus:border-white/25"
            : "rounded-2xl border border-[var(--color-ink-100)] bg-white px-4 py-3 text-[14px] outline-none transition-colors focus:border-[var(--color-sanctuary-400)]"
        }
      />
    </label>
  );
}

function AlarmSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-ink-50)] bg-[var(--color-cream-50)] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-400)]">{label}</p>
      <p className="mt-2 text-[15px] font-semibold text-[var(--color-ink-900)]">{value}</p>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const apiError = error as Partial<ApiError>;
    if (typeof apiError.message === "string" && apiError.message.trim()) {
      return apiError.message;
    }
  }
  return "Request failed.";
}

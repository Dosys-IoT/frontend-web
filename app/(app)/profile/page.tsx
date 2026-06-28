"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Shield, Volume2, RefreshCw, Unlink2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { accessApi, devicesApi, edgeApi } from "@/lib/api/endpoints";
import type { AlarmSettingsRequest, ApiError, UpdateProfileRequest } from "@/lib/api/types";
import { formatLimaDateTime } from "@/lib/utils/date-time";

export default function ProfilePage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<"sync" | "status" | null>(null);

  const meQ = useQuery({ queryKey: ["me"], queryFn: accessApi.me });
  const devicesQ = useQuery({ queryKey: ["devices"], queryFn: devicesApi.list });

  const linkedDevice = (devicesQ.data ?? []).find((device) => device.hardwareDeviceId != null) ?? null;
  const linkedDeviceId = linkedDevice?.hardwareDeviceId ?? null;
  const hasLinkedDevice = linkedDeviceId != null;

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

  const updateProfileMutation = useMutation({
    mutationFn: () => accessApi.updateMe(profileForm),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile saved.");
      setProfileForm({
        firstName: updated.firstName,
        lastName: updated.lastName,
      });
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
        await edgeApi.configSync(String(linkedDeviceId));
        return true;
      } catch (error) {
        void error;
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

  const syncDisabled = !hasLinkedDevice || unlinkMutation.isPending;

  const runEdgeCommand = async (kind: "sync" | "status") => {
    if (!linkedDeviceId) return;
    setPendingAction(kind);
    try {
      if (kind === "sync") {
        await edgeApi.configSync(String(linkedDeviceId));
        toast.success("Config sync sent");
      } else {
        await edgeApi.statusRequest(String(linkedDeviceId));
        toast.success("Status request sent");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <header className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-[40px] leading-none text-[var(--color-ink-900)]">
              Profile
            </h1>
            <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
              Manage your personal information, alarm volume, and device sync actions.
            </p>
          </div>
          <Button variant="secondary" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="h-4 w-4" />
            Refresh profile
          </Button>
        </div>
      </header>

      <section className="rounded-3xl border border-[var(--color-ink-50)]/60 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-ink-400)]">
              Personal information
            </p>
            <h2 className="mt-2 text-[24px] font-semibold text-[var(--color-ink-900)]">
              Edit profile details
            </h2>
          </div>
          <div className="text-right text-[12px] text-[var(--color-ink-500)]">
            <div>{meQ.data?.role ?? "USER"}</div>
            <div>{formatLimaDateTime(meQ.data?.updatedAt) || "Unavailable"}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field
            label="First name"
            value={profileForm.firstName}
            onChange={(value) => setProfileForm((current) => ({ ...current, firstName: value }))}
          />
          <Field
            label="Last name"
            value={profileForm.lastName}
            onChange={(value) => setProfileForm((current) => ({ ...current, lastName: value }))}
          />
          <Field
            label="Email"
            value={meQ.data?.email ?? ""}
            onChange={() => undefined}
            readOnly
          />
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            onClick={() => updateProfileMutation.mutate()}
            disabled={updateProfileMutation.isPending}
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
          <AlarmSummary label="Quiet hours" value={`${alarmForm.quietHoursStart} - ${alarmForm.quietHoursEnd}`} />
          <AlarmSummary label="Quiet volume" value={`${alarmForm.quietHoursVolumePercent}%`} />
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
        <h2 className="mt-2 text-[24px] font-semibold text-[var(--color-ink-900)]">
          Device sync actions
        </h2>
        <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
          Unlinking stops device sync without deleting medication history.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => runEdgeCommand("status")}
              disabled={syncDisabled || pendingAction !== null}
            >
              <Activity className={`h-4 w-4 ${pendingAction === "status" ? "animate-pulse" : ""}`} />
              Request device status
            </Button>
            <Button
              onClick={() => runEdgeCommand("sync")}
              disabled={syncDisabled || pendingAction !== null}
            >
              <Shield className={`h-4 w-4 ${pendingAction === "sync" ? "animate-spin" : ""}`} />
              Sync device config
            </Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (
                window.confirm(
                  "This will unlink your device from your profile. Medication data will remain in your account, but the device will stop syncing. Continue?"
                )
              ) {
                unlinkMutation.mutate();
              }
            }}
            disabled={!hasLinkedDevice || unlinkMutation.isPending}
          >
            <Unlink2 className="h-4 w-4" />
            Unlink device
          </Button>
        </div>

        {hasLinkedDevice ? null : (
          <div className="mt-5 rounded-2xl border border-[var(--color-ink-100)] bg-[var(--color-cream-50)] p-4 text-[14px] text-[var(--color-ink-600)]">
            No device linked.
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-[var(--color-ink-700)]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        className="rounded-2xl border border-[var(--color-ink-100)] bg-white px-4 py-3 text-[14px] outline-none transition-colors focus:border-[var(--color-sanctuary-400)]"
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HardDrive, Link2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { devicesApi } from "@/lib/api/endpoints";
import type { ApiError } from "@/lib/api/types";

/**
 * Entry point when the signed-in user has no device yet.
 * Offers both creation and physical-device linking so the app can move
 * straight into the real ESP32 flow.
 */
export function CreateDeviceCard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [newDeviceName, setNewDeviceName] = useState("");
  const [linkedDeviceId, setLinkedDeviceId] = useState("1");
  const [linkedDeviceName, setLinkedDeviceName] = useState("device1");
  const [linkedDeviceKey, setLinkedDeviceKey] = useState("");

  const createMutation = useMutation({
    mutationFn: () => devicesApi.create(newDeviceName.trim()),
    onSuccess: (device) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast.success(`Device "${device.name}" created.`);
      router.push("/device");
    },
    onError: (err) => {
      toast.error(err.message || "Could not create the device.");
    },
  });

  const linkMutation = useMutation({
    mutationFn: () =>
      devicesApi.linkPhysicalDevice({
        deviceId: linkedDeviceId.trim(),
        deviceName: linkedDeviceName.trim(),
        deviceKey: linkedDeviceKey.trim(),
      }),
    onSuccess: (device) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast.success(`Physical device ${device.deviceId} linked.`);
      router.push("/device");
    },
    onError: (err) => {
      toast.error(err.message || "Could not link the physical device.");
    },
  });

  const canCreate = newDeviceName.trim().length > 1 && !createMutation.isPending;
  const canLink = linkedDeviceId.trim().length > 0 && linkedDeviceName.trim().length > 0 && !linkMutation.isPending;
  const createError = createMutation.error as ApiError | null;
  const linkError = linkMutation.error as ApiError | null;

  return (
    <div className="rounded-3xl border border-dashed border-[var(--color-ink-100)] bg-white/50 p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className="mx-auto inline-grid h-12 w-12 place-items-center rounded-full bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]">
            <HardDrive className="h-5 w-5" />
          </span>
          <p className="mt-4 font-display text-2xl text-[var(--color-ink-900)]">
            No device linked yet.
          </p>
          <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
            Create a virtual device or link the real ESP32 hardware used by the Edge.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canCreate) createMutation.mutate();
            }}
            className="rounded-3xl border border-[var(--color-ink-100)] bg-[var(--color-cream-50)]/60 p-5"
          >
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-400)]">
              <Plus className="h-4 w-4" />
              Create new device
            </div>
            <p className="mt-3 text-[14px] text-[var(--color-ink-500)]">
              Use this when you want to start with a fresh Dosys device.
            </p>
            <Input
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              placeholder="Device name, e.g. Bedroom Dispenser"
              aria-label="Device name"
              className="mt-4"
              autoFocus
            />
            <Button type="submit" disabled={!canCreate} className="mt-4 w-full">
              <Plus className="h-4 w-4" />
              {createMutation.isPending ? "Creating..." : "Create device"}
            </Button>
            {createError && (
              <p className="mt-4 rounded-xl border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] px-4 py-3 text-[13px] text-[var(--color-danger-600)]">
                {createError.message || "Could not create the device. Please try again."}
              </p>
            )}
          </form>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canLink) linkMutation.mutate();
            }}
            className="rounded-3xl border border-[var(--color-sanctuary-200)] bg-[var(--color-sanctuary-50)]/60 p-5"
          >
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-sanctuary-700)]">
              <Link2 className="h-4 w-4" />
              Link physical device
            </div>
            <p className="mt-3 text-[14px] text-[var(--color-ink-500)]">
              Connect the ESP32 already running on the Edge using the physical device ID.
            </p>
            <div className="mt-4 grid gap-3">
              <Input
                value={linkedDeviceId}
                onChange={(e) => setLinkedDeviceId(e.target.value)}
                placeholder="Device ID"
                aria-label="Physical device ID"
              />
              <Input
                value={linkedDeviceName}
                onChange={(e) => setLinkedDeviceName(e.target.value)}
                placeholder="Device name"
                aria-label="Physical device name"
              />
              <Input
                value={linkedDeviceKey}
                onChange={(e) => setLinkedDeviceKey(e.target.value)}
                placeholder="Device key (optional)"
                aria-label="Physical device key"
              />
            </div>
            <Button type="submit" disabled={!canLink} className="mt-4 w-full">
              <Link2 className="h-4 w-4" />
              {linkMutation.isPending ? "Linking..." : "Link physical device"}
            </Button>
            {linkError && (
              <p className="mt-4 rounded-xl border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] px-4 py-3 text-[13px] text-[var(--color-danger-600)]">
                {linkError.message || "Could not link the physical device. Please try again."}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

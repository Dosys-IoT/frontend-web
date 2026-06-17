"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HardDrive, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { devicesApi } from "@/lib/api/endpoints";
import type { ApiError } from "@/lib/api/types";

/**
 * Shown when the signed-in user has no device yet. Creating a device is the
 * root of the whole app: containers and schedules all hang off a deviceId, so
 * until one exists there is nothing to display anywhere else.
 */
export function CreateDeviceCard() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState("");

  const mutation = useMutation({
    mutationFn: () => devicesApi.create(name.trim()),
    onSuccess: (device) => {
      // Refetch the devices list so the page swaps this card for real content.
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast.success(`Device “${device.name}” created.`);
    },
    onError: (err) => {
      toast.error(err.message || "Could not create the device.");
    },
  });

  const canSubmit = name.trim().length > 1 && !mutation.isPending;
  const error = mutation.error as ApiError | null;

  return (
    <div className="rounded-3xl border border-dashed border-[var(--color-ink-100)] bg-white/50 p-10 text-center">
      <span className="mx-auto inline-grid h-12 w-12 place-items-center rounded-full bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]">
        <HardDrive className="h-5 w-5" />
      </span>
      <p className="mt-4 font-display text-2xl text-[var(--color-ink-900)]">
        No device linked yet.
      </p>
      <p className="mt-2 text-[14px] text-[var(--color-ink-500)]">
        Create your Dosys device to start adding medications and schedules.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) mutation.mutate();
        }}
        className="mx-auto mt-6 flex max-w-[440px] flex-col gap-3 sm:flex-row"
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Device name, e.g. Bedroom Dispenser"
          aria-label="Device name"
          autoFocus
        />
        <Button type="submit" disabled={!canSubmit} className="shrink-0">
          <Plus className="h-4 w-4" />
          {mutation.isPending ? "Creating…" : "Create device"}
        </Button>
      </form>

      {error && (
        <p className="mx-auto mt-4 max-w-[440px] rounded-xl border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] px-4 py-3 text-[13px] text-[var(--color-danger-600)]">
          {error.message || "Could not create the device. Please try again."}
        </p>
      )}
    </div>
  );
}

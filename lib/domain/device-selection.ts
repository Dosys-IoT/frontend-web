import type { DeviceResponse } from "@/lib/api/types";

export interface SelectedDevice {
  device: DeviceResponse | null;
  apiDeviceId: number | null;
  displayDeviceId: string | null;
  hardwareDeviceId: number | null;
}

export function selectPrimaryDevice(devices: DeviceResponse[] | undefined | null): SelectedDevice {
  const device = devices?.find((item) => item.hardwareDeviceId != null) ?? devices?.[0] ?? null;
  const apiDeviceId = device ? device.hardwareDeviceId ?? device.id : null;
  return {
    device,
    apiDeviceId,
    displayDeviceId: apiDeviceId != null ? String(apiDeviceId) : null,
    hardwareDeviceId: device?.hardwareDeviceId ?? null,
  };
}

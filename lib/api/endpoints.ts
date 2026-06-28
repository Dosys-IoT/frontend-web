import { apiFetch, EDGE_API_BASE_URL } from "./client";
import type {
  AdherenceCalendarResponse,
  ContainerResponse,
  DeviceHardwareStatusResponse,
  DeviceResponse,
  EnvironmentReadingResponse,
  EdgeCachedConfigResponse,
  EdgeCommandResponse,
  EdgeHealthResponse,
  EdgeMqttStatusResponse,
  EdgeRecentEventResponse,
  EdgeRecentEventsResponse,
  LinkPhysicalDeviceRequest,
  LinkPhysicalDeviceResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ScheduleResponse,
  UpsertContainerRequest,
  UpsertScheduleRequest,
  UserResponse,
} from "./types";

function isApiErrorLike(error: unknown): error is { status?: number } {
  return typeof error === "object" && error !== null && "status" in error;
}

function isMissingDataError(error: unknown): boolean {
  return isApiErrorLike(error) && (error.status === 404 || error.status === 204);
}

export const accessApi = {
  login: (body: LoginRequest) =>
    apiFetch<LoginResponse>("/api/v1/access/login", { method: "POST", body, auth: false }),
  register: (body: RegisterRequest) =>
    apiFetch<UserResponse>("/api/v1/access/register", { method: "POST", body, auth: false }),
  me: () => apiFetch<UserResponse>("/api/v1/access/me"),
};

export const devicesApi = {
  list: () => apiFetch<DeviceResponse[]>("/api/v1/medication/devices"),
  create: (name: string) =>
    apiFetch<DeviceResponse>("/api/v1/medication/devices", { method: "POST", body: { name } }),
  linkPhysicalDevice: (body: LinkPhysicalDeviceRequest) =>
    apiFetch<LinkPhysicalDeviceResponse>("/api/v1/medication/devices/link", {
      method: "POST",
      body,
    }),
  status: (deviceId: number) =>
    apiFetch<DeviceHardwareStatusResponse>(`/api/v1/medication/devices/${deviceId}/status`),
  containers: (deviceId: number) =>
    apiFetch<ContainerResponse[]>(`/api/v1/medication/devices/${deviceId}/containers`),
  schedules: (deviceId: number) =>
    apiFetch<ScheduleResponse[]>(`/api/v1/medication/devices/${deviceId}/schedules`),
  latestEnvironment: async (deviceId: number): Promise<EnvironmentReadingResponse | null> => {
    try {
      return await apiFetch<EnvironmentReadingResponse>(
        `/api/v1/medication/devices/${deviceId}/environment/latest`
      );
    } catch (error) {
      if (isMissingDataError(error)) {
        return null;
      }
      throw error;
    }
  },
  environmentHistory: async (deviceId: number, from: string, to: string) => {
    try {
      return await apiFetch<EnvironmentReadingResponse[]>(
        `/api/v1/medication/devices/${deviceId}/environment/history?from=${encodeURIComponent(
          from
        )}&to=${encodeURIComponent(to)}`
      );
    } catch (error) {
      if (isMissingDataError(error)) {
        return [];
      }
      throw error;
    }
  },
  adherenceCalendar: (deviceId: number, month: string) =>
    apiFetch<AdherenceCalendarResponse>(
      `/api/v1/medication/devices/${deviceId}/adherence/calendar?month=${encodeURIComponent(month)}`
    ),
  upsertContainer: (
    deviceId: number,
    containerNumber: number,
    body: UpsertContainerRequest
  ) =>
    apiFetch<ContainerResponse>(
      `/api/v1/medication/devices/${deviceId}/containers/${containerNumber}`,
      { method: "PUT", body }
    ),
  createSchedule: (deviceId: number, body: UpsertScheduleRequest) =>
    apiFetch<ScheduleResponse>(
      `/api/v1/medication/devices/${deviceId}/schedules`,
      { method: "POST", body: normalizeScheduleRequest(body) }
    ),
  updateSchedule: (
    deviceId: number,
    scheduleId: number,
    body: UpsertScheduleRequest
  ) =>
    apiFetch<ScheduleResponse>(
      `/api/v1/medication/devices/${deviceId}/schedules/${scheduleId}`,
      { method: "PUT", body: normalizeScheduleRequest(body) }
    ),
  deleteSchedule: (deviceId: number, scheduleId: number) =>
    apiFetch<void>(
      `/api/v1/medication/devices/${deviceId}/schedules/${scheduleId}`,
      { method: "DELETE" }
    ),
};

function normalizeScheduleRequest(body: UpsertScheduleRequest) {
  return {
    ...body,
    time: typeof body.time === "string" ? body.time : formatScheduleTime(body.time),
  };
}

function formatScheduleTime(time: { hour: number; minute: number; second?: number | null }) {
  const hour = String(time.hour).padStart(2, "0");
  const minute = String(time.minute).padStart(2, "0");
  const second = String(time.second ?? 0).padStart(2, "0");
  return `${hour}:${minute}:${second}`;
}

export const edgeApi = {
  health: () =>
    apiFetch<EdgeHealthResponse>("/edge/v1/health", { auth: false, baseUrl: EDGE_API_BASE_URL }),
  mqttStatus: () =>
    apiFetch<EdgeMqttStatusResponse>("/edge/v1/mqtt/status", {
      auth: false,
      baseUrl: EDGE_API_BASE_URL,
    }),
  cachedConfig: async (deviceId: string): Promise<EdgeCachedConfigResponse> => {
    try {
      const response = await apiFetch<EdgeCachedConfigResponse>(
        `/edge/v1/devices/${deviceId}/cached-config`,
        {
          auth: false,
          baseUrl: EDGE_API_BASE_URL,
        }
      );
      if (response && typeof response === "object" && "available" in response) {
        return response;
      }
      return { deviceId, available: true, config: response as EdgeCachedConfigResponse["config"] };
    } catch (error) {
      if (isMissingDataError(error)) {
        return { deviceId, available: false, config: null };
      }
      throw error;
    }
  },
  recentEvents: async (): Promise<EdgeRecentEventResponse[] | EdgeRecentEventsResponse> => {
    try {
      const response = await apiFetch<EdgeRecentEventResponse[] | EdgeRecentEventsResponse>(
        "/edge/v1/diagnostics/events/recent",
        {
          auth: false,
          baseUrl: EDGE_API_BASE_URL,
        }
      );
      return response ?? [];
    } catch (error) {
      if (isMissingDataError(error)) {
        return [];
      }
      throw error;
    }
  },
  audioTest: (deviceId: string) =>
    apiFetch<EdgeCommandResponse>(`/edge/v1/devices/${deviceId}/commands/audio-test`, {
      method: "POST",
      auth: false,
      baseUrl: EDGE_API_BASE_URL,
    }),
  ledTest: (deviceId: string) =>
    apiFetch<EdgeCommandResponse>(`/edge/v1/devices/${deviceId}/commands/led-test`, {
      method: "POST",
      auth: false,
      baseUrl: EDGE_API_BASE_URL,
    }),
  statusRequest: (deviceId: string) =>
    apiFetch<EdgeCommandResponse>(`/edge/v1/devices/${deviceId}/commands/status-request`, {
      method: "POST",
      auth: false,
      baseUrl: EDGE_API_BASE_URL,
    }),
  configSync: (deviceId: string) =>
    apiFetch<EdgeCommandResponse>(`/edge/v1/devices/${deviceId}/commands/config-sync`, {
      method: "POST",
      auth: false,
      baseUrl: EDGE_API_BASE_URL,
    }),
};

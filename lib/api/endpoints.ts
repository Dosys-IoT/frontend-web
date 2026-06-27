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
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ScheduleResponse,
  UpsertContainerRequest,
  UpsertScheduleRequest,
  UserResponse,
} from "./types";

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
  status: (deviceId: number) =>
    apiFetch<DeviceHardwareStatusResponse>(`/api/v1/medication/devices/${deviceId}/status`),
  containers: (deviceId: number) =>
    apiFetch<ContainerResponse[]>(`/api/v1/medication/devices/${deviceId}/containers`),
  schedules: (deviceId: number) =>
    apiFetch<ScheduleResponse[]>(`/api/v1/medication/devices/${deviceId}/schedules`),
  latestEnvironment: (deviceId: number) =>
    apiFetch<EnvironmentReadingResponse>(
      `/api/v1/medication/devices/${deviceId}/environment/latest`
    ),
  environmentHistory: (deviceId: number, from: string, to: string) =>
    apiFetch<EnvironmentReadingResponse[]>(
      `/api/v1/medication/devices/${deviceId}/environment/history?from=${encodeURIComponent(
        from
      )}&to=${encodeURIComponent(to)}`
    ),
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
      { method: "POST", body }
    ),
  updateSchedule: (
    deviceId: number,
    scheduleId: number,
    body: UpsertScheduleRequest
  ) =>
    apiFetch<ScheduleResponse>(
      `/api/v1/medication/devices/${deviceId}/schedules/${scheduleId}`,
      { method: "PUT", body }
    ),
  deleteSchedule: (deviceId: number, scheduleId: number) =>
    apiFetch<void>(
      `/api/v1/medication/devices/${deviceId}/schedules/${scheduleId}`,
      { method: "DELETE" }
    ),
};

export const edgeApi = {
  health: () =>
    apiFetch<EdgeHealthResponse>("/edge/v1/health", { auth: false, baseUrl: EDGE_API_BASE_URL }),
  mqttStatus: () =>
    apiFetch<EdgeMqttStatusResponse>("/edge/v1/mqtt/status", {
      auth: false,
      baseUrl: EDGE_API_BASE_URL,
    }),
  cachedConfig: (deviceId: string) =>
    apiFetch<EdgeCachedConfigResponse>(`/edge/v1/devices/${deviceId}/cached-config`, {
      auth: false,
      baseUrl: EDGE_API_BASE_URL,
    }),
  recentEvents: () =>
    apiFetch<EdgeRecentEventResponse[] | EdgeRecentEventsResponse>(
      "/edge/v1/diagnostics/events/recent",
      {
      auth: false,
      baseUrl: EDGE_API_BASE_URL,
      }
    ),
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

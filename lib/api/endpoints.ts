import { apiFetch } from "./client";
import type {
  AdherenceCalendarResponse,
  ContainerResponse,
  DeviceResponse,
  EnvironmentReadingResponse,
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
  containers: (deviceId: number) =>
    apiFetch<ContainerResponse[]>(`/api/v1/medication/devices/${deviceId}/containers`),
  schedules: (deviceId: number) =>
    apiFetch<ScheduleResponse[]>(`/api/v1/medication/devices/${deviceId}/schedules`),
  latestEnvironment: (deviceId: number) =>
    apiFetch<EnvironmentReadingResponse>(
      `/api/v1/medication/devices/${deviceId}/environment/latest`
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

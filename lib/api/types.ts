export type Role = "USER" | "ADMIN";

export type DayOfWeek =
  | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY"
  | "FRIDAY" | "SATURDAY" | "SUNDAY";

export type RiskStatus = "NORMAL" | "RISK" | "WARNING" | "CRITICAL";
export type IntakeStatus = "TAKEN" | "MISSED";

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  user: UserResponse;
}

export interface DeviceResponse {
  id: number;
  hardwareDeviceId: number | null;
  deviceKey: string;
  name: string;
  configVersion: number;
  humidityThreshold: number;
  temperatureThreshold: number;
  alarmVolumePercent: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  quietHoursVolumePercent: number;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlarmSettingsRequest {
  alarmVolumePercent: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  quietHoursVolumePercent: number;
}

export interface AlarmSettingsResponse extends AlarmSettingsRequest {
  deviceId: string;
}

export interface ProfileResponse extends UserResponse {}

export interface LinkPhysicalDeviceRequest {
  deviceId: string;
  deviceName?: string;
  deviceKey?: string;
}

export interface LinkPhysicalDeviceResponse {
  deviceId: string;
  name: string;
  linked: boolean;
  status: string;
  hardwareDeviceId?: number | null;
}

export interface UnlinkDeviceResponse {
  deviceId: string;
  name: string;
  linked: boolean;
  status: string;
  hardwareDeviceId?: number | null;
}

export interface LocalTimeDTO {
  hour: number;
  minute: number;
  second?: number;
  nano?: number;
}

export interface ScheduleResponse {
  id: number;
  containerNumber: number;
  time: LocalTimeDTO;
  daysOfWeek: DayOfWeek[];
  isActive: boolean;
}

export interface UpsertScheduleRequest {
  containerNumber: number;
  time: LocalTimeDTO | string;
  daysOfWeek: DayOfWeek[];
  isActive: boolean;
}

export interface ContainerResponse {
  id: number;
  containerNumber: number;
  medicationName: string | null;
  dosageLabel: string | null;
  remainingPills: number;
  isEnabled: boolean;
}

export interface UpsertContainerRequest {
  medicationName?: string;
  dosageLabel?: string;
  remainingPills: number;
  isEnabled: boolean;
}

export interface EnvironmentReadingResponse {
  id: number;
  temperature: number;
  humidity: number;
  recordedAt: string;
  riskStatus: RiskStatus;
  deviceId?: number | string;
  firmwareVersion?: string;
}

export interface DeviceHardwareStatusResponse {
  deviceId: string | number;
  status: string;
  lastSeenAt?: string | null;
  rtcOk?: boolean | null;
  sht3xOk?: boolean | null;
  dfPlayerOk?: boolean | null;
  sdCardOk?: boolean | null;
  switchOk?: boolean | null;
  buttonPin?: number | null;
  rssi?: number | null;
  firmwareVersion?: string | null;
  hardwareVersion?: string | null;
  wifiConnected?: boolean | null;
  mqttConnected?: boolean | null;
}

export interface EdgeHealthResponse {
  status?: string;
  message?: string;
  timestamp?: string;
  uptimeSeconds?: number;
}

export interface EdgeMqttStatusResponse {
  connected?: boolean;
  status?: string;
  message?: string;
  broker?: string;
  lastError?: string | null;
  lastConnectedAt?: string | null;
}

export interface EdgeThresholds {
  temperatureWarning?: number;
  temperatureCritical?: number;
  humidityWarning?: number;
  humidityCritical?: number;
}

export interface EdgeRuntimeContainer {
  containerNumber?: number;
  medicationName?: string | null;
  dosageLabel?: string | null;
  remainingPills?: number;
  enabled?: boolean;
}

export interface EdgeRuntimeSchedule {
  scheduleId?: string;
  containerNumber?: number;
  time?: string;
  daysOfWeek?: string[];
  audioTrack?: number;
  confirmationWindowSeconds?: number;
}

export interface EdgeCachedConfigPayload {
  requestId?: string;
  deviceId?: string | number;
  configVersion?: number;
  serverTime?: string;
  timezone?: string;
  containers?: EdgeRuntimeContainer[];
  schedules?: EdgeRuntimeSchedule[];
  environmentThresholds?: EdgeThresholds;
}

export interface EdgeCachedConfigResponse {
  deviceId: string | number;
  available: boolean;
  config: EdgeCachedConfigPayload | null;
  cachedAt?: string;
}

export interface EdgeRecentEventResponse {
  id?: string | number;
  deviceId?: string | number;
  eventType?: string;
  topic?: string;
  summary?: string;
  status?: string;
  createdAt?: string;
  payload?: unknown;
}

export interface EdgeRecentEventsResponse {
  items?: EdgeRecentEventResponse[];
  events?: EdgeRecentEventResponse[];
  data?: EdgeRecentEventResponse[];
}

export interface EdgeCommandResponse {
  commandId?: string;
  accepted?: boolean;
  queued?: boolean;
  message?: string;
}

export interface AdherenceItem {
  scheduleId: number;
  containerNumber: number;
  scheduledAt: string;
  confirmedAt: string | null;
  status: IntakeStatus;
}

export interface DayAdherence {
  date: string;
  items: AdherenceItem[];
}

export interface AdherenceCalendarResponse {
  month: string;
  days: DayAdherence[];
}

export interface ApiError {
  status: number;
  message: string;
  body?: unknown;
}

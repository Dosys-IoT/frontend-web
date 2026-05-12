export type Role = "USER" | "ADMIN";

export type DayOfWeek =
  | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY"
  | "FRIDAY" | "SATURDAY" | "SUNDAY";

export type RiskStatus = "NORMAL" | "RISK";
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
  deviceKey: string;
  name: string;
  configVersion: number;
  humidityThreshold: number;
  temperatureThreshold: number;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
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
  time: LocalTimeDTO;
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

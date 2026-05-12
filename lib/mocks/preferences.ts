// TODO(backend): GET/PUT /api/v1/access/me/preferences.

export interface UserPreferences {
  voiceAssist: boolean;
  reminderVolume: number; // 0–100
  frequencyCalibration: boolean;
  highContrast: boolean;
  screenReader: boolean;
  notifications: {
    emailUpdates: boolean;
    smsAlerts: boolean;
    pushNotifications: boolean;
  };
  membershipTier: "Free" | "Pro Member";
  verifiedHealthData: boolean;
  patientId: string;
  connectedDeviceName: string;
  connectedDeviceFirmware: string;
}

export const MOCK_PREFERENCES: UserPreferences = {
  voiceAssist: true,
  reminderVolume: 85,
  frequencyCalibration: false,
  highContrast: false,
  screenReader: true,
  notifications: {
    emailUpdates: true,
    smsAlerts: true,
    pushNotifications: false,
  },
  membershipTier: "Pro Member",
  verifiedHealthData: true,
  patientId: "DS-8829",
  connectedDeviceName: "Dosys Hub v2",
  connectedDeviceFirmware: "4.8.2 (Stable)",
};

// TODO(backend): adherence aggregates, refill forecast, env trend chart.

export interface InsightsSummary {
  adherenceRatePct: number;
  adherenceTrendPct: number; // delta vs previous window
  activePrescriptions: number;
  pendingRefills: number;
  deviceHealth: "Optimal" | "Attention" | "Critical";
  todayAdherencePct: number;
  morningRoutinePct: number;
  eveningRoutinePct: number;
}

export const MOCK_INSIGHTS_SUMMARY: InsightsSummary = {
  adherenceRatePct: 94.8,
  adherenceTrendPct: 4.2,
  activePrescriptions: 12,
  pendingRefills: 2,
  deviceHealth: "Optimal",
  todayAdherencePct: 92,
  morningRoutinePct: 100,
  eveningRoutinePct: 84,
};

// Medication activity (10 deterministic days of taken/missed counts).
export const MOCK_MEDICATION_ACTIVITY = [
  { label: "Mon", taken: 6, missed: 1 },
  { label: "Tue", taken: 5, missed: 0 },
  { label: "Wed", taken: 7, missed: 0 },
  { label: "Thu", taken: 8, missed: 2 },
  { label: "Fri", taken: 6, missed: 1 },
  { label: "Sat", taken: 8, missed: 0 },
  { label: "Sun", taken: 7, missed: 0 },
  { label: "Mon", taken: 5, missed: 1 },
  { label: "Tue", taken: 6, missed: 0 },
  { label: "Wed", taken: 7, missed: 0 },
];

export interface RefillForecastEntry {
  medication: string;
  daysLeft: number;
  refillByISO: string;
}

export const MOCK_REFILL_FORECAST: RefillForecastEntry[] = [
  { medication: "Lisinopril", daysLeft: 12, refillByISO: "2026-05-23" },
  { medication: "Metformin",  daysLeft: 4,  refillByISO: "2026-05-15" },
  { medication: "Atorvastatin", daysLeft: 28, refillByISO: "2026-06-08" },
];

// Environment trend buckets (humidity %, 12 readings over 24h).
export const MOCK_ENV_TREND: { hour: string; humidity: number }[] = [
  { hour: "12 AM", humidity: 36 },
  { hour: "2 AM",  humidity: 38 },
  { hour: "4 AM",  humidity: 41 },
  { hour: "6 AM",  humidity: 45 },
  { hour: "8 AM",  humidity: 44 },
  { hour: "10 AM", humidity: 42 },
  { hour: "12 PM", humidity: 41 },
  { hour: "2 PM",  humidity: 40 },
  { hour: "4 PM",  humidity: 42 },
  { hour: "6 PM",  humidity: 44 },
  { hour: "8 PM",  humidity: 43 },
  { hour: "10 PM", humidity: 42 },
];

export const MOCK_AI_ADVICE = {
  headline: "Environmental factors are impacting your Lisinopril stability.",
  body: "We've noticed a 15% increase in humidity in your storage area. To maintain efficacy, we recommend moving your Dosys device to a cooler, dryer location away from the bathroom.",
};

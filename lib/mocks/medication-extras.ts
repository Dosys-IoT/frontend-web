// TODO(backend): replace with real fields on ContainerResponse + new endpoints.
// See lib/mocks/index.ts for the full gap list.

export type MedicationStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";
export type CompartmentState = "OK" | "LOW" | "STUCK" | "EMPTY";

export interface MedicationExtras {
  pillWeightMg: number;
  refillThreshold: number;
  status: MedicationStatus;
  compartmentState: CompartmentState;
  withMealContext?: string;
  clinicalNotes?: string;
  hypertensionControl?: boolean;
  prescriptionLabel?: string;
  doctorNote?: { author: string; body: string };
}

const DEFAULTS: MedicationExtras = {
  pillWeightMg: 250,
  refillThreshold: 10,
  status: "ACTIVE",
  compartmentState: "OK",
};

// Keyed by containerNumber (1–5). Mocks fall back to DEFAULTS for any slot
// not listed here.
const BY_SLOT: Record<number, Partial<MedicationExtras>> = {
  1: {
    pillWeightMg: 180,
    refillThreshold: 10,
    withMealContext: "With Breakfast",
    prescriptionLabel: "10mg Oral Tablet · Hypertension Control",
    doctorNote: {
      author: "Dr. Sarah Kensington",
      body: "Continue monitoring blood pressure daily at 09:00 AM. Avoid excessive sodium intake while on this dosage.",
    },
    clinicalNotes: "",
  },
  2: {
    pillWeightMg: 320,
    refillThreshold: 15,
    withMealContext: "Nightly routine",
    prescriptionLabel: "20mg Capsule · Lipid Management",
    clinicalNotes: "Pair with evening meal for optimal absorption.",
  },
  3: {
    pillWeightMg: 410,
    refillThreshold: 7,
    withMealContext: "With Lunch",
    prescriptionLabel: "500mg ER · Glycemic Control",
  },
  4: {
    pillWeightMg: 95,
    refillThreshold: 15,
    status: "PAUSED",
    withMealContext: "Consult physician",
    prescriptionLabel: "5mg Tablet · Calcium channel blocker",
  },
  5: {
    pillWeightMg: 50,
    refillThreshold: 5,
    withMealContext: "On empty stomach",
    prescriptionLabel: "50mcg · Thyroid hormone replacement",
  },
};

export function getMedicationExtras(containerNumber: number): MedicationExtras {
  return { ...DEFAULTS, ...(BY_SLOT[containerNumber] ?? {}) };
}

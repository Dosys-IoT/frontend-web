"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Headset, RotateCcw, FlaskConical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_CALIBRATION } from "@/lib/mocks";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    n: 1,
    title: "Clear the Platform",
    body: "Ensure the dosing scale is completely free of any objects or medication containers before starting the Tare process.",
  },
  {
    n: 2,
    title: "Zero the Sensor (Tare)",
    body: "Press the Tare button. Wait for the reading to stabilize at exactly 0.00mg. Minimize environmental noise.",
  },
  {
    n: 3,
    title: "Apply Reference Weight",
    body: "Place the certified 500mg calibration sample in the center of the platform. Avoid vibrations during this step.",
  },
  {
    n: 4,
    title: "Confirm and Save",
    body: "Once the live reading matches the reference, save the calibration to the internal device memory.",
  },
];

export default function CalibrationPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [reading, setReading] = useState(MOCK_CALIBRATION.currentMg);

  // TODO(backend): replace with SSE/poll stream from
  // GET /api/v1/medication/devices/{id}/calibrate/measurement.
  useEffect(() => {
    const id = setInterval(() => {
      setReading(MOCK_CALIBRATION.currentMg + (Math.random() - 0.5) * 0.6);
    }, 700);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-7">
      <header>
        <Link
          href="/device"
          className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Devices / Calibration
        </Link>
        <div className="mt-3 flex items-start justify-between">
          <h1 className="font-display text-[44px] leading-none text-[var(--color-ink-900)]">
            Weight Calibration
          </h1>
          <Badge tone="sanctuary" className="normal-case">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-sanctuary-500)]" />
            Device Connected
          </Badge>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
          <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">
            Calibration Procedure
          </h2>
          <ol className="mt-5 flex flex-col gap-4">
            {STEPS.map((s) => (
              <li
                key={s.n}
                onClick={() => setActiveStep(s.n)}
                className={cn(
                  "grid cursor-pointer grid-cols-[36px_1fr] gap-3 rounded-2xl p-3 transition-colors",
                  activeStep === s.n ? "bg-[var(--color-sanctuary-50)]" : "hover:bg-[var(--color-cream-50)]"
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full text-[12px] font-semibold",
                    activeStep === s.n
                      ? "bg-[var(--color-sanctuary-600)] text-white"
                      : activeStep > s.n
                        ? "bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]"
                        : "bg-[var(--color-ink-50)] text-[var(--color-ink-400)]"
                  )}
                >
                  {String(s.n).padStart(2, "0")}
                </span>
                <div>
                  <p
                    className={cn(
                      "text-[14px] font-semibold",
                      activeStep === s.n
                        ? "text-[var(--color-sanctuary-700)]"
                        : "text-[var(--color-ink-900)]"
                    )}
                  >
                    {s.title}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-ink-500)]">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col gap-5">
          <section className="rounded-3xl bg-white p-7 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
            <div className="flex items-start justify-between">
              <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-400)]">
                Current Measurement
              </p>
              <Badge tone="sanctuary" className="normal-case">
                Real-Time Data
              </Badge>
            </div>
            <p className="mt-4 font-display text-[72px] leading-none tracking-tight text-[var(--color-ink-900)]">
              {reading.toFixed(2)}
              <span className="ml-1 align-baseline text-[20px] font-sans text-[var(--color-ink-500)]">
                mg
              </span>
            </p>
            <div className="mt-5 rounded-full bg-[var(--color-cream-100)] p-1">
              <div className="flex h-7 items-center justify-between rounded-full bg-white px-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-3 w-1 rounded-full",
                        i < 13
                          ? "bg-[var(--color-sanctuary-500)]"
                          : "bg-[var(--color-ink-100)]"
                      )}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-medium text-[var(--color-ink-500)]">
                  Sensor Stability: {MOCK_CALIBRATION.stabilityPct}%
                </span>
              </div>
            </div>
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            <ActionCard
              icon={<RotateCcw className="h-4 w-4" />}
              title="Zero Platform"
              body="Resets the current measurement to 0.00mg. Use when the platform is empty."
              actionLabel="Tare Scale"
              tone="dark"
            />
            <ActionCard
              icon={<FlaskConical className="h-4 w-4" />}
              title="Sample Calibration"
              body="Standardizes sensor against a known 500mg reference weight."
              actionLabel="Start Calibration"
              tone="dark"
            />
          </div>

          <section className="grid gap-5 sm:grid-cols-[1fr_1.4fr]">
            <div className="rounded-3xl bg-[var(--color-sanctuary-700)] p-5 text-white">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
                <Headset className="h-5 w-5" />
              </span>
              <p className="mt-3 text-[13px] font-semibold">Technical Support</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/70">
                Having trouble with sensor drift? Our clinical team is available 24/7.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <Metric label="Last Calibrated" value="Oct 24, 2023" />
                <Metric
                  label="Drift Ratio"
                  value={`+${MOCK_CALIBRATION.driftPct.toFixed(2)}%`}
                  positive
                />
                <Metric label="Cert. Status" value={MOCK_CALIBRATION.certStatus} />
              </div>
              <button className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-sanctuary-700)] hover:underline">
                View Calibration Logs <span aria-hidden>›</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  body,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel: string;
  tone: "dark";
}) {
  return (
    <div className="flex flex-col rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] border border-[var(--color-ink-50)]/60">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]">
        {icon}
      </span>
      <p className="mt-3 text-[14px] font-semibold text-[var(--color-ink-900)]">
        {title}
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-ink-500)]">
        {body}
      </p>
      <Button variant="dark" size="sm" className="mt-4 self-start">
        {actionLabel}
      </Button>
    </div>
  );
}

function Metric({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-[var(--color-ink-400)]">{label}</p>
      <p
        className={`mt-0.5 text-[13px] font-semibold ${
          positive ? "text-[var(--color-sanctuary-700)]" : "text-[var(--color-ink-900)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

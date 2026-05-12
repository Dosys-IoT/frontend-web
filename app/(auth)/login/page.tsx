"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Cpu, KeyRound, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accessApi } from "@/lib/api/endpoints";
import { saveSession } from "@/lib/auth/session";
import type { ApiError } from "@/lib/api/types";
import { LoginHero } from "@/components/auth/login-hero";
import { DosysMark } from "@/components/brand/dosys-mark";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const mutation = useMutation({
    mutationFn: () => accessApi.login({ email, password }),
    onSuccess: (data) => {
      saveSession({
        token: data.accessToken,
        expiresAt: Date.now() + data.expiresIn * 1000,
        user: data.user,
      });
      router.replace("/dashboard");
    },
  });

  const error = mutation.error as ApiError | null;

  return (
    <section className="relative grid min-h-screen bg-white md:grid-cols-[1.15fr_1fr]">
      {/* Left: hero */}
      <LoginHero />

      {/* Right: form */}
      <div className="relative flex items-center justify-center px-6 py-12 sm:px-12 md:py-16 lg:px-20">
        <div className="w-full max-w-[440px]">
          <div className="md:hidden mb-8">
            <DosysMark tone="dark" />
          </div>

          <h1 className="font-display text-[44px] leading-[1.05] text-[var(--color-ink-900)]">
            Welcome back.
          </h1>
          <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-[var(--color-ink-500)]">
            Enter your details to access your sanctuary.
          </p>

          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Clinical ID or Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@sanctuary.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Secure Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex select-none items-center gap-2 text-[13px] text-[var(--color-ink-500)]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded-full border-[var(--color-ink-200)] accent-[var(--color-sanctuary-600)]"
                />
                Remember device
              </label>
              <Link
                href="#"
                className="text-[13px] font-semibold text-[var(--color-sanctuary-700)] hover:underline"
              >
                Forgot security key?
              </Link>
            </div>

            {error && (
              <p className="rounded-xl border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] px-4 py-3 text-[13px] text-[var(--color-danger-600)]">
                {error.status === 401
                  ? "Incorrect email or password."
                  : error.message || "Sign-in failed. Please try again."}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Signing in…" : "Sign In to Dashboard"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-400)]">
            <span className="h-px flex-1 bg-[var(--color-ink-100)]" />
            or
            <span className="h-px flex-1 bg-[var(--color-ink-100)]" />
          </div>

          <div className="space-y-3">
            <Button variant="secondary" size="lg" className="w-full">
              <UserRound className="h-4 w-4" />
              Continue as Caregiver
            </Button>
            <Button variant="secondary" size="lg" className="w-full">
              <Cpu className="h-4 w-4" />
              Manage my Device
            </Button>
          </div>

          <div className="mt-8 space-y-2 text-[13px] text-[var(--color-ink-500)]">
            <p>
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-[var(--color-sanctuary-700)] hover:underline"
              >
                Register Clinic
              </Link>
            </p>
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--color-ink-400)]">
              <Link href="#" className="hover:text-[var(--color-ink-700)]">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-[var(--color-ink-700)]">
                Security Protocol
              </Link>
              <Link href="#" className="hover:text-[var(--color-ink-700)]">
                Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

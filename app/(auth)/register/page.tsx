"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accessApi } from "@/lib/api/endpoints";
import { saveSession } from "@/lib/auth/session";
import type { ApiError } from "@/lib/api/types";
import { LoginHero } from "@/components/auth/login-hero";
import { DosysMark } from "@/components/brand/dosys-mark";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      await accessApi.register({ firstName, lastName, email, password });
      // Auto-login right after register so the new user lands authenticated.
      return accessApi.login({ email, password });
    },
    onSuccess: (data) => {
      saveSession({
        token: data.accessToken,
        expiresAt: Date.now() + data.expiresIn * 1000,
        user: data.user,
      });
      router.replace("/dashboard");
    },
  });

  const serverError = mutation.error as ApiError | null;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setClientError(null);
    if (password.length < 8) {
      setClientError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setClientError("Passwords do not match.");
      return;
    }
    if (!acceptedTerms) {
      setClientError("You must accept the clinical terms to continue.");
      return;
    }
    mutation.mutate();
  }

  return (
    <section className="relative grid min-h-screen bg-white md:grid-cols-[1.15fr_1fr]">
      <LoginHero />

      <div className="relative flex items-center justify-center px-6 py-12 sm:px-12 md:py-16 lg:px-20">
        <div className="w-full max-w-[440px]">
          <div className="md:hidden mb-8">
            <DosysMark tone="dark" />
          </div>

          <h1 className="font-display text-[44px] leading-[1.05] text-[var(--color-ink-900)]">
            Create your sanctuary.
          </h1>
          <p className="mt-3 max-w-[36ch] text-[15px] leading-relaxed text-[var(--color-ink-500)]">
            Set up your clinical account in seconds. We&apos;ll sign you in
            automatically.
          </p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  placeholder="Sarah"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  placeholder="Kensington"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Clinical Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@sanctuary.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Secure Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <label className="flex cursor-pointer select-none items-start gap-2 pt-1 text-[13px] leading-relaxed text-[var(--color-ink-500)]">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-full border-[var(--color-ink-200)] accent-[var(--color-sanctuary-600)]"
              />
              <span>
                I accept the{" "}
                <Link href="#" className="font-semibold text-[var(--color-sanctuary-700)] hover:underline">
                  clinical terms
                </Link>{" "}
                and{" "}
                <Link href="#" className="font-semibold text-[var(--color-sanctuary-700)] hover:underline">
                  privacy policy
                </Link>
                .
              </span>
            </label>

            {(clientError || serverError) && (
              <p className="rounded-xl border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] px-4 py-3 text-[13px] text-[var(--color-danger-600)]">
                {clientError ??
                  (serverError?.status === 409
                    ? "An account already exists with that email."
                    : serverError?.message ||
                      "Could not create the account. Please try again.")}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating account…" : "Create Account"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-8 text-[13px] text-[var(--color-ink-500)]">
            <p>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[var(--color-sanctuary-700)] hover:underline"
              >
                Sign in
              </Link>
            </p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--color-ink-400)]">
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

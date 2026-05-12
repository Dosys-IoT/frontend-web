"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { readSession } from "@/lib/auth/session";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!readSession()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-cream-100)]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-sanctuary-500)]/40" />
      </div>
    );
  }
  return <>{children}</>;
}

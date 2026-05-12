import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[var(--color-cream-100)] pt-2">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden px-6 pt-8 pb-10 md:px-10">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}

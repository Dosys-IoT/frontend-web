"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Pill,
  Cpu,
  Bell,
  User,
  Plus,
  LifeBuoy,
  LogOut,
} from "lucide-react";
import { DosysMark } from "@/components/brand/dosys-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clearSession } from "@/lib/auth/session";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/medications", label: "Medications", icon: Pill },
  { href: "/device", label: "Device", icon: Cpu },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="hidden h-[calc(100vh-8px)] w-[260px] shrink-0 flex-col gap-6 border-r border-[var(--color-ink-50)] bg-white px-5 pt-7 pb-5 md:flex">
      <div className="px-2">
        <DosysMark tone="dark" showSubtitle />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[14px] font-medium transition-colors",
                active
                  ? "bg-[var(--color-sanctuary-100)] text-[var(--color-sanctuary-700)]"
                  : "text-[var(--color-ink-500)] hover:bg-[var(--color-cream-200)]/40 hover:text-[var(--color-ink-900)]"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3">
        <Button asChild className="w-full" size="md">
          <Link href="/medications/new">
            <Plus className="h-4 w-4" />
            Add Medication
          </Link>
        </Button>
        <div className="space-y-1 px-2 text-[13px]">
          <button className="flex items-center gap-2 text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]">
            <LifeBuoy className="h-4 w-4" />
            Help
          </button>
          <button
            onClick={() => {
              clearSession();
              router.replace("/login");
            }}
            className="flex items-center gap-2 text-[var(--color-ink-500)] hover:text-[var(--color-danger-600)]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

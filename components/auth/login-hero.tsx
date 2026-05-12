import Image from "next/image";
import { DosysMark } from "@/components/brand/dosys-mark";

export function LoginHero() {
  return (
    <div className="relative hidden min-h-screen overflow-hidden md:block">
      <Image
        src="https://images.unsplash.com/photo-1545194445-dddb8f4487c6?auto=format&fit=crop&w=1600&q=80"
        alt="Sunlit clinical lobby with warm wood ceiling and soft seating"
        fill
        priority
        sizes="(min-width: 1024px) 720px, 50vw"
        className="object-cover"
      />

      {/* Overlay stack — strong enough that white text reads on any image */}
      <div className="absolute inset-0 bg-black/45" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/55"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/55 to-transparent"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.12),transparent_55%)]"
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 flex h-full min-h-screen flex-col justify-between p-10 lg:p-16">
        <DosysMark />

        <div className="max-w-[520px]">
          <h2 className="font-display text-[44px] leading-[1.05] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] lg:text-[58px]">
            A Digital Sanctuary
            <br />
            for{" "}
            <span className="text-[var(--color-sanctuary-300)]">
              Clinical Precision
            </span>
          </h2>
          <p className="mt-6 max-w-[44ch] text-[15px] leading-relaxed text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
            Designed for trust, built for clarity. Manage medication regimes with a
            sophisticated interface that prioritizes your peace of mind.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="glass-card flex flex-col gap-1 rounded-2xl px-5 py-3 text-white">
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/75">
              Reliability
            </span>
            <span className="font-display text-2xl">99.9%</span>
          </div>
          <div className="glass-card flex flex-col gap-1 rounded-2xl px-5 py-3 text-white">
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/75">
              Support
            </span>
            <span className="font-display text-2xl">24/7</span>
          </div>
        </div>
      </div>
    </div>
  );
}

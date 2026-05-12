import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Dosys — Clinical Sanctuary",
  description:
    "A digital sanctuary for clinical precision. Manage medication regimes with confidence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="fixed inset-x-0 top-0 z-50 h-2 bg-[var(--color-ink-950)]" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import "./globals.css"; 
import React from "react";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "FitFood — Smart Macro Tracker",
  description: "Track macros, log meals and get meal recommendations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 px-3 py-1.5 rounded-md bg-white border text-sm shadow"
        >
          Skip to content
        </a>

        <div className="app-shell max-w-6xl mx-auto px-4 sm:px-6">
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200/60">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="FitFood"
                  width={36}
                  height={36}
                  className="rounded-md border border-slate-200 object-cover"
                  priority
                />
                <div>
                  <h1 className="text-base font-semibold leading-tight">FitFood</h1>
                  <p className="text-[11px] text-slate-500">
                    Smart Macro Tracker &amp; Meal Recommendations
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-3">
                <nav className="hidden md:flex gap-5 text-sm text-slate-700" aria-label="Primary">
                  <Link href="/" className="hover:text-slate-900">Dashboard</Link>
                  <Link href="/meals" className="hover:text-slate-900">Meals</Link>
                  <Link href="/settings" className="hover:text-slate-900">Settings</Link>
                </nav>

                <Link
                  href="/help"
                  className="inline-flex items-center px-3 py-1.5 border rounded-full text-sm bg-white hover:bg-slate-50 shadow-sm focus-visible:ring-2 ring-blue-500 ring-offset-2 ring-offset-white"
                >
                  Help
                </Link>
              </div>
            </div>
          </header>

          <main id="main" className="py-6 space-y-6">{children}</main>

          <footer className="py-8 text-center text-xs text-slate-400">
            Built by Vibhor Saxena · Demo project
          </footer>
        </div>
      </body>
    </html>
  );
}

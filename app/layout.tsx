import "./globals.css";
import React from "react";
import Link from "next/link";

export const metadata = {
  title: "FitFood — Smart Macro Tracker",
  description: "Track macros, log meals and get meal recommendations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt="FitFood logo"
                className="w-10 h-10 rounded-md object-cover border"
                aria-hidden="true"
              />
              <div>
                <h1 className="text-lg font-semibold leading-tight">FitFood</h1>
                <p className="text-xs text-gray-500">
                  Smart Macro Tracker &amp; Meal Recommendations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <nav className="hidden md:flex gap-4 text-sm text-gray-600" aria-label="Primary">
                <Link href="/" className="hover:underline">
                  Dashboard
                </Link>
                <Link href="/meals" className="hover:underline">
                  Meals
                </Link>
                <Link href="/settings" className="hover:underline">
                  Settings
                </Link>
              </nav>

              <Link
                href="/help"
                className="inline-flex items-center px-3 py-1 border rounded-md text-sm bg-white hover:shadow"
              >
                Help
              </Link>
            </div>
          </header>

          <main className="bg-white rounded-lg shadow-sm p-6">{children}</main>

          <footer className="mt-8 text-center text-xs text-gray-400">
            Built by Vibhor Saxena · Demo project
          </footer>
        </div>
      </body>
    </html>
  );
}

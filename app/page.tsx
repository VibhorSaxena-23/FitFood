"use client";

import React, { useState, useCallback, useEffect } from "react";
import MacroDisplay from "@/components/MacroDisplay.client";
import FoodSearch from "@/components/FoodSearch.client";
import TodayLog from "@/components/TodayLog.client";
import Recommendations from "@/components/Recommendations.client";
import { toDateString } from "@/utils/formatters";
import { MEAL_ORDER } from "@/utils/constants";

// Replace with a real userId from DB (e.g., from auth)
const DEFAULT_USER_ID = "69244d641d47c0b4cb256057";

export default function DashboardPage() {
  const today = toDateString(new Date());
  const [userId] = useState<string>(DEFAULT_USER_ID);
  const [date] = useState<string>(today);
  const [meal, setMeal] = useState<"breakfast" | "lunch" | "dinner" | "snacks">(
    "lunch"
  );

  const [targets, setTargets] = useState<any>(null);
  const [consumed, setConsumed] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const refreshAll = useCallback(() => setRefreshKey((k) => k + 1), []);

  async function loadSummary() {
    if (!userId || !date) return;
    setLoadingSummary(true);
    try {
      const res = await fetch(`/api/daily-summary?userId=${userId}&date=${date}`);
      const j = await res.json();
      if (j.success) {
        setTargets(j.targets);
        setConsumed(j.consumed);
      } else {
        console.error("Daily summary failed:", j.message);
      }
    } catch (err: any) {
      console.error("Summary API error:", err.message);
    } finally {
      setLoadingSummary(false);
    }
  }

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, date, refreshKey]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT COLUMN */}
      <div className="lg:col-span-1 space-y-4">
        <MacroDisplay
          targets={targets || {}}
          consumed={consumed || {}}
          key={`macro-${refreshKey}`}
        />

        <TodayLog
          userId={userId}
          date={date}
          onChanged={refreshAll}
          key={`log-${refreshKey}`}
        />
      </div>

      {/* RIGHT COLUMN */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {MEAL_ORDER.map((m) => (
              <button
                key={m}
                onClick={() => setMeal(m as any)}
                className={`px-3 py-1 rounded-md text-sm ${
                  meal === m ? "bg-blue-600 text-white" : "bg-white border"
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div>{date}</div>
            {loadingSummary && <span className="text-xs text-gray-400">Updating…</span>}
            <button
              onClick={refreshAll}
              className="px-2 py-1 border rounded-md bg-white"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FoodSearch
            userId={userId}
            date={date}
            meal={meal}
            onAdded={refreshAll}
            key={`search-${refreshKey}`}
          />

          <Recommendations
            userId={userId}
            date={date}
            meal={meal}
            onAdded={refreshAll}
            key={`rec-${refreshKey}`}
          />
        </div>
      </div>
    </div>
  );
}

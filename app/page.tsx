"use client";

import React, { useState, useCallback, useEffect } from "react";
import MacroDisplay from "../components/MacroDisplay.client";
import MacroPieCharts from "../components/MacroPieCharts.client";
import MealCaloriesChart from "../components/MealCaloriesChart.client";
import FoodSearch from "../components/FoodSearch.client";
import TodayLog from "../components/TodayLog.client";
import Recommendations from "../components/Recommendations.client";
import UserProfileCard from "../components/UserProfileCard.client";
import WeeklyProgress from "../components/WeeklyProgress.client";
import { toDateString } from "../utils/formatters";
import { MEAL_ORDER } from "../utils/constants";

type Meal = "breakfast" | "lunch" | "dinner" | "snacks";

// REPLACE with a real user from DB
const DEFAULT_USER_ID = "69244d641d47c0b4cb256057";

export default function DashboardPage() {
  const today = toDateString(new Date());
  const [userId] = useState<string>(DEFAULT_USER_ID);
  const [date] = useState<string>(today);
  const [meal, setMeal] = useState<Meal>("lunch");

  const [targets, setTargets] = useState<any>(null);
  const [consumed, setConsumed] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const refreshAll = useCallback(() => setRefreshKey((k) => k + 1), []);

  async function loadSummary() {
    if (!userId || !date) return;
    setLoadingSummary(true);
    try {
      const res = await fetch(
        `/api/daily-summary?userId=${userId}&date=${date}`
      );
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

  const caloriesTarget = targets?.calories ?? 0;
  const caloriesConsumed = consumed?.calories ?? 0;

  const caloriesRemaining = Math.round(
    Math.max(0, caloriesTarget - caloriesConsumed)
  );
  const caloriesPctRaw =
    caloriesTarget > 0 ? (caloriesConsumed / caloriesTarget) * 100 : 0;
  const caloriesPctLabel = Math.round(caloriesPctRaw);
  const caloriesOver = caloriesPctRaw > 100;

  return (
    <div className="space-y-6">
      {/* HERO HEADER */}
      <section className="rounded-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 text-white p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/80">
              Overview
            </p>
            <h2 className="mt-1 text-2xl md:text-3xl font-semibold">
              Your day at a glance
            </h2>
            <p className="mt-2 text-sm text-white/85" aria-live="polite">
              {loadingSummary
                ? "Updating today's numbers…"
                : `Tracking ${date} against your goals.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            {/* Calories pill */}
            <div className="px-3 py-2 rounded-xl bg-black/20 backdrop-blur border border-white/15 min-w-[200px]">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/70">
                Calories
              </div>
              <div className="mt-1 text-sm font-semibold">
                {Math.round(caloriesConsumed)} / {Math.round(caloriesTarget || 0)}{" "}
                kcal
              </div>
              <div className="text-[11px] text-white/85 mt-1" aria-live="polite">
                {caloriesTarget > 0 ? (
                  <>
                    {caloriesOver ? (
                      <>
                        {Math.abs(Math.round(caloriesTarget - caloriesConsumed))}{" "}
                        kcal over ·{" "}
                      </>
                    ) : (
                      <>
                        {caloriesRemaining} kcal left ·{" "}
                      </>
                    )}
                    {caloriesPctLabel}% of goal
                  </>
                ) : (
                  "Set a calorie goal in the user section"
                )}
              </div>
            </div>

            {/* Active meal */}
            <div className="px-3 py-2 rounded-xl bg-black/10 border border-white/10">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/70">
                Active meal
              </div>
              <div className="mt-1 font-semibold capitalize">{meal}</div>
              <div className="text-[11px] text-white/80 mt-1">{date}</div>
            </div>

            {/* Refresh */}
            <button
              onClick={refreshAll}
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-medium hover:bg-white/15 transition"
            >
              Refresh data
            </button>
          </div>
        </div>

        {/* Meal selector */}
        <div className="mt-4 flex flex-wrap gap-2">
          {MEAL_ORDER.map((m) => {
            const mTyped = m as Meal;
            const isActive = meal === mTyped;

            return (
              <button
                key={m}
                onClick={() => setMeal(mTyped)}
                className={
                  "px-3 py-1 rounded-full text-xs font-medium border transition " +
                  (isActive
                    ? "bg-white text-sky-600 border-white shadow-sm"
                    : "bg-white/10 text-white border-white/20 hover:bg-white/20")
                }
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            );
          })}
        </div>
      </section>

      {/* MAIN GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 space-y-4">
          <UserProfileCard userId={userId} onGoalsUpdated={refreshAll} />

          <WeeklyProgress userId={userId} endDate={date} />

          <MacroDisplay
            targets={targets || {}}
            consumed={consumed || {}}
            key={`macro-${refreshKey}`}
          />

          <MacroPieCharts
            targets={targets || {}}
            consumed={consumed || {}}
            key={`pie-${refreshKey}`}
          />

          <MealCaloriesChart
            userId={userId}
            date={date}
            key={`mealcal-${refreshKey}`}
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
      </section>
    </div>
  );
}

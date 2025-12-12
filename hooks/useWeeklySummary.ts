"use client";

import { useEffect, useState } from "react";

export type WeeklyDay = { date: string; calories: number; goal: number };

export default function useWeeklySummary(userId: string, endDate: string) {
  const [days, setDays] = useState<WeeklyDay[]>([]);
  const [goalCalories, setGoalCalories] = useState<number>(0);
  const [averageCalories, setAverageCalories] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!userId || !endDate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/weekly-summary?userId=${encodeURIComponent(
          userId
        )}&endDate=${encodeURIComponent(endDate)}`
      );

      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Weekly summary parse failed (${res.status})`);
      }

      if (!res.ok || !json.success) {
        throw new Error(json.message || `Weekly summary failed (${res.status})`);
      }

      setDays(json.days || []);
      setGoalCalories(json.goalCalories || 0);
      setAverageCalories(json.averageCalories || 0);
    } catch (e: any) {
      setError(e.message || "Error loading weekly summary");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, endDate]);

  return { days, goalCalories, averageCalories, loading, error, reload: load };
}

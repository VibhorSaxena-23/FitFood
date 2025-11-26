// components/TodayLog.client.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MEAL_ORDER } from "../utils/constants";

type Props = {
  userId: string;
  date: string; // YYYY-MM-DD
  onChanged?: () => void;
};

export default function TodayLog({ userId, date, onChanged }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    if (!userId || !date) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/logs?userId=${encodeURIComponent(userId)}&date=${encodeURIComponent(
          date
        )}`
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load logs");
      }
      setLogs(json.logs || []);
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, date]);

  async function del(id: string) {
    if (!confirm("Delete this log?")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/logs/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Delete failed");
      }
      setLogs((s) => s.filter((l) => l._id !== id));
      onChanged?.();
    } catch (err: any) {
      setError(err.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  // Group logs by meal and compute calories per meal
  const grouped = useMemo(() => {
    const byMeal: Record<
      string,
      { logs: any[]; totalCalories: number }
    > = {};

    MEAL_ORDER.forEach((m) => {
      byMeal[m] = { logs: [], totalCalories: 0 };
    });

    for (const l of logs) {
      const meal = (l.meal || "").toLowerCase();
      if (!byMeal[meal]) {
        byMeal[meal] = { logs: [], totalCalories: 0 };
      }
      byMeal[meal].logs.push(l);
      byMeal[meal].totalCalories += Number(
        l.computedNutrients?.calories || 0
      );
    }

    return byMeal;
  }, [logs]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Today's log ({date})</h3>
        <button
          onClick={load}
          className="text-sm px-2 py-1 border rounded-md"
        >
          Refresh
        </button>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}

      {!loading && logs.length === 0 && !error && (
        <div className="text-sm text-gray-500">
          No items logged yet for today.
        </div>
      )}

      {/* Sections per meal */}
      <div className="space-y-4 mt-2">
        {MEAL_ORDER.map((meal) => {
          const section = grouped[meal];
          const items = section?.logs || [];
          const totalCalories = Math.round(section?.totalCalories || 0);
          const label = meal.charAt(0).toUpperCase() + meal.slice(1);

          return (
            <div key={meal}>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold">{label}</h4>
                <span className="text-xs text-gray-500">
                  {items.length} item{items.length === 1 ? "" : "s"}
                  {totalCalories > 0 && ` · ${totalCalories} kcal`}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="text-xs text-gray-400 mb-1">
                  Nothing logged for {label.toLowerCase()} yet.
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.map((l) => (
                    <li
                      key={l._id}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div>
                        <div className="font-medium">{l.foodName}</div>
                        <div className="text-xs text-gray-500">
                          {l.qty}
                          {l.qtyUnit === "g" ? " g" : " serving"} ·{" "}
                          {Math.round(
                            l.computedNutrients?.calories || 0
                          )}{" "}
                          kcal
                        </div>
                      </div>

                      <button
                        onClick={() => del(l._id)}
                        disabled={deletingId === l._id}
                        className="px-2 py-1 text-sm text-red-600 border rounded-md hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingId === l._id ? "Deleting…" : "Delete"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

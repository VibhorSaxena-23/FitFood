"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

type Props = {
  userId: string;
  date: string; // YYYY-MM-DD
};

function safeNumber(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const MEALS = ["breakfast", "lunch", "dinner", "snacks"] as const;

export default function MealCaloriesChart({ userId, date }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !date) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/logs?userId=${encodeURIComponent(
            userId
          )}&date=${encodeURIComponent(date)}`
        );

        // safer parse (avoids Unexpected token '<' if server returns HTML)
        const text = await res.text();
        let json: any = {};
        try {
          json = text ? JSON.parse(text) : {};
        } catch {
          throw new Error(`Failed to parse logs (status ${res.status})`);
        }

        if (!res.ok || !json.success) {
          throw new Error(json.message || `Failed to load logs (${res.status})`);
        }

        if (cancelled) return;
        setLogs(json.logs || []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e.message || "Failed to load meal calories");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, date]);

  const perMeal = useMemo(() => {
    const sums: Record<string, number> = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snacks: 0,
    };

    for (const l of logs) {
      const meal = String(l.meal || "").toLowerCase();
      const cal = safeNumber(l.computedNutrients?.calories);
      if (sums[meal] !== undefined) sums[meal] += cal;
    }

    return sums;
  }, [logs]);

  const total = Math.round(
    perMeal.breakfast + perMeal.lunch + perMeal.dinner + perMeal.snacks
  );

  const data = {
    labels: ["Breakfast", "Lunch", "Dinner", "Snacks"],
    datasets: [
      {
        data: [
          Math.round(perMeal.breakfast),
          Math.round(perMeal.lunch),
          Math.round(perMeal.dinner),
          Math.round(perMeal.snacks),
        ],
        // clean colors for white theme
        backgroundColor: ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6"],
        borderWidth: 0,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    cutout: "65%",
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${Math.round(ctx.parsed as number)} kcal`,
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Calories by meal</h3>
        <span className="text-xs text-slate-500">{date}</span>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && total === 0 && (
        <div className="text-sm text-slate-500">
          No calories logged yet today.
        </div>
      )}

      {!loading && !error && total > 0 && (
        <>
          <div className="mx-auto w-[260px]">
            <Doughnut data={data} options={options} />
          </div>

          <div className="mt-3 text-center text-sm text-slate-700">
            <span className="font-semibold">{total}</span> kcal total logged today
          </div>
        </>
      )}
    </div>
  );
}

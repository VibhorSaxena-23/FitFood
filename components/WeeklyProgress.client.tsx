// components/WeeklyProgress.client.tsx
"use client";

import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
  type ChartDataset,
  type ScriptableContext,
  type ChartArea,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import useWeeklySummary from "../hooks/useWeeklySummary";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

function dayLabel(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short" });
}
function dateLabel(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function WeeklyProgress({
  userId,
  endDate,
}: {
  userId: string;
  endDate: string; // YYYY-MM-DD
}) {
  const { days, goalCalories, averageCalories, loading, error, reload } =
    useWeeklySummary(userId, endDate);

  const labels = useMemo(
    () => days.map((d) => `${dayLabel(d.date)}\n${dateLabel(d.date)}`),
    [days]
  );
  const calories = useMemo(() => days.map((d) => d.calories), [days]);
  const goals = useMemo(() => days.map((d) => d.goal), [days]);
  const suggestedMax = useMemo(
    () => Math.max(1, ...days.map((d) => Math.max(d.calories, d.goal))) * 1.15,
    [days]
  );

  // Gradient fill for bars (typed for bar scriptable context)
  const barBackground = (ctx: ScriptableContext<"bar">) => {
    const { chart, dataIndex } = ctx;
    const area: ChartArea | undefined = chart?.chartArea;
    if (!area) return "rgba(16,185,129,0.85)"; // first render
    const value = calories[dataIndex] ?? 0;
    const goal = goals[dataIndex] ?? goalCalories;
    const over = value > goal;

    const g = chart.ctx.createLinearGradient(0, area.bottom, 0, area.top);
    if (over) {
      g.addColorStop(0, "rgba(244,63,94,0.85)");  // rose-500
      g.addColorStop(1, "rgba(244,63,94,0.55)");
    } else {
      g.addColorStop(0, "rgba(16,185,129,0.85)"); // emerald-500
      g.addColorStop(1, "rgba(20,184,166,0.65)"); // teal-500
    }
    return g;
  };

  // ---- Typed datasets (no "12px"; only numbers or the literal "flex") ----
  const barDS: ChartDataset<"bar", number[]> = {
    type: "bar",
    label: "Calories",
    data: calories,
    backgroundColor: barBackground,
    borderRadius: 10,
    borderSkipped: false,
    barThickness: "flex",         // <- literal allowed
    maxBarThickness: 42,          // <- number (NOT "42px")
  };

  const goalLineDS: ChartDataset<"line", number[]> = {
    type: "line",
    label: "Goal",
    data: goals,
    fill: false,
    pointRadius: 0,
    borderColor: "rgba(30,41,59,0.7)", // slate-800
    borderDash: [6, 5],
    tension: 0.35,
  };

  const avgLineDS: ChartDataset<"line", number[]> = {
    type: "line",
    label: "Average",
    data: labels.map(() => averageCalories),
    fill: false,
    pointRadius: 0,
    borderColor: "rgba(59,130,246,0.9)", // blue-500
    tension: 0.35,
  };

  // Mixed data type for bar + line
  const data: ChartData<"bar" | "line", number[], string> = {
    labels,
    datasets: [barDS, goalLineDS, avgLineDS],
  };

  const options: ChartOptions<"bar" | "line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 12, boxHeight: 12, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          title(items) {
            return (items?.[0]?.label || "").replace("\n", " · ");
          },
          afterBody: (items) => {
            const idx = items?.[0]?.dataIndex ?? 0;
            const cals = calories[idx] ?? 0;
            const g = goals[idx] ?? goalCalories;
            const diff = cals - g;
            const tag =
              diff === 0
                ? "on goal"
                : diff > 0
                ? `${Math.abs(Math.round(diff))} kcal over`
                : `${Math.abs(Math.round(diff))} kcal left`;
            return `\n${tag}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 0,
          callback: (val) => {
            const l = labels[Number(val)] || "";
            const [d1, d2] = l.split("\n");
            return [d1, d2];
          },
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax,
        grid: { color: "rgba(148,163,184,0.2)", tickBorderDash: [4, 4] },
        ticks: { callback: (v) => `${v} kcal` },
      },
    },
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">Weekly calories</h3>
          <p className="text-xs text-slate-500">
            Last 7 days · Avg{" "}
            <span className="font-semibold text-slate-700">
              {averageCalories}
            </span>{" "}
            / {goalCalories} kcal
          </p>
        </div>
        <button
          onClick={reload}
          className="px-2.5 py-1.5 text-xs border rounded-lg hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {loading && <div className="mt-3 text-sm text-slate-500">Loading…</div>}
      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      {!loading && !error && days.length > 0 && (
        <div className="mt-4 h-64 sm:h-72">
          {/* Use the generic Chart for mixed types */}
          <Chart type="bar" data={data} options={options} />
        </div>
      )}
    </div>
  );
}

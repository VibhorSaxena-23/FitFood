"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

type MacroMap = Record<string, number | undefined>;

type Props = {
  targets: MacroMap;  // e.g. { protein_g: 120, carbs_g: 250, fat_g: 70, fiber_g: 25 }
  consumed: MacroMap; // e.g. { protein_g: 90,  carbs_g: 190, fat_g: 60, fiber_g: 18 }
};

const MACROS = [
  { key: "protein_g", label: "Protein (g)" },
  { key: "carbs_g", label: "Carbs (g)" },
  { key: "fat_g", label: "Fat (g)" },
  { key: "fiber_g", label: "Fiber (g)" },
] as const;

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

export default function MacroPieCharts({ targets, consumed }: Props) {
  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    cutout: "65%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${Math.round(ctx.parsed as number)}`,
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Macros (Consumed vs Left)</h3>
        <span className="text-xs text-slate-500">Today</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MACROS.map((m) => {
          const target = n(targets?.[m.key]);
          const used = n(consumed?.[m.key]);

          const left = Math.max(0, target - used);
          const over = Math.max(0, used - target);

          const data = {
            labels: ["Consumed", "Left"],
            datasets: [
              {
                data: [Math.round(used), Math.round(left)],
                // keep colors simple & clean for a white theme
                backgroundColor: ["#ffffffff", "#000000ff"],
                borderWidth: 0,
              },
            ],
          };

          return (
            <div key={m.key} className="flex flex-col items-center">
              <div className="w-[130px] h-[130px]">
                <Doughnut data={data} options={options} />
              </div>

              <div className="mt-2 text-center">
                <div className="text-sm font-medium text-slate-800">{m.label}</div>
                <div className="text-xs text-slate-500">
                  {Math.round(used)} / {Math.round(target)}{" "}
                  {over > 0 ? (
                    <span className="text-rose-600">· {Math.round(over)} over</span>
                  ) : (
                    <span>· {Math.round(left)} left</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

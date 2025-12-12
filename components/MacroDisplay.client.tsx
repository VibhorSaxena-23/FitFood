// components/MacroDisplay.client.tsx
"use client";

import React from "react";
import { MACRO_LABELS, MACRO_COLORS, MACRO_KEYS } from "../utils/constants";
import { formatMacroValue } from "../utils/formatters";

type MacroMap = { [k: string]: number };

type Props = {
  targets: MacroMap;
  consumed: MacroMap;
};

export default function MacroDisplay({ targets, consumed }: Props) {
  return (
    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900">Today's macros</h3>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
          Live
        </span>
      </div>

      <div className="space-y-3">
        {MACRO_KEYS.map((k) => {
          const label = MACRO_LABELS[k];
          const color = MACRO_COLORS[k];

          const target = targets?.[k] ?? 0;
          const used = consumed?.[k] ?? 0;
          const remaining = target - used;

          const rawPct = target > 0 ? (used / target) * 100 : 0;
          const displayPct = Math.round(rawPct); // can be > 100
          const barPct = Math.max(0, Math.min(100, rawPct)); // clamp just for bar
          const isOver = rawPct > 100.0001;

          return (
            <div key={k} className="flex items-center gap-3">
              {/* Text block */}
              <div className="w-32">
                <div className="text-sm font-medium text-slate-800">
                  {label}
                </div>
                <div className="text-[11px] text-slate-500">
                  {formatMacroValue(k, used)} / {formatMacroValue(k, target)}
                </div>
                {target > 0 && (
                  <div
                    className={
                      "text-[11px] mt-0.5 " +
                      (isOver ? "text-rose-600" : "text-emerald-600")
                    }
                  >
                    {isOver
                      ? `${Math.abs(Math.round(remaining))} over`
                      : `${Math.max(0, Math.round(remaining))} left`}
                  </div>
                )}
              </div>

              {/* Bar */}
              <div className="flex-1">
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{
                      width: `${barPct}%`,
                      background: color,
                    }}
                  />
                </div>
              </div>

              {/* Percentage */}
              <div
                className={
                  "w-14 text-right text-sm font-semibold " +
                  (isOver ? "text-rose-600" : "text-slate-700")
                }
              >
                {displayPct}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

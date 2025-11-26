"use client";

import React from "react";
import { percent, formatMacroValue } from "@/utils/formatters";
import { MACRO_LABELS, MACRO_COLORS, MACRO_KEYS } from "@/utils/constants";

type MacroMap = { [k: string]: number };

type Props = {
  targets: MacroMap;
  consumed: MacroMap;
};

export default function MacroDisplay({ targets, consumed }: Props) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h3 className="font-semibold mb-3">Today's macros</h3>

      <div className="space-y-3">
        {MACRO_KEYS.map((k) => {
          const tgt = targets?.[k] || 0;
          const cons = consumed?.[k] || 0;
          const pct = percent(cons, Math.max(tgt, 1));
          const label = MACRO_LABELS[k];
          const color = MACRO_COLORS[k];

          return (
            <div key={k} className="flex items-center gap-3">
              <div style={{ width: 120 }}>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-gray-500">
                  {formatMacroValue(k, cons)} / {formatMacroValue(k, tgt)}
                </div>
              </div>

              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(100, Math.round(pct))}%`,
                    background: color,
                  }}
                  className="h-full"
                />
              </div>

              <div className="w-12 text-right text-sm font-medium">
                {Math.round(pct)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

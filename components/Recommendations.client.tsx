// components/Recommendations.client.tsx
"use client";

import React, { useState } from "react";
import useRecommendations, {
  Recommendation,
} from "../hooks/useRecommendations";
import type { Meal } from "../utils/constants";

type Props = {
  userId: string;
  date: string; // YYYY-MM-DD
  meal: Meal;
  onAdded?: () => void;
};

export default function Recommendations({
  userId,
  date,
  meal,
  onAdded,
}: Props) {
  const [enabled, setEnabled] = useState(false);

  const { recommendations, loading, error, reload } = useRecommendations(
    enabled ? userId : null,
    meal,
    date,
    enabled
  );
  const [adding, setAdding] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function addRec(rec: Recommendation) {
    if (!userId) {
      setMsg("No userId provided");
      return;
    }
    setAdding(rec.foodId);
    try {
      const body = {
        userId,
        date,
        meal,
        foodId: rec.foodId,
        qty: rec.grams,
        qtyUnit: "g",
      };
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Add failed (${res.status})`);
      }

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Add failed");
      }

      setMsg("Added recommendation");
      onAdded?.();
      setTimeout(() => setMsg(null), 2000);
    } catch (err: any) {
      setMsg(err.message || "Network error");
    } finally {
      setAdding(null);
    }
  }

  function handleClick() {
    if (!enabled) {
      setEnabled(true); // first time → fetch
    } else {
      reload(); // subsequent clicks → refresh
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Recommendations for {meal}</h3>

        <button
          onClick={handleClick}
          className="px-3 py-1 text-sm border rounded-md bg-white hover:bg-gray-50"
          disabled={loading}
        >
          {enabled ? (loading ? "Loading…" : "Refresh") : "Get recommendations"}
        </button>
      </div>

      {enabled && (
        <>
          {loading && (
            <div className="text-sm text-gray-500">
              Loading recommendations…
            </div>
          )}
          {error && <div className="text-sm text-red-500">{error}</div>}

          {!loading && !error && recommendations.length === 0 && (
            <div className="text-sm text-gray-500">
              No recommendations available
            </div>
          )}

          <ul className="mt-2 space-y-2 max-h-72 overflow-y-auto">
            {recommendations.map((r) => (
              <li
                key={`${r.foodId}-${r.grams}`}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-gray-500">
                    {r.grams} g · {Math.round(r.scaled?.calories || 0)} kcal ·{" "}
                    {Math.round(r.scaled?.protein_g || 0)} g protein
                  </div>
                </div>

                <button
                  onClick={() => addRec(r)}
                  disabled={adding === r.foodId}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60"
                >
                  {adding === r.foodId ? "Adding…" : "Add"}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {!enabled && (
        <p className="text-xs text-gray-500">
          Tap &ldquo;Get recommendations&rdquo; to see suggested foods for this
          meal.
        </p>
      )}

      {msg && <div className="mt-3 text-sm text-indigo-600">{msg}</div>}
    </div>
  );
}

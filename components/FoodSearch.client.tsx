"use client";

import React, { useState } from "react";
import useFoods from "@/hooks/useFoods";

type Props = {
  userId: string;
  date: string; // YYYY-MM-DD
  meal: "breakfast" | "lunch" | "dinner" | "snacks";
  onAdded?: () => void;
};

export default function FoodSearch({ userId, date, meal, onAdded }: Props) {
  const [query, setQuery] = useState("");
  const { foods, loading, error } = useFoods(query);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function addFood(foodId: string, qty = 100, qtyUnit = "g") {
    if (!userId) {
      setMessage("No userId provided");
      return;
    }
    setAddingId(foodId);
    try {
      const body = { userId, date, meal, foodId, qty, qtyUnit };
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.message || "Failed to add food");
      } else {
        setMessage("Added to log");
        setQuery("");
        if (onAdded) onAdded();
      }
    } catch (err: any) {
      setMessage(err.message || "Network error");
    } finally {
      setAddingId(null);
      setTimeout(() => setMessage(null), 2000);
    }
  }

  return (
    <div className="p-4 rounded-lg bg-white shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        
        <div>
          <h3 className="font-semibold">Add food</h3>
          <p className="text-sm text-gray-500">
            Search foods and add to {meal}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods (e.g., scrambled eggs)"
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring"
        />
        <button
          onClick={() => setQuery("")}
          className="px-3 py-2 text-sm text-gray-600 border rounded-md"
        >
          Clear
        </button>
      </div>

      <div className="mt-3">
        {loading && <div className="text-sm text-gray-500">Searching…</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}

        {!loading && query.length >= 2 && (
          <div className="mt-2 max-h-64 overflow-y-auto">
            {foods.length === 0 && (
              <div className="text-sm text-gray-500">No matches</div>
            )}
            <ul className="space-y-2">
              {foods.map((f: any) => (
                <li
                  key={f._id}
                  className="flex items-center justify-between gap-3 p-2 border rounded-md"
                >
                  <div>
                    <div className="font-medium">{f.name}</div>
                    <div className="text-xs text-gray-500">
                      {f.category || "—"} · {f.serving?.label || "100 g"} ·{" "}
                      {Math.round(f.nutrients?.calories || 0)} kcal
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={addingId === f._id}
                      onClick={() => addFood(f._id, 100, "g")}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                    >
                      {addingId === f._id ? "Adding…" : "Add 100 g"}
                    </button>

                    <button
                      disabled={addingId === f._id}
                      onClick={() => addFood(f._id, 1, "serving")}
                      className="px-2 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-60"
                    >
                      Add serving
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {message && <div className="mt-3 text-sm text-indigo-600">{message}</div>}
    </div>
  );
}

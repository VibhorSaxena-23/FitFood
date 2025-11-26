// hooks/useRecommendations.ts
"use client";

import { useEffect, useState } from "react";
import type { Meal } from "../utils/constants";

export interface Recommendation {
  foodId: string;
  name: string;
  grams: number;
  scaled: any;
  score: number;
  tags?: string[];
}

export default function useRecommendations(
  userId: string | null,
  meal: Meal,
  date: string,
  enabled = true
) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!enabled || !userId || !meal || !date) {
      setRecommendations([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const params = new URLSearchParams({ userId, meal, date });
        const res = await fetch(`/api/recommend?${params.toString()}`);

        // Safer parse: avoid "Unexpected token '<'" when server returns HTML
        const text = await res.text();
        let json: any = {};
        try {
          json = text ? JSON.parse(text) : {};
        } catch {
          throw new Error(
            `Failed to parse recommendations (status ${res.status})`
          );
        }

        if (!res.ok || !json.success) {
          throw new Error(json.message || `Request failed (${res.status})`);
        }

        if (cancelled) return;
        setRecommendations(json.recommendations || []);
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || "Error loading recommendations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, meal, date, enabled, trigger]);

  const reload = () => setTrigger((t) => t + 1);

  return { recommendations, loading, error, reload };
}

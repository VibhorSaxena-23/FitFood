// hooks/useFoods.ts
"use client";

import { useEffect, useState } from "react";

export default function useFoods(query: string) {
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setFoods([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/foods?search=${encodeURIComponent(q)}&limit=50`
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          if (!cancelled) {
            setError(json.message || "Search failed");
            setFoods([]);
          }
        } else if (!cancelled) {
          setFoods(json.foods || []);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  return { foods, loading, error };
}

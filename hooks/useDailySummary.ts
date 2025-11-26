//  fitfood/hooks/useDailySummary.ts
"use client";

import { useEffect, useState } from "react";

export default function useDailySummary(date: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;

    async function fetchSummary() {
      try {
        setLoading(true);
        const res = await fetch(`/api/daily-summary?date=${date}`);
        if (!res.ok) throw new Error("Failed to fetch daily summary");

        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Error fetching summary");
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [date]);

  return { data, loading, error, refresh: () => setData(null) };
}

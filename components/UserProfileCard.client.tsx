"use client";

import React, { useEffect, useState } from "react";

type Props = {
  userId: string;
  onGoalsUpdated?: () => void;
};

type Profile = {
  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  sex?: string;
  activityLevel?: string;
};

export default function UserProfileCard({ userId, onGoalsUpdated }: Props) {
  const [profile, setProfile] = useState<Profile>({
    weight_kg: undefined,
    height_cm: undefined,
    age: undefined,
    sex: "other",
    activityLevel: "light",
  });
  const [goals, setGoals] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load current user data
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/user?userId=${userId}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load user");
        }
        setProfile({
          weight_kg: json.user.profile?.weight_kg ?? "",
          height_cm: json.user.profile?.height_cm ?? "",
          age: json.user.profile?.age ?? "",
          sex: json.user.profile?.sex || "other",
          activityLevel: json.user.profile?.activityLevel || "light",
        });
        setGoals(json.user.goals || null);
      } catch (err: any) {
        setError(err.message || "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  async function save() {
    if (!userId) return;
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, profile }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save");
      }
      setGoals(json.user.goals || null);
      setMsg("Saved & recalculated goals");
      onGoalsUpdated?.();
      setTimeout(() => setMsg(null), 2500);
    } catch (err: any) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function onInputChange<K extends keyof Profile>(key: K, value: any) {
    setProfile((p) => ({
      ...p,
      [key]:
        key === "sex" || key === "activityLevel"
          ? value
          : value === ""
          ? ""
          : Number(value),
    }));
  }

  return (
    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-900">Your profile</h3>
          <p className="text-xs text-slate-500">
            Used to calculate calories & macros.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save & recalc"}
        </button>
      </div>

      {loading && (
        <div className="text-xs text-slate-500 mb-2">Loading profile…</div>
      )}
      {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
      {msg && <div className="text-xs text-emerald-600 mb-2">{msg}</div>}

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <label className="flex flex-col gap-1">
          <span className="text-slate-600">Weight (kg)</span>
          <input
            type="number"
            min={30}
            max={300}
            value={profile.weight_kg ?? ""}
            onChange={(e) => onInputChange("weight_kg", e.target.value)}
            className="px-2 py-1.5 border rounded-md text-xs"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-slate-600">Height (cm)</span>
          <input
            type="number"
            min={120}
            max={230}
            value={profile.height_cm ?? ""}
            onChange={(e) => onInputChange("height_cm", e.target.value)}
            className="px-2 py-1.5 border rounded-md text-xs"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-slate-600">Age</span>
          <input
            type="number"
            min={10}
            max={90}
            value={profile.age ?? ""}
            onChange={(e) => onInputChange("age", e.target.value)}
            className="px-2 py-1.5 border rounded-md text-xs"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-slate-600">Sex</span>
          <select
            value={profile.sex || "other"}
            onChange={(e) => onInputChange("sex", e.target.value)}
            className="px-2 py-1.5 border rounded-md text-xs"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-slate-600">Activity level</span>
          <select
            value={profile.activityLevel || "light"}
            onChange={(e) => onInputChange("activityLevel", e.target.value)}
            className="px-2 py-1.5 border rounded-md text-xs"
          >
            <option value="sedentary">Sedentary (desk job)</option>
            <option value="light">Light (1–3 workouts/week)</option>
            <option value="moderate">Moderate (3–5 workouts/week)</option>
            <option value="active">Active (6–7 workouts/week)</option>
            <option value="athlete">Athlete (2x/day training)</option>
          </select>
        </label>
      </div>

      {/* Quick preview of goals */}
      {goals && (
        <div className="mt-4 border-t pt-3 text-[11px] text-slate-600">
          <div className="font-semibold text-slate-800 mb-1">
            Current daily goals
          </div>
          <div className="flex flex-wrap gap-3">
            <span>
              {Math.round(goals.calories)} kcal
            </span>
            <span>
              Protein: {Math.round(goals.protein_g)} g
            </span>
            <span>
              Carbs: {Math.round(goals.carbs_g)} g
            </span>
            <span>
              Fat: {Math.round(goals.fat_g)} g
            </span>
            <span>
              Fiber: {Math.round(goals.fiber_g)} g
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

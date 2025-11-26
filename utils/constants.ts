// utils/constants.ts

export const MACRO_KEYS = [
  "calories",
  "protein_g",
  "carbs_g",
  "fat_g",
  "fiber_g",
] as const;

export type MacroKey = (typeof MACRO_KEYS)[number];

export const MACRO_LABELS: Record<MacroKey, string> = {
  calories: "Calories",
  protein_g: "Protein",
  carbs_g: "Carbs",
  fat_g: "Fat",
  fiber_g: "Fiber",
};

export const MACRO_COLORS: Record<MacroKey, string> = {
  calories: "#FF6B6B",
  protein_g: "#4ECDC4",
  carbs_g: "#45B7D1",
  fat_g: "#FFA726",
  fiber_g: "#8E44AD",
};

export const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snacks"] as const;

export type Meal = (typeof MEAL_ORDER)[number];

export const DEFAULT_MEAL_RATIOS: Record<Meal, number> = {
  breakfast: 1,
  lunch: 2,
  dinner: 2,
  snacks: 1,
};

export const PORTION_OPTIONS = [50, 75, 100, 150, 200];

export const TOP_RECOMMENDATION_COUNT = 40;

export const DEFAULT_DAILY_GOALS = {
  calories: 2000,
  protein_g: 100,
  carbs_g: 250,
  fat_g: 70,
  fiber_g: 25,
};

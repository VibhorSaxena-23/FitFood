// utils/formatters.ts

export function round(value: number, decimals = 1): number {
  if (!value) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function commaNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0";
  return value.toLocaleString("en-US");
}

export function formatGrams(v: number): string {
  return `${round(v, 1)} g`;
}

export function formatMilligrams(v: number): string {
  return `${round(v, 0)} mg`;
}

export function formatCalories(v: number): string {
  return `${round(v, 0)} kcal`;
}

export function formatMacroValue(key: string, value: number): string {
  switch (key) {
    case "calories":
      return formatCalories(value);
    case "protein_g":
    case "carbs_g":
    case "fat_g":
    case "fiber_g":
      return formatGrams(value);
    default:
      return round(value, 1).toString();
  }
}

// Date → YYYY-MM-DD
export function toDateString(date: Date): string {
  if (!(date instanceof Date)) return "";
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 0–100 clamp for progress bars
export function percent(part: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, Math.max(0, (part / total) * 100));
}

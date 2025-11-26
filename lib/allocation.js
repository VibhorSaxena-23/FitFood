// lib/allocation.js
// Pure functions for allocating remaining daily macros across upcoming meals.

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snacks"];

/**
 * Determine upcoming meals given currentMeal and which meals are already logged.
 */
function determineUpcomingMeals(currentMeal, loggedMeals = []) {
  const lowerLogged = (loggedMeals || []).map((m) => String(m).toLowerCase());
  const mealKey = String(currentMeal || "").toLowerCase();
  const idx = MEAL_ORDER.indexOf(mealKey);
  let upcoming;

  if (idx >= 0) {
    upcoming = MEAL_ORDER.slice(idx);
  } else {
    upcoming = Array.from(MEAL_ORDER);
  }

  return upcoming.filter((m) => !lowerLogged.includes(m));
}

/**
 * Allocate remaining macros for one meal.
 */
function allocateForMeal(
  targets = {},
  consumed = {},
  ratios = { breakfast: 1, lunch: 2, dinner: 2, snacks: 1 },
  currentMeal = "lunch",
  loggedMeals = [],
  options = {}
) {
  const safetyCap = typeof options.safetyCap === "number" ? options.safetyCap : 0.8;
  const allowNegative = !!options.allowNegative;

  const keys = ["calories", "protein_g", "carbs_g", "fat_g", "fiber_g"];
  const remaining = {};

  keys.forEach((k) => {
    const t = Number(targets[k] || 0);
    const c = Number(consumed[k] || 0);
    const rem = t - c;
    remaining[k] = allowNegative ? rem : Math.max(0, rem);
  });

  const upcoming = determineUpcomingMeals(currentMeal, loggedMeals);
  if (!upcoming.length) {
    const zeroAlloc = {};
    keys.forEach((k) => (zeroAlloc[k] = 0));
    return zeroAlloc;
  }

  const weights = upcoming.map((m) => ratios[m] || 0);
  const sumWeights = weights.reduce((a, b) => a + b, 0) || 1;
  const thisWeight = ratios[String(currentMeal).toLowerCase()] || 1;

  const alloc = {};
  keys.forEach((k) => {
    let base = remaining[k] * (thisWeight / sumWeights);
    if (k === "calories" && base > remaining[k] * safetyCap) {
      base = remaining[k] * safetyCap;
    }
    alloc[k] = Math.max(0, base);
  });

  return alloc;
}

module.exports = { determineUpcomingMeals, allocateForMeal, MEAL_ORDER };

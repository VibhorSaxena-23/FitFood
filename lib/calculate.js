// lib/calculate.js
// Recommendation pipeline: score foods vs. a meal allocation.

function clamp(v, a = 0, b = 1) {
  return Math.max(a, Math.min(b, v));
}

function scaleNutrients(nutrientsPerServing, servingGrams, targetGrams) {
  const factor = targetGrams / (servingGrams || 100);
  return {
    calories: Number((nutrientsPerServing.calories || 0) * factor),
    protein_g: Number((nutrientsPerServing.protein_g || 0) * factor),
    carbs_g: Number((nutrientsPerServing.carbs_g || 0) * factor),
    fat_g: Number((nutrientsPerServing.fat_g || 0) * factor),
    fiber_g: Number((nutrientsPerServing.fiber_g || 0) * factor),
    sugar_g: Number((nutrientsPerServing.sugar_g || 0) * factor),
    sodium_mg: Number((nutrientsPerServing.sodium_mg || 0) * factor),
    cholesterol_mg: Number((nutrientsPerServing.cholesterol_mg || 0) * factor),
  };
}

function scorePortion(scaled, alloc, prefs = {}) {
  const small = 1e-6;
  const calTarget = Math.max(alloc.calories || 1, small);
  const protTarget = Math.max(alloc.protein_g || 1, small);
  const fiberTarget = Math.max(alloc.fiber_g || 1, small);

  const calFit = clamp(1 - Math.abs(scaled.calories - calTarget) / calTarget, -1, 1);
  const protFit = clamp(scaled.protein_g / protTarget, 0, 1);
  const fiberFit = clamp(scaled.fiber_g / fiberTarget, 0, 1);

  const excessPenalty =
    scaled.calories > calTarget
      ? Math.max(0, (scaled.calories - calTarget) / (calTarget + small))
      : 0;

  const protPriority = alloc.protein_g / (alloc.calories + small);
  const fiberPriority = alloc.fiber_g / (alloc.calories + small);

  const w_cal = 0.35;
  const w_prot = 0.45 + protPriority * 0.5;
  const w_fiber = 0.2 + fiberPriority * 0.2;

  let score = w_cal * calFit + w_prot * protFit + w_fiber * fiberFit - 0.8 * excessPenalty;

  if (scaled.fat_g <= (alloc.fat_g || 999)) score += 0.05;

  return score;
}

async function recommendFoods(opts = {}) {
  const {
    user = {},
    alloc = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
    candidateFoods = [],
    portionOptions = [50, 100, 150],
    topN = 20,
    maxCalorieMultiplier = 1.25,
  } = opts;

  const prefs = user.preferences || {};
  const lowerAllergies = (prefs.allergies || []).map((a) => a.toLowerCase());
  const lowerDislikes = (prefs.dislikes || []).map((d) => d.toLowerCase());
  const vegetarian = !!prefs.vegetarian;

  const results = [];

  for (const food of candidateFoods) {
    const nameLower = (food.name || "").toLowerCase();
    const foodTagsLower = (food.tags || []).map((t) => t.toLowerCase());

    const hasAllergy = lowerAllergies.some(
      (a) => nameLower.includes(a) || foodTagsLower.includes(a)
    );
    if (hasAllergy) continue;

    const hasDislike = lowerDislikes.some(
      (d) => nameLower.includes(d) || foodTagsLower.includes(d)
    );
    if (hasDislike) continue;

    if (vegetarian) {
      const nonVegKeywords = [
        "chicken",
        "beef",
        "pork",
        "lamb",
        "bacon",
        "salami",
        "ham",
        "fish",
        "tuna",
        "shrimp",
        "mutton",
      ];
      if (nonVegKeywords.some((k) => nameLower.includes(k))) continue;
    }

    let bestForFood = null;

    for (const grams of portionOptions) {
      const scaled = scaleNutrients(food.nutrients || {}, food.serving?.grams || 100, grams);

      if (alloc.calories > 0 && scaled.calories > alloc.calories * maxCalorieMultiplier) {
        continue;
      }

      const score = scorePortion(scaled, alloc, prefs);
      const item = {
        foodId: food._id,
        name: food.name,
        grams,
        scaled,
        score,
        tags: food.tags || [],
        category: food.category || null,
      };

      if (!bestForFood || item.score > bestForFood.score) bestForFood = item;
    }

    if (bestForFood) results.push(bestForFood);
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topN);
}

module.exports = { recommendFoods, scaleNutrients, scorePortion };

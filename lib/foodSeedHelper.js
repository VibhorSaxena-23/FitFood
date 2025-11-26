// lib/foodSeedHelper.js
// Turn a parsed CSV row into a Food document for insertion/upsert.

function safeStr(s) {
  if (!s && s !== 0) return "";
  return String(s).trim();
}

/**
 * @param {Object} row  - { name, category, servingGrams, nutrients, raw }
 * @param {Object} opts - { defaultServingGrams? }
 */
function rowToFoodDoc(row, opts = {}) {
  const defaultServingGrams = opts.defaultServingGrams || 100;
  const name = safeStr(row.name) || "Unknown";
  const category = safeStr(row.category) || "Other";
  const servingGrams = Number(row.servingGrams) || defaultServingGrams;

  const nutrients = row.nutrients || {};
  const calories = Number(nutrients.calories || 0);
  const protein_g = Number(nutrients.protein_g || 0);
  const carbs_g = Number(nutrients.carbs_g || 0);
  const fat_g = Number(nutrients.fat_g || 0);
  const fiber_g = Number(nutrients.fiber_g || 0);
  const sugar_g = Number(nutrients.sugar_g || 0);
  const sodium_mg = Number(nutrients.sodium_mg || 0);
  const cholesterol_mg = Number(nutrients.cholesterol_mg || 0);

  const density_kcal_per_g = servingGrams > 0 ? calories / servingGrams : 0;

  const simpleName = name.replace(/\(.+?\)/g, "").trim();
  const synonyms = [simpleName.toLowerCase()];
  name.split(/[\/,]/).forEach((part) => {
    const trimmed = part.trim();
    if (trimmed && !synonyms.includes(trimmed.toLowerCase())) {
      synonyms.push(trimmed.toLowerCase());
    }
  });

  const tags = [];
  if (protein_g >= 10) tags.push("high-protein");
  if (fat_g <= 5) tags.push("low-fat");
  if (carbs_g <= 10) tags.push("low-carb");
  if (fiber_g >= 3) tags.push("high-fiber");

  // NEW: use Meal_Type (Breakfast/Lunch/…) to tag foods for specific meals
  const raw = row.raw || {};
  const mealTypeRaw =
    raw["Meal_Type"] ||
    raw["meal_type"] ||
    raw["MealType"] ||
    raw["Meal Type"];

  if (mealTypeRaw) {
    const mt = String(mealTypeRaw).trim().toLowerCase();
    let mealTag = null;
    if (mt.startsWith("breakfast")) mealTag = "breakfast";
    else if (mt.startsWith("lunch")) mealTag = "lunch";
    else if (mt.startsWith("dinner")) mealTag = "dinner";
    else if (mt.startsWith("snack")) mealTag = "snacks";

    if (mealTag && !tags.includes(mealTag)) tags.push(mealTag);
  }

  const doc = {
    name,
    category,
    serving: {
      grams: servingGrams,
      label: `${servingGrams} g`,
    },
    nutrients: {
      calories,
      protein_g,
      carbs_g,
      fat_g,
      fiber_g,
      sugar_g,
      sodium_mg,
      cholesterol_mg,
    },
    density_kcal_per_g,
    synonyms,
    tags,
    source: "local-csv",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return doc;
}

module.exports = { rowToFoodDoc };

// lib/csvParser.js
// Parse a CSV like your foods.csv and normalize key names.

const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");

function coerceNumber(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  const s = String(val).trim();
  if (s === "" || s.toLowerCase() === "nan" || s.toLowerCase() === "null") return 0;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * parseCSV
 * @param {string} filePath
 * @returns {Promise<Array<{name,category,servingGrams,nutrients,raw}>>}
 */
async function parseCSV(filePath, options = {}) {
  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  const csvString = await fs.promises.readFile(resolved, { encoding: "utf8" });

  const parseResult = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    ...options,
  });

  const rows = parseResult.data.map((raw) => {
    const normalizeKey = (k) => String(k || "").trim().toLowerCase();
    const keyMap = {};
    Object.keys(raw).forEach((k) => (keyMap[normalizeKey(k)] = k));

    const get = (prefer) => {
      for (const k of prefer) {
        const kLower = k.toLowerCase();
        if (keyMap[kLower]) return raw[keyMap[kLower]];
      }
      return undefined;
    };

    const name = (get(["Food_Item", "Name", "Food", "food"]) || "").toString().trim();
    const category = (get(["Category", "category"]) || "").toString().trim();

    const calories = coerceNumber(get(["Calories (kcal)", "Calories", "calories", "kcal"]));
    const protein_g = coerceNumber(get(["Protein (g)", "Protein", "protein", "protein_g"]));
    const carbs_g = coerceNumber(
      get(["Carbohydrates (g)", "Carbohydrates", "Carbs", "carbs_g", "carbs"])
    );
    const fat_g = coerceNumber(get(["Fat (g)", "Fat", "fat_g"]));
    const fiber_g = coerceNumber(get(["Fiber (g)", "Fiber", "fiber_g"]));
    const sugar_g = coerceNumber(get(["Sugars (g)", "Sugars", "sugar_g", "sugars"]));
    const sodium_mg = coerceNumber(get(["Sodium (mg)", "Sodium", "sodium_mg", "sodium"]));
    const cholesterol_mg = coerceNumber(
      get(["Cholesterol (mg)", "Cholesterol", "cholesterol_mg"])
    );

    const servingStr = get(["Serving Size", "Serving", "serving", "ServingSize"]);
    let servingGrams = 100;
    if (servingStr) {
      const m = String(servingStr).match(/(\d+(?:\.\d+)?)\s*(g|gram|grams)/i);
      if (m) {
        servingGrams = Number(m[1]);
      } else {
        const num = Number(String(servingStr).replace(/[^0-9.]/g, ""));
        if (!Number.isNaN(num) && num > 0) servingGrams = num;
      }
    }

    return {
      name,
      category,
      servingGrams,
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
      raw, // includes Meal_Type and Water_Intake (ml)
    };
  });

  return rows;
}

module.exports = { parseCSV };

// models/FoodLog.js
const mongoose = require("mongoose");

const ComputedNutrientsSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    protein_g: { type: Number, default: 0 },
    carbs_g: { type: Number, default: 0 },
    fat_g: { type: Number, default: 0 },
    fiber_g: { type: Number, default: 0 },
    sugar_g: { type: Number, default: 0 },
    sodium_mg: { type: Number, default: 0 },
    cholesterol_mg: { type: Number, default: 0 },
  },
  { _id: false }
);

const FoodLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    meal: { type: String, enum: ["breakfast", "lunch", "dinner", "snacks"], required: true },
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
    foodName: { type: String, required: true },
    qty: { type: Number, required: true },
    qtyUnit: { type: String, enum: ["g", "serving"], default: "g" },
    servingGrams: { type: Number, default: 100 },
    computedNutrients: { type: ComputedNutrientsSchema, default: () => ({}) },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

FoodLogSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.models.FoodLog || mongoose.model("FoodLog", FoodLogSchema);

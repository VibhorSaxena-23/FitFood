// models/Food.js
const mongoose = require("mongoose");

const NutrientsSchema = new mongoose.Schema(
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

const ServingSchema = new mongoose.Schema(
  {
    grams: { type: Number, required: true, default: 100 },
    label: { type: String, default: "100 g" },
  },
  { _id: false }
);

const FoodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, index: true, trim: true },
    synonyms: { type: [String], default: [] },
    brand: { type: String, default: null },
    serving: { type: ServingSchema, default: () => ({ grams: 100, label: "100 g" }) },
    nutrients: { type: NutrientsSchema, default: () => ({}) },
    density_kcal_per_g: { type: Number, default: null },
    tags: { type: [String], index: true, default: [] },
    source: { type: String, default: "local-csv" },
  },
  { timestamps: true }
);

FoodSchema.index({ name: "text", synonyms: "text" });
FoodSchema.index({ category: 1, tags: 1 });

FoodSchema.pre("save", function (next) {
  if (!this.density_kcal_per_g) {
    const grams = this.serving && this.serving.grams ? this.serving.grams : 100;
    const cals = this.nutrients && this.nutrients.calories ? this.nutrients.calories : 0;
    this.density_kcal_per_g = grams > 0 ? cals / grams : 0;
  }
  next();
});

module.exports = mongoose.models.Food || mongoose.model("Food", FoodSchema);

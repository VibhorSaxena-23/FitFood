// models/User.js
const mongoose = require("mongoose");

const GoalsSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 2000 },
    protein_g: { type: Number, default: 100 },
    carbs_g: { type: Number, default: 250 },
    fat_g: { type: Number, default: 70 },
    fiber_g: { type: Number, default: 25 },
  },
  { _id: false }
);

const MealRatiosSchema = new mongoose.Schema(
  {
    breakfast: { type: Number, default: 1 },
    lunch: { type: Number, default: 2 },
    dinner: { type: Number, default: 2 },
    snacks: { type: Number, default: 1 },
  },
  { _id: false }
);

const PreferencesSchema = new mongoose.Schema(
  {
    vegetarian: { type: Boolean, default: false },
    allergies: { type: [String], default: [] },
    dislikes: { type: [String], default: [] },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    email: { type: String, required: true, unique: true, index: true },
    goals: { type: GoalsSchema, default: () => ({}) },
    mealRatios: { type: MealRatiosSchema, default: () => ({}) },
    preferences: { type: PreferencesSchema, default: () => ({}) },
    timezone: { type: String, default: "UTC" },
    favorites: { type: [mongoose.Schema.Types.ObjectId], ref: "Food", default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);

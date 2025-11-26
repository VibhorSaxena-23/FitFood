// scripts/testRecommend.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const { connectToDB } = require(path.resolve(__dirname, "../lib/mongodb"));
const User = require(path.resolve(__dirname, "../models/User"));
const Food = require(path.resolve(__dirname, "../models/Food"));
const FoodLog = require(path.resolve(__dirname, "../models/FoodLog"));
const { allocateForMeal } = require(path.resolve(__dirname, "../lib/allocation"));
const { recommendFoods } = require(path.resolve(__dirname, "../lib/calculate"));

async function run(userId, meal, date) {
  try {
    await connectToDB();
    console.log("Connected to DB");

    const user = await User.findById(userId).lean();
    console.log("User:", user ? "FOUND" : "NOT FOUND");
    if (!user) return;

    const logs = await FoodLog.find({ userId, date }).lean();
    console.log("Food logs:", logs.length);

    const consumed = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
    const loggedMeals = [];
    for (const l of logs) {
      const n = l.computedNutrients || {};
      consumed.calories += Number(n.calories || 0);
      consumed.protein_g += Number(n.protein_g || 0);
      consumed.carbs_g += Number(n.carbs_g || 0);
      consumed.fat_g += Number(n.fat_g || 0);
      consumed.fiber_g += Number(n.fiber_g || 0);
      if (l.meal && !loggedMeals.includes(l.meal)) loggedMeals.push(l.meal);
    }
    console.log("Consumed:", consumed);

    const alloc = allocateForMeal(
      user.goals || {},
      consumed,
      user.mealRatios || { breakfast: 1, lunch: 2, dinner: 2, snacks: 1 },
      meal,
      loggedMeals,
      { safetyCap: 0.8 }
    );
    console.log("Meal allocation:", alloc);

    const candidates = await Food.find({}).limit(800).lean();
    console.log("Candidates:", candidates.length);

    console.log("Running recommendation engine...");
    const recs = await recommendFoods({
      user,
      alloc,
      candidateFoods: candidates,
      portionOptions: [50, 75, 100, 150],
      topN: 40,
      maxCalorieMultiplier: 1.3,
    });

    if (!Array.isArray(recs)) {
      console.error("❌ recommendFoods did NOT return an array:", recs);
      process.exit(1);
    }

    console.log("\nSUCCESS!");
    console.log("Recommendations:", recs.length);
    console.log(recs.slice(0, 5));
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.length < 3) {
  console.error("Usage: node scripts/testRecommend.js <userId> <meal> <date>");
  process.exit(1);
}

run(args[0], args[1], args[2]);

// app/api/logs/route.js
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Food from "@/models/Food";
import FoodLog from "@/models/FoodLog";
import Recommendation from "@/models/Recommendation";

const VALID_MEALS = ["breakfast", "lunch", "dinner", "snacks"];

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const date = url.searchParams.get("date");

    if (!userId || !date) {
      return NextResponse.json(
        { success: false, message: "Missing userId or date" },
        { status: 400 }
      );
    }

    await connectToDB();

    const logs = await FoodLog.find({ userId, date }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({ success: true, logs });
  } catch (err) {
    console.error("[/api/logs GET] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, date, meal, foodId } = body || {};
    let { qty, qtyUnit = "g", notes = "" } = body || {};

    if (!userId || !date || !meal || !foodId || qty === undefined || qty === null) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const mealLower = String(meal).toLowerCase();
    if (!VALID_MEALS.includes(mealLower)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid meal. Expected one of: ${VALID_MEALS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    qtyUnit = String(qtyUnit || "g").toLowerCase();
    if (!["g", "serving"].includes(qtyUnit)) {
      return NextResponse.json(
        { success: false, message: "Invalid qtyUnit. Use 'g' or 'serving'." },
        { status: 400 }
      );
    }

    qty = Number(qty);
    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid qty (must be a positive number)" },
        { status: 400 }
      );
    }

    await connectToDB();

    const food = await Food.findById(foodId).lean();
    if (!food) {
      return NextResponse.json(
        { success: false, message: "Food not found" },
        { status: 404 }
      );
    }

    let grams = qty;
    if (qtyUnit === "serving") {
      const servingGrams =
        food.serving && Number(food.serving.grams)
          ? Number(food.serving.grams)
          : 100;
      grams = qty * servingGrams;
    }

    const baseServing =
      food.serving && Number(food.serving.grams)
        ? Number(food.serving.grams)
        : 100;
    const scaleFactor = baseServing > 0 ? grams / baseServing : 0;
    const n = food.nutrients || {};
    const computedNutrients = {
      calories: Number((n.calories || 0) * scaleFactor),
      protein_g: Number((n.protein_g || 0) * scaleFactor),
      carbs_g: Number((n.carbs_g || 0) * scaleFactor),
      fat_g: Number((n.fat_g || 0) * scaleFactor),
      fiber_g: Number((n.fiber_g || 0) * scaleFactor),
      sugar_g: Number((n.sugar_g || 0) * scaleFactor),
      sodium_mg: Number((n.sodium_mg || 0) * scaleFactor),
      cholesterol_mg: Number((n.cholesterol_mg || 0) * scaleFactor),
    };

    const doc = {
      userId,
      date,
      meal: mealLower,
      foodId,
      foodName: food.name,
      qty: Number(qty),
      qtyUnit,
      servingGrams: baseServing,
      computedNutrients,
      notes,
    };

    const log = await FoodLog.create(doc);

    try {
      if (Recommendation) {
        await Recommendation.findOneAndUpdate(
          { userId, date, meal: mealLower, "recommendations.foodId": foodId },
          {
            $set: {
              "recommendations.$.accepted": true,
              "recommendations.$.acceptedAt": new Date(),
            },
          },
          { sort: { createdAt: -1 } }
        ).lean();
      }
    } catch (err) {
      console.error("[/api/logs POST] Could not mark recommendation as accepted:", err);
    }

    return NextResponse.json({
      success: true,
      log: log.toObject ? log.toObject() : log,
    });
  } catch (err) {
    console.error("[/api/logs POST] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

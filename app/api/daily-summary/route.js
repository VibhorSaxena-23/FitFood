// app/api/daily-summary/route.js
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/models/User";
import FoodLog from "@/models/FoodLog";
import { DEFAULT_DAILY_GOALS, MEAL_ORDER } from "@/utils/constants";

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

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const logs = await FoodLog.find({ userId, date }).lean();

    const consumed = {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
    };

    const perMeal = {};
    (MEAL_ORDER || ["breakfast", "lunch", "dinner", "snacks"]).forEach((m) => {
      perMeal[m] = [];
    });

    for (const l of logs) {
      const n = l.computedNutrients || {};
      consumed.calories += Number(n.calories || 0);
      consumed.protein_g += Number(n.protein_g || 0);
      consumed.carbs_g += Number(n.carbs_g || 0);
      consumed.fat_g += Number(n.fat_g || 0);
      consumed.fiber_g += Number(n.fiber_g || 0);

      const meal = (l.meal || "").toLowerCase();
      if (perMeal[meal]) perMeal[meal].push(l);
    }

    const userGoals = user.goals || {};
    const targets = {
      calories: Number(userGoals.calories ?? DEFAULT_DAILY_GOALS.calories ?? 2000),
      protein_g: Number(userGoals.protein_g ?? DEFAULT_DAILY_GOALS.protein_g ?? 100),
      carbs_g: Number(userGoals.carbs_g ?? DEFAULT_DAILY_GOALS.carbs_g ?? 250),
      fat_g: Number(userGoals.fat_g ?? DEFAULT_DAILY_GOALS.fat_g ?? 70),
      fiber_g: Number(userGoals.fiber_g ?? DEFAULT_DAILY_GOALS.fiber_g ?? 25),
    };

    const remaining = {
      calories: Math.max(0, targets.calories - consumed.calories),
      protein_g: Math.max(0, targets.protein_g - consumed.protein_g),
      carbs_g: Math.max(0, targets.carbs_g - consumed.carbs_g),
      fat_g: Math.max(0, targets.fat_g - consumed.fat_g),
      fiber_g: Math.max(0, targets.fiber_g - consumed.fiber_g),
    };

    return NextResponse.json({
      success: true,
      targets,
      consumed,
      remaining,
      perMeal,
      logs,
    });
  } catch (err) {
    console.error("[/api/daily-summary] Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}

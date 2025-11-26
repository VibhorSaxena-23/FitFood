// app/api/recommend/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/models/User";
import FoodLog from "@/models/FoodLog";
import Food from "@/models/Food";
import Recommendation from "@/models/Recommendation";
import { allocateForMeal } from "@/lib/allocation";
import { recommendFoods } from "@/lib/calculate";
import {
  DEFAULT_MEAL_RATIOS,
  PORTION_OPTIONS,
  TOP_RECOMMENDATION_COUNT,
} from "@/utils/constants";

const VALID_MEALS = ["breakfast", "lunch", "dinner", "snacks"] as const;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const mealRaw = (url.searchParams.get("meal") || "").toLowerCase();
    const date = url.searchParams.get("date");

    if (!userId || !mealRaw || !date) {
      return NextResponse.json(
        { success: false, message: "Missing userId, meal, or date" },
        { status: 400 }
      );
    }

    const meal = mealRaw as (typeof VALID_MEALS)[number];
    if (!VALID_MEALS.includes(meal)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid meal, expected one of: ${VALID_MEALS.join(", ")}`,
        },
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

    // Aggregate today’s logs
    const logs = await FoodLog.find({ userId, date }).lean();
    const consumed = {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
    };
    const loggedMeals = new Set<string>();

    for (const l of logs) {
      const n = l.computedNutrients || {};
      consumed.calories += Number(n.calories || 0);
      consumed.protein_g += Number(n.protein_g || 0);
      consumed.carbs_g += Number(n.carbs_g || 0);
      consumed.fat_g += Number(n.fat_g || 0);
      consumed.fiber_g += Number(n.fiber_g || 0);
      if (l.meal) loggedMeals.add(String(l.meal).toLowerCase());
    }

    // Allocation for this meal
    const alloc = allocateForMeal(
      user.goals || {},
      consumed,
      user.mealRatios || (DEFAULT_MEAL_RATIOS as any),
      meal,
      Array.from(loggedMeals),
      { safetyCap: 0.8 }
    );

    // Build candidate food set
    const proteinDeficit = Math.max(
      0,
      (user.goals?.protein_g || 0) - (consumed.protein_g || 0)
    );

    const mealTagQuery = { tags: { $in: [meal] } };
    const highProtQuery = { tags: { $in: ["high-protein"] } };

    const MAX_PRIMARY = 400;
    const MAX_FALLBACK = 800;

    let candidateFoods: any[] = [];

    try {
      if (proteinDeficit >= 15) {
        candidateFoods = await Food.find({
          $or: [mealTagQuery, highProtQuery],
        })
          .limit(MAX_PRIMARY)
          .lean();
      } else {
        candidateFoods = await Food.find(mealTagQuery)
          .limit(MAX_PRIMARY)
          .lean();
      }
    } catch (err) {
      console.warn(
        "[/api/recommend] candidate query failed, falling back:",
        err
      );
      candidateFoods = [];
    }

    if (!candidateFoods || candidateFoods.length < 80) {
      candidateFoods = await Food.find({}).limit(MAX_FALLBACK).lean();
    }

    // Run recommendation engine
    const recs = await recommendFoods({
      user,
      alloc,
      candidateFoods,
      portionOptions: PORTION_OPTIONS,
      topN: TOP_RECOMMENDATION_COUNT,
      maxCalorieMultiplier: 1.3,
    });

    // Save recommendation snapshot (best-effort)
    try {
      await Recommendation.create({
        userId: user._id,
        date,
        meal,
        modelVersion: "heuristic-v1",
        alloc,
        recommendations: recs.map((r: any) => ({
          foodId: r.foodId,
          name: r.name,
          grams: r.grams,
          scaled: r.scaled || {},
          score: r.score,
          tags: r.tags || [],
          category: r.category || null,
          portion: r.grams,
        })),
        candidateCount: candidateFoods.length,
        exampleImageUrl: "/images/recommendation-example.png",
        createdAt: new Date(),
      });
    } catch (err) {
      console.error("[/api/recommend] Could not persist recommendations:", err);
    }

    return NextResponse.json({
      success: true,
      alloc,
      recommendations: recs,
      consumed,
    });
  } catch (err: any) {
    console.error("[/api/recommend] Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}

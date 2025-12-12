// app/api/user/route.js
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/models/User";
import { DEFAULT_DAILY_GOALS } from "@/utils/constants";

/** Convert input to a valid positive number or null */
function toValidNumber(x) {
  // handle undefined/null/""
  if (x === undefined || x === null || x === "") return null;

  const n = typeof x === "string" ? Number(x) : x;
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Compute daily calorie + macro goals from profile data */
function computeGoalsFromProfile(profile) {
  const w = toValidNumber(profile?.weight_kg);
  const h = toValidNumber(profile?.height_cm);
  const a = toValidNumber(profile?.age);

  const sex = profile?.sex || "other";
  const activityLevel = profile?.activityLevel || "light";

  // If core fields are missing, fallback to defaults
  if (!w || !h || !a) return { ...DEFAULT_DAILY_GOALS };

  // ---- BMR (Mifflin-St Jeor) ----
  let s = 0;
  if (sex === "male") s = 5;
  else if (sex === "female") s = -161;

  const BMR = 10 * w + 6.25 * h - 5 * a + s;

  // ---- Activity factor ----
  const factors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9,
  };
  const factor = factors[activityLevel] || factors.light;

  const calories = Math.round(BMR * factor);

  // ---- Simple macro split ----
  // protein: 1.6 g/kg, fat: 0.8 g/kg, carbs = rest
  const protein_g = Math.round(w * 1.6);
  const fat_g = Math.round(w * 0.8);

  const cal_from_protein = protein_g * 4;
  const cal_from_fat = fat_g * 9;
  const remainingCal = Math.max(0, calories - cal_from_protein - cal_from_fat);
  const carbs_g = Math.round(remainingCal / 4);

  return {
    calories,
    protein_g,
    carbs_g,
    fat_g,
    fiber_g: 25,
  };
}

/** GET /api/user?userId=... */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Missing userId" },
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

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile || {},
        goals: user.goals || DEFAULT_DAILY_GOALS,
      },
    });
  } catch (err) {
    console.error("[/api/user GET] Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}

/** POST /api/user – update profile + recalc goals */
export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, profile } = body || {};

    if (!userId || !profile) {
      return NextResponse.json(
        { success: false, message: "Missing userId or profile" },
        { status: 400 }
      );
    }

    await connectToDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // sanitize inputs so "" doesn't break calculations
    const nextProfile = {
      ...(user.profile || {}),
      weight_kg: toValidNumber(profile.weight_kg) ?? user.profile?.weight_kg ?? null,
      height_cm: toValidNumber(profile.height_cm) ?? user.profile?.height_cm ?? null,
      age: toValidNumber(profile.age) ?? user.profile?.age ?? null,
      sex: profile.sex || user.profile?.sex || "other",
      activityLevel: profile.activityLevel || user.profile?.activityLevel || "light",
    };

    user.profile = nextProfile;

    // recompute goals from updated profile
    const newGoals = computeGoalsFromProfile(user.profile);

    const existingGoals =
      typeof user.goals?.toObject === "function" ? user.goals.toObject() : user.goals || {};

    user.goals = { ...existingGoals, ...newGoals };

    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        profile: user.profile,
        goals: user.goals,
      },
    });
  } catch (err) {
    console.error("[/api/user POST] Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}

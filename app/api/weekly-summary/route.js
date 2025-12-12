import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/models/User";
import FoodLog from "@/models/FoodLog";
import { DEFAULT_DAILY_GOALS } from "@/utils/constants";

function toISODate(d) {
  // YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISODate(dateStr) {
  // interpret as local date; keep stable by building a Date at noon
  // (avoids DST edge cases)
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const endDateStr = url.searchParams.get("endDate"); // YYYY-MM-DD

    if (!userId || !endDateStr) {
      return NextResponse.json(
        { success: false, message: "Missing userId or endDate" },
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

    const goalCalories =
      user?.goals?.calories ?? DEFAULT_DAILY_GOALS.calories ?? 2000;

    // build last 7 dates (inclusive endDate)
    const end = parseISODate(endDateStr);
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      dates.push(toISODate(d));
    }

    // fetch logs for the window
    const logs = await FoodLog.find({
      userId,
      date: { $in: dates },
    }).lean();

    // sum calories by date
    const totalsByDate = Object.fromEntries(dates.map((d) => [d, 0]));

    for (const l of logs) {
      const c = Number(l?.computedNutrients?.calories || 0);
      if (totalsByDate[l.date] !== undefined) totalsByDate[l.date] += c;
    }

    const days = dates.map((d) => ({
      date: d,
      calories: Math.round(totalsByDate[d] || 0),
      goal: Math.round(goalCalories),
    }));

    const total = days.reduce((acc, x) => acc + x.calories, 0);
    const avg = days.length ? total / days.length : 0;

    return NextResponse.json({
      success: true,
      goalCalories: Math.round(goalCalories),
      days,
      averageCalories: Math.round(avg),
    });
  } catch (err) {
    console.error("[/api/weekly-summary] Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}

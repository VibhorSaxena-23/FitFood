// app/api/foods/route.js
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Food from "@/models/Food";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const rawSearch = (url.searchParams.get("search") || "").trim();
    const category = (url.searchParams.get("category") || "").trim();
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(200, Math.max(5, Number(url.searchParams.get("limit") || 50)));
    const skip = (page - 1) * limit;

    await connectToDB();

    const filter = {};
    if (category) filter.category = category;

    let foods = [];
    let total = 0;

    if (rawSearch) {
      try {
        const q = { ...filter, $text: { $search: rawSearch } };
        foods = await Food.find(q, { score: { $meta: "textScore" } })
          .sort({ score: { $meta: "textScore" } })
          .skip(skip)
          .limit(limit)
          .lean();
        total = await Food.countDocuments(q);
      } catch {
        const esc = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(esc, "i");
        const q = {
          ...filter,
          $or: [{ name: regex }, { synonyms: regex }, { category: regex }],
        };
        foods = await Food.find(q).skip(skip).limit(limit).lean();
        total = await Food.countDocuments(q);
      }
    } else {
      const q = { ...filter };
      foods = await Food.find(q).skip(skip).limit(limit).lean();
      total = await Food.countDocuments(q);
    }

    return NextResponse.json({ success: true, foods, page, limit, total });
  } catch (err) {
    console.error("[/api/foods] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

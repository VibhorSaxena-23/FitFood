// app/api/logs/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import FoodLog from "@/models/FoodLog";

export async function DELETE(req, context) {
  try {
    // 👇 In your Next version, context.params is a Promise
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing id" },
        { status: 400 }
      );
    }

    await connectToDB();

    const deleted = await FoodLog.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("[/api/logs/[id]] Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}

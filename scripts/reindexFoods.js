#!/usr/bin/env node
// scripts/reindexFoods.js
// Create or rebuild indexes for the Food collection.

const mongoose = require("mongoose");
const { connectToDB } = require("../lib/mongodb");
const Food = require("../models/Food");

async function reindex() {
  console.log("[reindexFoods] Connecting to MongoDB...");
  await connectToDB();
  console.log("[reindexFoods] Connected.");

  try {
    console.log("[reindexFoods] Ensuring text index on { name, synonyms }");
    await Food.collection.createIndex(
      { name: "text", synonyms: "text" },
      { name: "food_text_index", default_language: "english" }
    );

    console.log("[reindexFoods] Ensuring indexes on category and tags");
    await Food.collection.createIndex({ category: 1 }, { name: "idx_category" });
    await Food.collection.createIndex({ tags: 1 }, { name: "idx_tags" });

    const count = await Food.countDocuments();
    console.log(`[reindexFoods] Food collection document count: ${count}`);

    console.log("[reindexFoods] Reindex complete.");
  } catch (err) {
    console.error("[reindexFoods] Error while indexing:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

reindex().catch((err) => {
  console.error("[reindexFoods] Unhandled error:", err);
  process.exit(1);
});

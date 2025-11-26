#!/usr/bin/env node
// scripts/seedFoods.js
// Usage: node scripts/seedFoods.js [path/to/csv] (defaults to data/foods.csv)

const path = require("path");
const fs = require("fs");
const Papa = require("papaparse");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const { connectToDB } = require(path.resolve(__dirname, "../lib/mongodb"));
const { parseCSV } = require(path.resolve(__dirname, "../lib/csvParser"));
const { rowToFoodDoc } = require(path.resolve(__dirname, "../lib/foodSeedHelper"));
const mongoose = require("mongoose");
const Food = require(path.resolve(__dirname, "../models/Food"));

async function seed(csvPath) {
  console.log("[seedFoods] Starting seed process...");
  await connectToDB();
  console.log("[seedFoods] Connected to MongoDB");

  const resolvedPath = csvPath
    ? path.isAbsolute(csvPath)
      ? csvPath
      : path.resolve(process.cwd(), csvPath)
    : path.resolve(process.cwd(), "data/foods.csv");

  if (!fs.existsSync(resolvedPath)) {
    console.error(`[seedFoods] CSV file not found at: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`[seedFoods] Parsing CSV at: ${resolvedPath}`);
  let rows;
  try {
    if (typeof parseCSV === "function") {
      rows = await parseCSV(resolvedPath);
    } else {
      const csvString = fs.readFileSync(resolvedPath, "utf8");
      const parsed = Papa.parse(csvString, { header: true, skipEmptyLines: true });
      rows = parsed.data;
    }
  } catch (err) {
    console.error("[seedFoods] CSV parse error:", err);
    process.exit(1);
  }

  console.log(`[seedFoods] Parsed ${rows.length} rows. Building upsert operations...`);

  const bulkOps = [];
  let skipped = 0;

  for (const rawRow of rows) {
    try {
      const doc = rowToFoodDoc(rawRow);
      if (!doc.name || doc.name.trim() === "") {
        skipped++;
        continue;
      }

      const filter = {
        name: doc.name,
        "serving.grams": doc.serving?.grams || 100,
        category: doc.category || "Other",
      };

      const update = {
        $set: {
          name: doc.name,
          category: doc.category,
          serving: doc.serving,
          nutrients: doc.nutrients,
          density_kcal_per_g: doc.density_kcal_per_g,
          synonyms: doc.synonyms,
          tags: doc.tags,
          source: doc.source,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      };

      bulkOps.push({ updateOne: { filter, update, upsert: true } });
    } catch (err) {
      console.warn(
        "[seedFoods] Skipping a row due to error:",
        err && err.message ? err.message : err
      );
      skipped++;
    }
  }

  console.log(
    `[seedFoods] Prepared ${bulkOps.length} bulk operations; skipped ${skipped} rows.`
  );

  if (!bulkOps.length) {
    console.log("[seedFoods] Nothing to insert. Exiting.");
    await mongoose.connection.close();
    process.exit(0);
  }

  const BATCH_SIZE = 1000;
  let processed = 0;
  while (processed < bulkOps.length) {
    const batch = bulkOps.slice(processed, processed + BATCH_SIZE);
    console.log(
      `[seedFoods] Executing batch ${
        Math.floor(processed / BATCH_SIZE) + 1
      } (ops ${processed + 1}-${processed + batch.length})`
    );
    const res = await Food.bulkWrite(batch, { ordered: false }).catch((err) => {
      console.error("[seedFoods] bulkWrite error:", err);
      throw err;
    });

    console.log(
      `[seedFoods] Batch result: inserted/upserted=${res.upsertedCount || 0}, modified=${
        res.modifiedCount || 0
      }, matched=${res.matchedCount || 0}`
    );
    processed += batch.length;
  }

  console.log("[seedFoods] Seed completed successfully.");
  await mongoose.connection.close();
  process.exit(0);
}

(async () => {
  try {
    const arg = process.argv[2];
    const csvPath = arg || path.resolve(__dirname, "../data/foods.csv");
    await seed(csvPath);
  } catch (err) {
    console.error("[seedFoods] Fatal error:", err);
    process.exit(1);
  }
})();

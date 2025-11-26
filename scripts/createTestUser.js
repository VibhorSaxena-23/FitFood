// scripts/createTestUser.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
const { connectToDB } = require(path.resolve(__dirname, "../lib/mongodb"));
const User = require(path.resolve(__dirname, "../models/User"));

async function main() {
  await connectToDB();
  const u = await User.create({
    name: "Test User",
    email: `test+${Date.now()}@example.com`,
    goals: { calories: 2000, protein_g: 120, carbs_g: 250, fat_g: 70, fiber_g: 30 },
    mealRatios: { breakfast: 1, lunch: 2, dinner: 2, snacks: 1 },
    preferences: {},
  });
  console.log("created userId:", u._id.toString());
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

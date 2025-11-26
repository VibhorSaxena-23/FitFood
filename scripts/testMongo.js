// scripts/testMongo.js
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env.local"),
});

const { connectToDB } = require(path.resolve(__dirname, "../lib/mongodb"));

async function main() {
  try {
    await connectToDB();
    console.log("Connected successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Connection failed:", err);
    process.exit(1);
  }
}

main();

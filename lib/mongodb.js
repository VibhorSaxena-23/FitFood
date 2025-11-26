// lib/mongodb.js
// Robust Mongoose connection helper for Next.js routes + Node scripts.

const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error("Missing MONGO_URI in environment variables");
}

let cached = global._mongooseCache || (global._mongooseCache = { conn: null, promise: null });

async function connectToDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(MONGO_URI, opts).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = { connectToDB };

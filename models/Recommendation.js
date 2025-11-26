// models/Recommendation.js
const mongoose = require("mongoose");

const RecommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  date: { type: String, required: true },
  meal: { type: String, required: true, enum: ["breakfast", "lunch", "dinner", "snacks"] },
  modelVersion: { type: String, default: "heuristic-v1" },
  alloc: { type: Object, default: {} },
  recommendations: [
    {
      foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
      name: String,
      grams: Number,
      scaled: { type: Object, default: {} },
      score: Number,
      tags: [String],
      category: String,
      portion: Number,
      accepted: { type: Boolean, default: false },
      acceptedAt: { type: Date },
    },
  ],
  candidateCount: { type: Number, default: 0 },
  exampleImageUrl: { type: String, default: "" },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() },
});

RecommendationSchema.index({ userId: 1, date: 1, meal: 1 });

module.exports =
  mongoose.models?.Recommendation || mongoose.model("Recommendation", RecommendationSchema);

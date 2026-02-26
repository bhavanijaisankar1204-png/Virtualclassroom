const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema({
  studentName: String,
  quizTitle: String,
  score: Number,
  total: Number,
  submittedAt: String,
});

module.exports = mongoose.model("QuizResult", quizResultSchema);
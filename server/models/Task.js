const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  title: String,
  type: String,
  deadline: String,
  duration: Number,

  questions: [
    {
      question: String,
      options: [String],
      correct: Number
    }
  ],

  createdAt: String
});

module.exports = mongoose.model("Task", TaskSchema);
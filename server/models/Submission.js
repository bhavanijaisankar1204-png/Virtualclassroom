const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  taskId: String,
  taskTitle: String,
  studentName: String,
  fileName: String,
  submittedAt: String,
});

module.exports = mongoose.model("Submission", submissionSchema);
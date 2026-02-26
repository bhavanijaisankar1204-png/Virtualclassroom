require("dotenv").config();
const connectDB = require("./config/db");

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Task = require("./models/Task");
const Submission = require("./models/Submission");
const QuizResult = require("./models/QuizResult");


/* ================= APP SETUP ================= */
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://192.168.1.25:5173"],
    methods: ["GET", "POST"],
  },
});

/* ================= FILE UPLOAD ================= */
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  res.json({
    fileName: req.file.filename,
    originalName: req.file.originalname,
  });
});

app.get("/download/:filename", (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send("File not found");
  res.download(filePath);
});

/* ================= SOCKET.IO ================= */
io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  socket.on("teacher-joined-room", (roomId) => {
    socket.join(roomId);
    console.log("👩‍🏫 Teacher joined room:", roomId);
  });

  /* ---------- TASKS ---------- */
  socket.on("get-tasks", async () => {
    const tasks = await Task.find();
    socket.emit("all-tasks", tasks);
  });

  socket.on("add-task", async (task) => {
    const newTask = new Task({
      ...task,
      createdAt: new Date().toLocaleString(),
    });

    await newTask.save();

    const tasks = await Task.find();
    io.emit("all-tasks", tasks);
  });

  socket.on("delete-task", async (taskId) => {
    await Task.findByIdAndDelete(taskId);

    const tasks = await Task.find();
    io.emit("all-tasks", tasks);
  });

  /* ---------- ASSIGNMENT SUBMISSIONS ---------- */
  socket.on("submit-task", async (data) => {
    const submission = new Submission({
      ...data,
      submittedAt: new Date().toLocaleString(),
    });

    await submission.save();

    const submissions = await Submission.find();
    io.emit("all-submissions", submissions);
  });

  socket.on("get-submissions", async () => {
    const submissions = await Submission.find();
    socket.emit("all-submissions", submissions);
  });

  socket.on("delete-submission", async ({ taskId, studentName }) => {
    await Submission.deleteOne({ taskId, studentName });

    const submissions = await Submission.find();
    io.emit("all-submissions", submissions);
  });

  /* ---------- QUIZ RESULTS ---------- */
  socket.on("quiz-result", async (data) => {
    const result = new QuizResult({
      ...data,
      submittedAt: new Date().toLocaleString(),
    });

    await result.save();

    const results = await QuizResult.find();
    io.emit("all-quiz-results", results);
  });

  socket.on("get-quiz-results", async () => {
    const results = await QuizResult.find();
    socket.emit("all-quiz-results", results);
  });

  /* ---------- LIVE CLASS ---------- */
  socket.on("create-room", () => {
    const roomId = Math.random().toString(36).substring(2, 8);
    socket.join(roomId);
    socket.emit("room-created", roomId);
  });

  socket.on("join-request", ({ roomId, studentName }) => {
    socket.to(roomId).emit("student-requested", {
      studentName,
      socketId: socket.id,
    });
  });

  socket.on("approve-student", ({ studentSocketId, roomId }) => {
    io.sockets.sockets.get(studentSocketId)?.join(roomId);
    io.to(studentSocketId).emit("join-approved", roomId);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

/* ================= START SERVER ================= */

const startServer = async () => {
  try {
    await connectDB();   // 🔥 VERY IMPORTANT

    server.listen(5000, "0.0.0.0", () => {
      console.log("🚀 Server running on network at port 5000");
    });

  } catch (error) {
    console.error("Server failed to start:", error);
  }
};

startServer();
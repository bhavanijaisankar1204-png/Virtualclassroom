
require("dotenv").config();
const connectDB = require("./config/db");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
connectDB();
/* ================= APP ================= */
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

/* ================= STORAGE ================= */
const UPLOAD_DIR = path.join(__dirname, "uploads");
const DATA_DIR = path.join(__dirname, "data");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

/* ================= HELPERS ================= */
const readData = (file) => {
  const p = path.join(DATA_DIR, file);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : [];
};

const writeData = (file, data) => {
  fs.writeFileSync(
    path.join(DATA_DIR, file),
    JSON.stringify(data, null, 2)
  );
};

/* ================= DATA ================= */
let tasks = readData("tasks.json");
let submissions = readData("submissions.json");
let quizResults = readData("quizResults.json");

/* ================= LIVE ROOMS ================= */
const rooms = {};

/* ================= FILE UPLOAD ================= */
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ fileName: req.file.filename });
});

/* ================= SOCKET ================= */
io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  

  /* ===== STUDENT SENDS JOIN REQUEST ===== */
socket.on("join-request", ({ roomId, studentName }) => {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      teacher: null,
      users: {},
      pending: []
    };
  }

  socket.roomId = roomId;

  const requestData = {
    socketId: socket.id,
    studentName,
  };

  const teacherId = rooms[roomId].teacher;

  if (teacherId) {
    io.to(teacherId).emit("student-requested", requestData);
  } else {
    // 🔥 store request if teacher not joined yet
    rooms[roomId].pending.push(requestData);
  }
});

  /* ===== JOIN ROOM (AFTER APPROVAL) ===== */
 socket.on("join-room", ({ roomId, user }) => {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      teacher: null,
      users: {},
      pending: []   // store pending students
    };
  }

  if (user.role === "teacher") {
    rooms[roomId].teacher = socket.id;
  }

  rooms[roomId].users[socket.id] = {
    ...user,
    approved: true,
  };

  socket.roomId = roomId;
  socket.join(roomId);

  console.log(`${user.role} joined room ${roomId}`);

  /* 🔥 SEND PENDING REQUESTS TO TEACHER */
  if (user.role === "teacher") {
    rooms[roomId].pending.forEach((student) => {
      io.to(socket.id).emit("student-requested", student);
    });
  }

  socket.to(roomId).emit("user-joined", {
    socketId: socket.id,
    user,
  });
});

  /* ===== APPROVE STUDENT ===== */
  socket.on("approve-student", ({ studentSocketId, roomId }) => {
    if (!rooms[roomId]) return;

    console.log(`Student ${studentSocketId} approved`);

    // Notify only student
    io.to(studentSocketId).emit("approved");
  });

  /* ===== WEBRTC SIGNALING ===== */
  socket.on("webrtc-offer", ({ to, offer }) => {
    io.to(to).emit("webrtc-offer", {
      from: socket.id,
      offer,
    });
  });

  socket.on("webrtc-answer", ({ to, answer }) => {
    io.to(to).emit("webrtc-answer", {
      from: socket.id,
      answer,
    });
  });

  socket.on("webrtc-ice", ({ to, candidate }) => {
    io.to(to).emit("webrtc-ice", {
      from: socket.id,
      candidate,
    });
  });

  /* ===== TEACHER CONTROLS ===== */
  socket.on("mute-student", (studentId) => {
    io.to(studentId).emit("force-mute");
  });

  socket.on("kick-student", (studentId) => {
    io.to(studentId).emit("force-kick");

    if (rooms[socket.roomId]) {
      delete rooms[socket.roomId].users[studentId];
    }

    io.to(socket.roomId).emit("user-left", studentId);
  });

  /* ===== TASKS ===== */
  socket.on("get-tasks", () => {
    socket.emit("all-tasks", tasks);
  });

  socket.on("add-task", (task) => {
    tasks.push(task);
    writeData("tasks.json", tasks);
    io.emit("all-tasks", tasks);
  });

  socket.on("delete-task", (id) => {
    tasks = tasks.filter((t) => t.id !== id);
    writeData("tasks.json", tasks);
    io.emit("all-tasks", tasks);
  });

  /* ===== SUBMISSIONS ===== */
  socket.on("submit-task", (data) => {
    submissions.push({
      ...data,
      submittedAt: new Date().toLocaleString(),
    });
    writeData("submissions.json", submissions);
    io.emit("all-submissions", submissions);
  });

  socket.on("get-submissions", () => {
    socket.emit("all-submissions", submissions);
  });

  /* ===== QUIZ ===== */
  /* ===== QUIZ ===== */
socket.on("quiz-result", (data) => {
  const newResult = {
    id: Date.now(),   // 🔥 REQUIRED for delete
    ...data,
    submittedAt: new Date().toLocaleString(),
  };

  quizResults.push(newResult);
  writeData("quizResults.json", quizResults);

  io.emit("all-quiz-results", quizResults);  // 🔥 update everyone
});

  socket.on("get-quiz-results", () => {
    socket.emit("all-quiz-results", quizResults);
  });
  /* ===== DELETE QUIZ RESULT ===== */
socket.on("delete-quiz-result", (id) => {
  quizResults = quizResults.filter((q) => q.id !== id);
  writeData("quizResults.json", quizResults);
  io.emit("all-quiz-results", quizResults);
});

  /* ===== PROCTORING ===== */

// Create storage if not exists
let proctorLogs = readData("proctorLogs.json");

socket.on("cheating-detected", (data) => {
  const log = {
    studentId: socket.id,
    roomId: socket.roomId,
    type: data.type,
    warningCount: data.warningCount,
    time: new Date().toLocaleString(),
  };

  console.log("🚨 Cheating Alert:", log);

  proctorLogs.push(log);
  writeData("proctorLogs.json", proctorLogs);

  // 🔥 Notify teacher in that room
  if (rooms[socket.roomId]?.teacher) {
    io.to(rooms[socket.roomId].teacher).emit(
      "student-cheating",
      log
    );
  }
});

socket.on("auto-submit", () => {
  console.log("⚠ Exam Auto Submitted for:", socket.id);

  if (rooms[socket.roomId]?.teacher) {
    io.to(rooms[socket.roomId].teacher).emit(
      "student-auto-submitted",
      {
        studentId: socket.id,
        roomId: socket.roomId,
      }
    );
  }
});

  /* ===== DISCONNECT ===== */
  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    console.log("❌ Disconnected:", socket.id);

    if (!roomId || !rooms[roomId]) return;

    delete rooms[roomId].users[socket.id];
    socket.to(roomId).emit("user-left", socket.id);

    if (rooms[roomId].teacher === socket.id) {
      socket.to(roomId).emit("force-kick");
      delete rooms[roomId];
    }
  });
  /* ===== CHAT ===== */
socket.on("send-message", ({ roomId, message, sender }) => {
  io.to(roomId).emit("receive-message", {
    message,
    sender,
  });
});
socket.on("raise-hand", ({ roomId, name }) => {
  io.to(roomId).emit("hand-raised", { name });
});
});

/* ================= START ================= */
server.listen(5000, "0.0.0.0", () => {
  console.log("🚀 Server running on network at port 5000");
});
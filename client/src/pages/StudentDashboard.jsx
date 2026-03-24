import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [status, setStatus] = useState("");

  const [tasks, setTasks] = useState([]);
  const [submittedTasks, setSubmittedTasks] = useState({});
  const [quizResults, setQuizResults] = useState([]);

  /* ================= AUTH ================= */
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.role === "Student") setStudentName(user.name);
  }, []);

  /* ================= TASKS ================= */
  useEffect(() => {


    socket.emit("get-tasks");

    socket.on("all-tasks", (data) => {
      console.log("🎓 Student received tasks:", data);
      setTasks(data);
    });

    return () => {
      socket.off("all-tasks");
      socket.off("join-approved");
    };
  }, []);

  /* ================= QUIZ RESULTS ================= */
  useEffect(() => {
    socket.emit("get-quiz-results");

    socket.on("all-quiz-results", (data) => {
      setQuizResults(data);
    });

    socket.on("quiz-result-received", (result) => {
      setQuizResults((prev) => [...prev, result]);
    });

    return () => {
      socket.off("all-quiz-results");
      socket.off("quiz-result-received");
    };
  }, []);

  /* ================= FILE UPLOAD ================= */
  const uploadTask = async (task) => {
    const fileInput = document.getElementById(`file-${task.id}`);
    const file = fileInput.files[0];

    if (!file) return alert("Select a file");

    if (new Date() > new Date(task.deadline)) {
      alert("Deadline passed");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("https://virtualclassroom-omn0.onrender.com/upload", {
  method: "POST",
  body: formData,
});

    const fileData = await res.json();

    socket.emit("submit-task", {
      taskId: task.id,
      taskTitle: task.title,
      studentName,
      fileName: fileData.fileName,
      originalName: fileData.originalName,
    });

    setSubmittedTasks((prev) => ({
      ...prev,
      [task.id]: {
        submitted: true,
        time: new Date().toLocaleString(),
      },
    }));

    alert("✅ Uploaded successfully");
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1>🎓 Welcome, {studentName}</h1>
        <p>Join classes & submit assignments</p>
      </div>

      <div style={styles.row}>
        {/* JOIN CLASS */}
        <div style={styles.card}>
          <h3>🔴 Join Live Class</h3>
          <input
            style={styles.input}
            placeholder="Enter Class Code"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
          />
          <button
  style={styles.primaryBtn}
  onClick={() => {
    if (!classCode) return alert("Enter class code");

    setStatus("⏳ Waiting for teacher approval...");
    navigate(`/preview?room=${classCode}&role=student`);
  }}
>
  Request to Join
</button>

          {status && <p>{status}</p>}
        </div>

        {/* TASKS */}
        <div style={styles.cardWide}>
          <h3>📚 Assignments / Projects / Quizzes</h3>

          {tasks.length === 0 && <p>No tasks available</p>}

          {tasks.map((task) => (
            <div key={task.id} style={styles.assignment}>
              <p><b>{task.title}</b></p>
              <p>Type: {task.type}</p>
              <p>Deadline: {task.deadline}</p>

              {submittedTasks[task.id]?.submitted ? (
                <>
                  <p style={{ color: "green", fontWeight: "bold" }}>
                    ✔ Submitted
                  </p>
                  <p style={{ fontSize: "13px" }}>
                    🕒 {submittedTasks[task.id].time}
                  </p>
                </>
              ) : task.type === "quiz" ? (
                <button
                
                  style={styles.primaryBtn}
                  
                  onClick={() =>
                    
                    navigate("/quiz", {
                      
                      state: { quiz: task, studentName },
                    })
                  }
                >
                  Start Quiz
                </button>
              ) : (
                <>
                  <input type="file" id={`file-${task.id}`} />
                  <button
                    style={styles.secondaryBtn}
                    onClick={() => uploadTask(task)}
                  >
                    Upload
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* QUIZ RESULTS */}
      <div style={{ marginTop: "30px" }}>
        <div style={styles.cardWide}>
          <h3>🧠 My Quiz Results</h3>

          {quizResults.filter(r => r.studentName === studentName).length === 0 && (
            <p>No quiz attempts yet</p>
          )}

          {quizResults
  .filter(r => r.studentName === studentName)
  .map((r) => (
    <div key={r._id} style={styles.assignment}>
                <p><b>{r.quizTitle}</b></p>
                <p>Score: {r.score} / {r.total}</p>
                <p>🕒 {r.submittedAt}</p>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "30px",
  },
  header: { marginBottom: "30px" },
  row: { display: "flex", gap: "25px", flexWrap: "wrap" },
  card: {
    flex: 1,
    minWidth: "280px",
    background: "white",
    padding: "25px",
    borderRadius: "16px",
  },
  cardWide: {
    background: "white",
    padding: "25px",
    borderRadius: "16px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
  },
  primaryBtn: {
    width: "100%",
    padding: "10px",
    background: "#6366f1",
    color: "white",
    border: "none",
  },
  secondaryBtn: {
    marginTop: "8px",
    padding: "8px 12px",
    background: "#22c55e",
    color: "white",
    border: "none",
  },
  assignment: {
    marginTop: "15px",
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "12px",
  },
};

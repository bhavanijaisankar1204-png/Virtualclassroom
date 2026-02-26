import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";
import "./TeacherDashboard.css";

export default function TeacherDashboard() {
  const [teacherName, setTeacherName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [plagiarismResult, setPlagiarismResult] = useState({});

  const navigate = useNavigate();

  const shareOnWhatsApp = () => {
  if (!classCode) {
    alert("Start live class first");
    return;
  }

  const message = `🎥 Live Online Class\n\nJoin my class using this code:\n👉 ${classCode}\n\nOpen the app and enter the code to join.`;
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
};


  /* ================= PLAGIARISM CHECK ================= */
  const checkPlagiarism = (key) => {
    const percent = Math.floor(Math.random() * 60) + 10; // demo 10–70%

    setPlagiarismResult((prev) => ({
      ...prev,
      [key]: percent,
    }));
  };

  /* ================= QUIZ RESULTS ================= */
  useEffect(() => {
    socket.emit("get-quiz-results");

    socket.on("all-quiz-results", setQuizResults);
    socket.on("quiz-result-received", (result) => {
      setQuizResults((prev) => [...prev, result]);
    });

    return () => {
      socket.off("all-quiz-results");
      socket.off("quiz-result-received");
    };
  }, []);

  /* ================= DASHBOARD DATA ================= */
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.role === "Teacher") setTeacherName(user.name);

    socket.emit("get-tasks");
    socket.emit("get-submissions");

    socket.on("room-created", setClassCode);
    socket.on("all-tasks", setTasks);
    socket.on("student-requested", (data) =>
      setRequests((prev) => [...prev, data])
    );
    socket.on("all-submissions", setSubmissions);

    return () => {
      socket.off("room-created");
      socket.off("all-tasks");
      socket.off("student-requested");
      socket.off("all-submissions");
    };
  }, []);

  /* ================= LIVE CLASS ================= */
  const startLiveClass = () => socket.emit("create-room");

  const goLive = () => {
  navigate(`/preview?room=${classCode}&role=teacher`);
};

  /* ================= ADD TASK ================= */
  const addTask = (type) => {
    const title = document.getElementById("task-title").value;
    const deadline = document.getElementById("task-deadline").value;
    const plagiarism = document.getElementById("plagiarism").checked;

    if (!title || !deadline) return alert("Fill all fields");

    socket.emit("add-task", {
      id: Date.now().toString(),
      title,
      type,
      deadline,
      plagiarism: type !== "quiz" ? plagiarism : false,
    });

    document.getElementById("task-title").value = "";
    document.getElementById("task-deadline").value = "";
  };

  return (
    <div className="td-container">
      {/* ================= HEADER ================= */}
      <div className="td-header">
        <div>
          <h1>👩‍🏫 Welcome, {teacherName}</h1>
          <p>Manage live classes, assignments & student access</p>
        </div>
        <span className="td-badge">Teacher Panel</span>
      </div>

      <div className="td-grid">
        {/* ================= LIVE CLASS ================= */}
        <div className="td-card purple">
          <h3>🎥 Live Class</h3>
          <button className="td-btn primary" onClick={startLiveClass}>
            Start Live Class
          </button>

          {classCode && (
  <>
    <div className="td-code">
      <span>Class Code</span>
      <strong>{classCode}</strong>
    </div>

    <button
      className="td-btn whatsapp"
      onClick={shareOnWhatsApp}
    >
      📤 Share on WhatsApp
    </button>

    <button 
    className="td-btn whatsapp"
    onClick={goLive}>Go Live</button>

  </>
)}


          {requests.length > 0 && (
            <div className="td-requests">
              <h4>👨‍🎓 Join Requests</h4>
              {requests.map((r, i) => (
                <div key={i} className="td-request">
                  <span>{r.studentName}</span>
                  <button
                    onClick={() => {
                      socket.emit("approve-student", {
                        studentSocketId: r.socketId,
                        roomId: classCode,
                      });
                      setRequests((p) => p.filter((_, x) => x !== i));
                    }}
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= ASSIGN WORK ================= */}
        <div className="td-card blue">
          <h3>📝 Assign Work</h3>
          <input id="task-title" placeholder="Title" />
          <input id="task-deadline" type="date" />

          <h3>🧠 Assign Quiz</h3>
          <input id="quiz-subject" placeholder="Subject Name" />
          <input id="quiz-duration" type="number" placeholder="Duration (minutes)" />

          <button
            className="td-btn primary"
            onClick={() => {
              const subject = document.getElementById("quiz-subject").value;
              const duration = document.getElementById("quiz-duration").value;

              if (!subject || !duration) return alert("Enter subject and duration");

              navigate("/create-quiz", { state: { subject, duration } });
            }}
          >
            Assign Quiz
          </button>

          <label className="td-check">
            <input id="plagiarism" type="checkbox" defaultChecked />
            Enable Plagiarism Check
          </label>

          <div className="td-btn-row">
            <button onClick={() => addTask("assignment")}>Assignment</button>
            <button onClick={() => addTask("project")}>Project</button>
            <button onClick={() => addTask("quiz")}>Quiz</button>
          </div>
        </div>

        {/* ================= MY TASKS ================= */}
        <div className="td-card green">
          <h3>📚 My Tasks</h3>
          {tasks.length === 0 && <p>No tasks created</p>}

          {tasks.map((t) => (
            <div key={t._id} className="td-item">
              <div>
                <strong>{t.title}</strong>
                <p>{t.type} • {t.deadline}</p>
              </div>
              <button
                className="danger"
                onClick={() => {
                  if (window.confirm("Delete this task?")) {
                    socket.emit("delete-task", t._id);
                  }
                }}
              >
                🗑 Delete
              </button>
            </div>
          ))}
        </div>

        {/* ================= STUDENT SUBMISSIONS ================= */}
        <div className="td-card orange">
          <h3>📥 Student Submissions</h3>
          {submissions.length === 0 && <p>No submissions yet</p>}

          {submissions.map((s, i) => {
            const key = `${s.taskId}-${s.studentName}`;

            return (
              <div key={key} className="td-item">
                <div>
                  <strong>{s.studentName}</strong>
                  <p>{s.taskTitle}</p>
                  <small>📄 {s.fileName}</small>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <a
                    href={`http://localhost:5000/download/${s.fileName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="td-btn success"
                  >
                    ⬇ Download
                  </a>

                  <button
                    className="td-btn danger"
                    onClick={() => {
                      if (window.confirm("Delete this submission?")) {
                        socket.emit("delete-submission", {
                          taskId: s.taskId,
                          studentName: s.studentName,
                        });
                      }
                    }}
                  >
                    🗑 Delete
                  </button>

                  <button
                    className="td-btn primary"
                    onClick={() => checkPlagiarism(key)}
                  >
                    🧪 Check Plagiarism
                  </button>
                </div>

                {plagiarismResult[key] !== undefined && (
                  <div style={{ marginTop: "10px" }}>
                    <small>
                      Plagiarism: <b>{plagiarismResult[key]}%</b>
                    </small>

                    <div
                      style={{
                        height: "10px",
                        background: "#e5e7eb",
                        borderRadius: "6px",
                        overflow: "hidden",
                        marginTop: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: `${plagiarismResult[key]}%`,
                          height: "100%",
                          background:
                            plagiarismResult[key] > 40
                              ? "#ef4444"
                              : "#22c55e",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ================= QUIZ RESULTS ================= */}
        <div className="td-card orange">
          <h3>🧠 Quiz Results</h3>
          {quizResults.length === 0 && <p>No quiz attempts yet</p>}

          {quizResults.map((r, i) => (
            <div key={i} className="td-item">
              <strong>{r.studentName}</strong>
              <p>{r.quizTitle}</p>
              <small>Score: {r.score}/{r.total}</small>
       
            </div>
            
          ))}
        </div>
      </div>
    </div>
  );
}

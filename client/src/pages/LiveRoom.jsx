import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import socket from "../services/socket";

export default function LiveRoom() {
  const [params] = useSearchParams();
  const roomId = params.get("room");
  const role = params.get("role");

  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    // Teacher enters actual class
    if (role === "teacher") {
      socket.emit("teacher-joined-room", roomId);
    }

    // Student sends join request
    socket.on("student-requested", (data) => {
      setRequests((prev) => [...prev, data]);
    });

    // Student approved
    socket.on("student-approved", (studentName) => {
      setStudents((prev) => [...prev, studentName]);
    });

    return () => {
      socket.off("student-requested");
      socket.off("student-approved");
    };
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <h1>🎥 Live Classroom</h1>
      <p><b>Class Code:</b> {roomId}</p>

      {/* ONLY TEACHER SEES REQUESTS */}
      {role === "teacher" && (
        <>
          <h3>👨‍🎓 Waiting Requests</h3>
          {requests.length === 0 && <p>No students waiting</p>}

          {requests.map((r, i) => (
            <div key={i} style={card}>
              <span>{r.studentName}</span>
              <button
                onClick={() => {
                  socket.emit("approve-student", {
  studentSocketId: r.socketId,
  roomId,
});

setStudents(prev => [...prev, r.studentName]);
setRequests(prev => prev.filter((_, x) => x !== i));


                }}
              >
                Approve
              </button>
            </div>
          ))}
        </>
      )}

      <h3>✅ Joined Students</h3>
      {students.length === 0 && <p>No students joined yet</p>}
      {students.map((s, i) => (
        <p key={i}>✔ {s}</p>
      ))}
    </div>
  );
}

const card = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px",
  marginBottom: "8px",
  background: "#f1f5f9",
  borderRadius: "8px",
};

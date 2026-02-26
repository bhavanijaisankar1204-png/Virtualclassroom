import { useEffect, useState } from "react";
import socket from "../services/socket";

function TeacherProctorPanel({ roomId }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    socket.on("student-cheating", (data) => {
      setAlerts((prev) => [data, ...prev]);
    });

    socket.on("student-auto-submitted", (data) => {
      setAlerts((prev) => [
        {
          ...data,
          type: "AUTO_SUBMITTED",
          time: new Date().toLocaleString(),
        },
        ...prev,
      ]);
    });

    return () => {
      socket.off("student-cheating");
      socket.off("student-auto-submitted");
    };
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🚨 Live Proctor Alerts</h2>

      {alerts.length === 0 && <p>No suspicious activity</p>}

      {alerts.map((alert, index) => (
        <div
          key={index}
          style={{
            background: "#ffe6e6",
            padding: "10px",
            marginBottom: "10px",
            borderLeft: "5px solid red",
          }}
        >
          <strong>Student:</strong> {alert.studentId} <br />
          <strong>Type:</strong> {alert.type} <br />
          <strong>Time:</strong> {alert.time}
        </div>
      ))}
    </div>
  );
}

export default TeacherProctorPanel;
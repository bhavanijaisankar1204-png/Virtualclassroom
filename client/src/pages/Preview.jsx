import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import socket from "../services/socket";

export default function Preview() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [params] = useSearchParams();
  const roomId = params.get("room");
  const role = params.get("role");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const [approved, setApproved] = useState(false);
  const [requested, setRequested] = useState(false);

  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  /* ================= CAMERA ================= */
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
      })
      .catch(() => alert("Camera / Mic permission denied"));

    socket.on("join-approved", () => {
      setApproved(true);
    });

    socket.on("force-kick", () => {
      alert("Removed by teacher");
      navigate("/", { replace: true });
    });

    return () => {
      socket.off("join-approved");
      socket.off("force-kick");
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [navigate]);

  /* ================= CONTROLS ================= */
  const toggleCamera = () => {
    const track = streamRef.current.getVideoTracks()[0];
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  const toggleMic = () => {
    const track = streamRef.current.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  /* ================= ACTION ================= */
  const requestJoin = () => {
    socket.emit("join-request", {
      roomId,
      studentName: user.name,
    });
    setRequested(true);
  };

  const enterMeeting = () => {
    if (role === "student" && !approved) return;
    navigate(`/meeting?room=${roomId}&role=${role}`);
  };

  return (
    <div style={styles.page}>
      <h1>🎥 Preview</h1>
      <p><b>Role:</b> {role}</p>
      <p><b>Room:</b> {roomId}</p>

      <video ref={videoRef} autoPlay muted playsInline style={styles.video} />

      <div style={styles.controls}>
        <button onClick={toggleCamera}>
          {camOn ? "📷 Camera ON" : "📷 Camera OFF"}
        </button>
        <button onClick={toggleMic}>
          {micOn ? "🎤 Mic ON" : "🎤 Mic OFF"}
        </button>
      </div>

      {role === "student" && !requested && (
        <button style={styles.primary} onClick={requestJoin}>
          Request to Join
        </button>
      )}

      {role === "student" && (
        <p style={{ color: approved ? "green" : "orange" }}>
          {approved ? "✅ Approved" : "⏳ Waiting for approval"}
        </p>
      )}

      <button
        style={{
          ...styles.primary,
          opacity: role === "student" && !approved ? 0.5 : 1,
        }}
        onClick={enterMeeting}
      >
        Enter Meeting
      </button>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: 40,
    textAlign: "center",
  },
  video: {
    width: 420,
    height: 240,
    background: "#000",
    borderRadius: 12,
  },
  controls: {
    marginTop: 15,
    display: "flex",
    justifyContent: "center",
    gap: 10,
  },
  primary: {
    marginTop: 15,
    padding: "10px 25px",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function Classroom() {
  const videoRef = useRef(null);
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");
  const [error, setError] = useState("");

  useEffect(() => {
    startLiveClass();
  }, []);

  const startLiveClass = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      videoRef.current.srcObject = stream;
    } catch {
      setError("Camera or Microphone permission denied");
    }
  };

  return (
    <div style={styles.page}>
      <h1>🔴 LIVE CLASS</h1>
      <p><b>Class Code:</b> {roomId}</p>

      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={styles.video}
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: "30px",
  },
  video: {
    width: "450px",
    borderRadius: "12px",
    marginTop: "20px",
    background: "#000",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
};

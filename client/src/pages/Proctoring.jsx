import { useEffect, useRef, useState } from "react";
import socket from "../services/socket";

function Proctoring() {
  const videoRef = useRef(null);
  const [warnings, setWarnings] = useState(0);

  // 🎥 Start Camera
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        alert("Camera access is required!");
      });
  }, []);

  // 🚫 Detect Tab Switch
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        triggerWarning("TAB_SWITCH");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // 🖥️ Detect Fullscreen Exit
  useEffect(() => {
    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        triggerWarning("EXIT_FULLSCREEN");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  const triggerWarning = (type) => {
    const newWarnings = warnings + 1;
    setWarnings(newWarnings);

    socket.emit("cheating-detected", {
      type,
      warningCount: newWarnings,
    });

    alert(`Warning ${newWarnings}: ${type}`);

    if (newWarnings >= 3) {
      alert("Exam Auto Submitted!");
      socket.emit("auto-submit");
    }
  };

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen();
  };

  return (
    <div>
      <h2>Proctoring Enabled</h2>
      <button onClick={enterFullscreen}>Start Exam</button>

      <p>Warnings: {warnings} / 3</p>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        width="300"
        height="200"
        style={{ border: "2px solid red" }}
      />
    </div>
  );
}

export default Proctoring;
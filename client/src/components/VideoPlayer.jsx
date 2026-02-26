import { useEffect, useRef } from "react";

export default function VideoPlayer() {
  const videoRef = useRef(null);

  useEffect(() => {
    async function startCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      videoRef.current.srcObject = stream;
    }

    startCamera();
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{
        width: "400px",
        borderRadius: "12px",
        border: "2px solid #38bdf8",
      }}
    />
  );
}

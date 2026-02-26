
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import socket from "../services/socket";
import TeacherProctorPanel from "../pages/TeacherProctorPanel";

export default function Meeting() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roomId = params.get("room");
  const role = params.get("role");
  const user = JSON.parse(localStorage.getItem("user"));

  const localVideoRef = useRef(null);
  const streamRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [approved, setApproved] = useState(role === "teacher");
  const [requests, setRequests] = useState([]);
  

  /* ================= INIT ================= */
  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      localVideoRef.current.srcObject = stream;

      detectSpeaking(stream);

     if (role === "teacher") {
  socket.emit("join-room", {
    roomId,
    user: { name: user?.name, role },
  });
} else {
  // 🔥 student ALSO joins room immediately
  socket.emit("join-room", {
    roomId,
    user: { name: user?.name, role },
  });

  // then send request for approval UI
  socket.emit("join-request", {
    roomId,
    studentName: user?.name,
  });
}
    };

    init();
  }, [roomId, role]);

  /* ================= APPROVAL ================= */
  useEffect(() => {
    socket.on("approved", () => {
      setApproved(true);
      socket.emit("join-room", {
        roomId,
        user: { name: user?.name, role },
      });
    });

    return () => socket.off("approved");
  }, []);

  /* ================= TEACHER REQUEST ================= */
  useEffect(() => {
    if (role !== "teacher") return;

    socket.on("student-requested", (data) => {
      setRequests((prev) => [...prev, data]);
    });

    return () => socket.off("student-requested");
  }, [role]);

  /* ================= CHAT ================= */
  useEffect(() => {
    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("hand-raised", ({ name }) => {
      alert(`${name} raised hand ✋`);
    });

    return () => {
      socket.off("receive-message");
      socket.off("hand-raised");
    };
  }, []);

 const sendMessage = () => {
  if (!chatInput.trim()) return;

  const newMessage = {
    message: chatInput,
    sender: user?.name,
  };

  // show immediately
  setMessages((prev) => [...prev, newMessage]);

  socket.emit("send-message", {
    roomId,
    message: chatInput,
    sender: user?.name,
  });

  setChatInput("");
};

  /* ================= MIC ================= */
  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  /* ================= CAM ================= */
  const toggleCam = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  /* ================= SCREEN SHARE ================= */
  const toggleScreenShare = async () => {
    if (!screenSharing) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      localVideoRef.current.srcObject = screenStream;
      setScreenSharing(true);

      screenStream.getVideoTracks()[0].onended = () => {
        localVideoRef.current.srcObject = streamRef.current;
        setScreenSharing(false);
      };
    } else {
      localVideoRef.current.srcObject = streamRef.current;
      setScreenSharing(false);
    }
  };

  /* ================= RAISE HAND ================= */
  const raiseHand = () => {
    setHandRaised(true);
    socket.emit("raise-hand", {
      roomId,
      name: user?.name,
    });
    setTimeout(() => setHandRaised(false), 3000);
  };

  /* ================= SPEAKER DETECTION ================= */
  const detectSpeaking = (stream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const mic = audioContext.createMediaStreamSource(stream);

    mic.connect(analyser);
    analyser.fftSize = 512;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      const volume =
        dataArray.reduce((a, b) => a + b) / dataArray.length;

      setIsSpeaking(volume > 30);
      requestAnimationFrame(checkVolume);
    };

    checkVolume();
  };

  /* ================= END ================= */
  const endMeeting = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    socket.disconnect();
    navigate("/");
  };

  const approveStudent = (student) => {
    socket.emit("approve-student", {
      studentSocketId: student.socketId,
      roomId,
    });

    setRequests((prev) =>
      prev.filter((r) => r.socketId !== student.socketId)
    );
  };

  /* ================= UI ================= */
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#121212", color: "white" }}>

      {/* HEADER */}
      <div style={{ padding: 15, display: "flex", justifyContent: "space-between" }}>
        <h3>AI Virtual Classroom</h3>
        <div>Room: {roomId}</div>
      </div>

      {/* REQUESTS */}
      {role === "teacher" && requests.length > 0 && (
        <div style={{ position: "absolute", top: 70, right: 20, background: "#1e1e1e", padding: 15, borderRadius: 10 }}>
          <h4>Join Requests</h4>
          {requests.map((r) => (
            <div key={r.socketId} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span>{r.studentName}</span>
              <button onClick={() => approveStudent(r)} style={{ background: "#00c853", border: "none", padding: "4px 8px", borderRadius: 5, color: "white" }}>
                Approve
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex" }}>

        {/* VIDEO */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div
            onClick={() => setPinned(!pinned)}
            style={{
              width: pinned ? "70%" : "45%",
              height: pinned ? 400 : 260,
              background: "#000",
              borderRadius: 15,
              overflow: "hidden",
              border: isSpeaking ? "4px solid #00e676" : "2px solid #333",
              transition: "0.3s",
              position: "relative"
            }}
          >
            <video ref={localVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {handRaised && <div style={{ position: "absolute", top: 10, right: 10, fontSize: 28 }}>✋</div>}
            <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(0,0,0,0.6)", padding: "5px 10px", borderRadius: 6 }}>
              {user?.name} (You)
            </div>
          </div>
        </div>

        {/* CHAT */}
        {showChat && (
          <div style={{ width: 320, background: "#1e1e1e", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #333" }}>Chat</div>

            <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ textAlign: m.sender === user?.name ? "right" : "left", marginBottom: 10 }}>
                  <div style={{ display: "inline-block", padding: "8px 12px", borderRadius: 12, background: m.sender === user?.name ? "#1976d2" : "#333" }}>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{m.sender}</div>
                    {m.message}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 10, display: "flex", gap: 8 }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{ flex: 1, padding: 8, borderRadius: 6, border: "none" }}
              />
              <button onClick={sendMessage} style={{ background: "#1976d2", border: "none", padding: "8px 12px", borderRadius: 6, color: "white" }}>
                Send
              </button>
            </div>
          </div>
        )}
        {/* 🔥 PROCTOR PANEL (Teacher Only) */}
  {role === "teacher" && (
    <div style={{ width: 320, background: "#111", overflowY: "auto" }}>
      <TeacherProctorPanel roomId={roomId} />
    </div>
  )}
      </div>

      {/* CONTROLS */}
      <div style={{ background: "#1e1e1e", padding: 15, display: "flex", justifyContent: "center", gap: 20 }}>
        <button onClick={toggleMic}>{micOn ? "🎤" : "🔇"}</button>
        <button onClick={toggleCam}>{camOn ? "📷" : "🚫"}</button>
        <button onClick={toggleScreenShare}>🖥️</button>
        <button onClick={raiseHand}>✋</button>
        <button onClick={() => setShowChat((prev) => !prev)}>💬</button>
        <button onClick={endMeeting} style={{ color: "red" }}>📞</button>
      </div>
    </div>
  );
}
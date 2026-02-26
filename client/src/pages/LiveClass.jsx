import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import socket from "../services/socket";

const ICE = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function LiveClass() {
  const [params] = useSearchParams();
  const roomId = params.get("room");
  const role = params.get("role");
  const user = JSON.parse(localStorage.getItem("user"));

  const localVideo = useRef();
  const localStream = useRef();
  const peers = useRef({});

  const [videos, setVideos] = useState([]);
  const navigate = useNavigate();

  /* ================= GET CAMERA ================= */
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStream.current = stream;
        localVideo.current.srcObject = stream;

        socket.emit("join-room", {
          roomId,
          role,
          name: user.name,
        });
      });
  }, []);

  /* ================= SOCKET ================= */
  useEffect(() => {
    socket.on("user-joined", ({ socketId, name }) => {
      createPeer(socketId, true, name);
    });

    socket.on("webrtc-offer", ({ from, offer }) => {
      createPeer(from, false);
      peers.current[from].setRemoteDescription(offer);
      peers.current[from].createAnswer().then(answer => {
        peers.current[from].setLocalDescription(answer);
        socket.emit("webrtc-answer", { to: from, answer });
      });
    });

    socket.on("webrtc-answer", ({ from, answer }) => {
      peers.current[from].setRemoteDescription(answer);
    });

    socket.on("webrtc-ice", ({ from, candidate }) => {
      peers.current[from].addIceCandidate(candidate);
    });

    socket.on("force-mute", () => {
      localStream.current.getAudioTracks()[0].enabled = false;
      alert("🔇 Teacher muted you");
    });

    socket.on("force-kick", () => {
      alert("❌ You were removed");
      navigate("/student");
    });

    return () => socket.removeAllListeners();
  }, []);

  /* ================= PEER ================= */
  const createPeer = (id, initiator, name = "User") => {
    if (peers.current[id]) return;

    const pc = new RTCPeerConnection(ICE);
    peers.current[id] = pc;

    localStream.current.getTracks().forEach(track =>
      pc.addTrack(track, localStream.current)
    );

    pc.ontrack = e => {
      setVideos(v => {
        if (v.find(x => x.id === id)) return v;
        return [...v, { id, stream: e.streams[0], name }];
      });
    };

    pc.onicecandidate = e => {
      if (e.candidate) {
        socket.emit("webrtc-ice", {
          to: id,
          candidate: e.candidate,
        });
      }
    };

    if (initiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { to: id, offer });
      });
    }
  };

  /* ================= UI ================= */
  return (
    <div style={{ padding: 20 }}>
      <h2>🎥 Live Classroom</h2>
      <p>Class Code: {roomId}</p>

      <div style={grid}>
        <video ref={localVideo} autoPlay muted style={tile} />

        {videos.map(v => (
          <div key={v.id}>
            <video
              autoPlay
              ref={el => el && (el.srcObject = v.stream)}
              style={tile}
            />
            {role === "teacher" && (
              <div style={{ textAlign: "center" }}>
                <button onClick={() => socket.emit("mute-student", v.id)}>🔇</button>
                <button onClick={() => socket.emit("kick-student", v.id)}>❌</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px,1fr))",
  gap: "15px",
};

const tile = {
  width: "100%",
  borderRadius: "10px",
  background: "#000",
};

import { io } from "socket.io-client";

const socket = io("https://virtualclassroom-omn0.onrender.com", {
  transports: ["websocket"],
  autoConnect: true,
});

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Socket disconnected");
});

export default socket;

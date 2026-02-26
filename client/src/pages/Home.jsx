import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const features = [
  {
    title: "Live Virtual Classes",
    desc: "Real-time Zoom-like classes using WebRTC technology.",
    img: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  },
  {
    title: "AI Proctoring",
    desc: "Face detection, eye tracking and cheating detection.",
    img: "https://cdn-icons-png.flaticon.com/512/3048/3048395.png",
  },
  {
    title: "Smart Monitoring",
    desc: "Tab switching, activity tracking & live alerts.",
    img: "https://cdn-icons-png.flaticon.com/512/906/906175.png",
  },
  {
    title: "Plagiarism Detection",
    desc: "Automatic plagiarism checking for assignments & projects.",
    img: "https://cdn-icons-png.flaticon.com/512/1157/1157109.png",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % features.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-wrapper">
      <section className="hero">
        <div className="hero-text">
          <h1>
            🎓 AI Virtual Classroom <br />
            <span>with Smart Proctoring & Plagiarism</span>
          </h1>

          <p>
            An intelligent learning platform that combines live online
            classes, AI-based exam proctoring, and plagiarism detection
            in one unified system.
          </p>

          <button onClick={() => navigate("/login")}>
            🚀 Get Started
          </button>
        </div>

        <div className="hero-image">
          <img
            src="https://cdn-icons-png.flaticon.com/512/4149/4149678.png"
            alt="AI Education"
          />
        </div>
      </section>

      {/* FEATURE SLIDER */}
      <section className="vertical-slider">
        <div key={index} className="vertical-card">
          <img src={features[index].img} alt="feature" />
          <h3>{features[index].title}</h3>
          <p>{features[index].desc}</p>
        </div>
      </section>
    </div>
  );
}

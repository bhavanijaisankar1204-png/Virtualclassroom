import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Student");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    localStorage.setItem("user", JSON.stringify({ name, role }));

    if (role === "Teacher") navigate("/teacher");
    else navigate("/student");
  };

  return (
    <div className="login-page">
      <div className="login-image">
        <img
          src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
          alt="Virtual Classroom"
        />
        <h2>AI Virtual Classroom</h2>
        <p>
          Learn smarter with AI-powered monitoring, live classes
          and plagiarism detection.
        </p>
      </div>

      <div className="login-card">
        <h2>🔐 Login</h2>

        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option>Student</option>
          <option>Teacher</option>
        </select>

        <button onClick={handleLogin}>Login</button>

        <p className="login-note">
          Role-based access for students and teachers
        </p>
      </div>
    </div>
  );
}

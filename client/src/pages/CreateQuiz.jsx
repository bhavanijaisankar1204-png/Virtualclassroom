import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import socket from "../services/socket";

export default function CreateQuiz() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // 🛑 SAFETY CHECK
  if (!state) {
    return <h2>Invalid Quiz Navigation</h2>;
  }

  const { subject, duration } = state;

  const [questions, setQuestions] = useState([]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        options: ["", "", "", ""],
        correct: 0,
      },
    ]);
  };

  const updateQuestion = (i, field, value) => {
    const copy = [...questions];
    copy[i][field] = value;
    setQuestions(copy);
  };

  const updateOption = (qi, oi, value) => {
    const copy = [...questions];
    copy[qi].options[oi] = value;
    setQuestions(copy);
  };

  const publishQuiz = () => {
    if (questions.length === 0) {
      alert("Add at least one question");
      return;
    }

    socket.emit("add-task", {
      id: Date.now().toString(),
      title: subject,
      type: "quiz",
      duration,
      questions,
      deadline: new Date().toISOString().split("T")[0],
    });

    alert("✅ Quiz Assigned");
    navigate("/teacher");
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>🧠 Create Quiz</h2>
      <p><b>Subject:</b> {subject}</p>
      <p><b>Duration:</b> {duration} minutes</p>

      <button onClick={addQuestion}>➕ Add Question</button>

      {questions.map((q, i) => (
        <div key={i} style={{ marginTop: "20px" }}>
          <input
            placeholder={`Question ${i + 1}`}
            value={q.question}
            onChange={(e) =>
              updateQuestion(i, "question", e.target.value)
            }
          />

          {q.options.map((opt, oi) => (
            <input
              key={oi}
              placeholder={`Option ${oi + 1}`}
              value={opt}
              onChange={(e) =>
                updateOption(i, oi, e.target.value)
              }
            />
          ))}

          <select
            onChange={(e) =>
              updateQuestion(i, "correct", Number(e.target.value))
            }
          >
            <option value={0}>Correct: Option 1</option>
            <option value={1}>Correct: Option 2</option>
            <option value={2}>Correct: Option 3</option>
            <option value={3}>Correct: Option 4</option>
          </select>
        </div>
      ))}

      <br />
      <button onClick={publishQuiz}>✅ Done & Publish Quiz</button>
    </div>
  );
}

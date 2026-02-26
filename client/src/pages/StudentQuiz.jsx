import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../services/socket";

export default function StudentQuiz() {
  const location = useLocation();
  const navigate = useNavigate();

  // 🔥 1️⃣ Check state first
  if (!location.state) {
    return <h2>Invalid Quiz</h2>;
  }

  // 🔥 2️⃣ Then destructure
  const { quiz, studentName } = location.state;

  // 🔥 3️⃣ Then validate quiz
  if (!quiz || !quiz.questions) {
    return <h2>Quiz data corrupted or not loaded</h2>;
  }

  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // ⏱ TIMER
  useEffect(() => {
    if (submitted) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          submitQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted]);

  const selectAnswer = (qIndex, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [qIndex]: optionIndex,
    }));
  };

  const submitQuiz = () => {
    if (submitted) return;

    let marks = 0;

    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct) marks++;
    });

    setScore(marks);
    setSubmitted(true);

    // 🔥 SEND RESULT TO SERVER
    socket.emit("quiz-result", {
      studentName,
      quizTitle: quiz.title,
      total: quiz.questions.length,
      score: marks,
      time: new Date().toLocaleString(),
    });

    alert(`Your score: ${marks}/${quiz.questions.length}`);
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>🧠 {quiz.title}</h2>

      <p>
        ⏱ Time Left: {Math.floor(timeLeft / 60)}:
        {(timeLeft % 60).toString().padStart(2, "0")}
      </p>

      {quiz.questions.map((q, qi) => (
        <div key={qi} style={{ marginTop: "20px" }}>
          <p>
            <b>
              {qi + 1}. {q.question}
            </b>
          </p>

          {q.options.map((opt, oi) => (
            <label key={oi} style={{ display: "block" }}>
              <input
                type="radio"
                name={`q-${qi}`}
                checked={answers[qi] === oi}
                onChange={() => selectAnswer(qi, oi)}
                disabled={submitted}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}

      <br />

      {!submitted && (
        <button onClick={submitQuiz}>
          ✅ Submit Quiz
        </button>
      )}

      {submitted && (
        <h3>
          🎉 Score: {score}/{quiz.questions.length}
        </h3>
      )}
    </div>
  );
}
import { HashRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Classroom from "./pages/Classroom";
import CreateQuiz from "./pages/CreateQuiz";
import StudentQuiz from "./pages/StudentQuiz";
import Preview from "./pages/Preview";
import Meeting from "./pages/Meeting";





export default function App() {
  return (
    <HashRouter>
      <Routes>

        {/* HOME PAGE */}
        <Route path="/" element={<Home />} />

        {/* LOGIN PAGE */}
        <Route path="/login" element={<Login />} />

        {/* TEACHER DASHBOARD */}
        <Route path="/teacher" element={<TeacherDashboard />} />

        {/* STUDENT DASHBOARD */}
        <Route path="/student" element={<StudentDashboard />} />


        <Route path="/classroom" element={<Classroom />} />


        <Route path="/create-quiz" element={<CreateQuiz />} />

        <Route path="/quiz" element={<StudentQuiz />} />

      

        <Route path="/preview" element={<Preview />} />
  <Route path="/meeting" element={<Meeting />} />

    


      </Routes>
    </HashRouter>
  );
}

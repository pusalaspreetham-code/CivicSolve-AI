import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { UniversityAuthProvider } from "./context/UniversityAuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import UniversityProtectedRoute from "./components/UniversityProtectedRoute";
import Layout from "./components/Layout";
import UniversityLayout from "./components/UniversityLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Dashboard from "./pages/Dashboard";
import Problems from "./pages/Problems";
import AllProblems from "./pages/AllProblems";
import ProblemDetails from "./pages/ProblemDetails";
import ProblemsMap from "./pages/ProblemsMap";
import MyProblems from "./pages/MyProblems";
import MyTeams from "./pages/MyTeams";
import WorkWithFaculty from "./pages/WorkWithFaculty";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import PublicProblems from "./pages/PublicProblems";

import ULogin from "./pages/university/ULogin";
import URegister from "./pages/university/URegister";
import UVerifyOtp from "./pages/university/UVerifyOtp";
import UDashboard from "./pages/university/UDashboard";
import UStudents from "./pages/university/UStudents";
import UFaculty from "./pages/university/UFaculty";

import CitizenApp from "./citizen/CitizenApp";
import { LanguageProvider } from "./citizen/context/LanguageContext";

function App() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    if (path.startsWith("/university")) {
      document.title = "CivicSolve AI — University Portal";
    } else if (path.startsWith("/student")) {
      document.title = "CivicSolve AI — Student Portal";
    } else if (path.startsWith("/citizen")) {
      document.title = "CivicSolve AI — Citizen Portal";
    } else {
      document.title = "CivicSolve AI";
    }
  }, [location.pathname]);

  return (
    <ToastProvider>
      <AuthProvider>
      <UniversityAuthProvider>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/find-problem" element={<PublicProblems />} />

          <Route
            path="/citizen"
            element={
              <LanguageProvider>
                <CitizenApp />
              </LanguageProvider>
            }
          />

          <Route path="/student/login" element={<Login />} />
          <Route path="/student/register" element={<Register />} />
          <Route path="/student/verify-otp" element={<VerifyOtp />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/student/dashboard" element={<Dashboard />} />
            <Route path="/student/problems" element={<Problems />} />
            <Route path="/student/problems/all" element={<AllProblems />} />
            <Route path="/student/problems/map" element={<ProblemsMap />} />
            <Route path="/student/problems/:id" element={<ProblemDetails />} />
            <Route path="/student/my-problems" element={<MyProblems />} />
            <Route path="/student/my-teams" element={<MyTeams />} />
            <Route path="/student/faculty" element={<WorkWithFaculty />} />
            <Route path="/student/profile" element={<Profile />} />
          </Route>

          <Route path="/university/login" element={<ULogin />} />
          <Route path="/university/register" element={<URegister />} />
          <Route path="/university/verify-otp" element={<UVerifyOtp />} />

          <Route
            element={
              <UniversityProtectedRoute>
                <UniversityLayout />
              </UniversityProtectedRoute>
            }
          >
            <Route path="/university/dashboard" element={<UDashboard />} />
            <Route path="/university/students" element={<UStudents />} />
            <Route path="/university/faculty" element={<UFaculty />} />
          </Route>

          <Route path="/" element={<Home />} />
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/university" element={<Navigate to="/university/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </UniversityAuthProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { UniversityAuthProvider } from "./context/UniversityAuthContext";
import { GovAuthProvider } from "./context/GovAuthContext";
import { IndustryAuthProvider } from "./context/IndustryAuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import UniversityProtectedRoute from "./components/UniversityProtectedRoute";
import GovProtectedRoute from "./components/gov/GovProtectedRoute";
import IndustryProtectedRoute from "./components/IndustryProtectedRoute";
import Layout from "./components/Layout";
import UniversityLayout from "./components/UniversityLayout";
import GovLayout from "./components/gov/GovLayout";
import IndustryLayout from "./components/IndustryLayout";

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

import GovLogin from "./pages/gov/GovLogin";
import GovRegister from "./pages/gov/GovRegister";
import GovVerifyOtp from "./pages/gov/GovVerifyOtp";
import GovForgotPassword from "./pages/gov/GovForgotPassword";
import GovDashboard from "./pages/gov/GovDashboard";
import GovPendingApprovals from "./pages/gov/GovPendingApprovals";
import GovProblems from "./pages/gov/GovProblems";
import GovProblemsMap from "./pages/gov/GovProblemsMap";
import GovProblemDetails from "./pages/gov/GovProblemDetails";
import GovProfile from "./pages/gov/GovProfile";

import ILogin from "./pages/industry/ILogin";
import IRegister from "./pages/industry/IRegister";
import IVerifyOtp from "./pages/industry/IVerifyOtp";
import IDashboard from "./pages/industry/IDashboard";
import IProblems from "./pages/industry/IProblems";
import IProblemDetails from "./pages/industry/IProblemDetails";
import IAdoptions from "./pages/industry/IAdoptions";
import IMessages from "./pages/industry/IMessages";

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';

import CitizenApp from "./citizen/CitizenApp";
import { LanguageProvider } from "./citizen/context/LanguageContext";

function App() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    if (path.startsWith("/university")) {
      document.title = "CivicSolve AI — University Portal";
    } else if (path.startsWith("/government")) {
      document.title = "CivicSolve AI — Government Portal";
    } else if (path.startsWith("/industry")) {
      document.title = "CivicSolve AI — Industry Portal";
    } else if (path.startsWith("/student")) {
      document.title = "CivicSolve AI — Student Portal";
    } else if (path.startsWith("/citizen")) {
      document.title = "CivicSolve AI — Citizen Portal";
    } else if (path.startsWith("/admin")) {
      document.title = "CivicSolve AI — Admin Portal";
    } else {
      document.title = "CivicSolve AI";
    }
  }, [location.pathname]);

  return (
    <ToastProvider>
      <AuthProvider>
      <UniversityAuthProvider>
      <GovAuthProvider>
      <IndustryAuthProvider>
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

          {/* Government Auth (public) */}
          <Route path="/government/login" element={<GovLogin />} />
          <Route path="/government/register" element={<GovRegister />} />
          <Route path="/government/verify-otp" element={<GovVerifyOtp />} />
          <Route path="/government/forgot-password" element={<GovForgotPassword />} />

          {/* Government Protected */}
          <Route element={<GovProtectedRoute><GovLayout /></GovProtectedRoute>}>
            <Route path="/government/dashboard" element={<GovDashboard />} />
            <Route path="/government/approvals" element={<GovPendingApprovals />} />
            <Route path="/government/problems" element={<GovProblems />} />
            <Route path="/government/problems/map" element={<GovProblemsMap />} />
            <Route path="/government/problems/:id" element={<GovProblemDetails />} />
            <Route path="/government/profile" element={<GovProfile />} />
          </Route>

          {/* Industry Auth (public) */}
          <Route path="/industry/login" element={<ILogin />} />
          <Route path="/industry/register" element={<IRegister />} />
          <Route path="/industry/verify-otp" element={<IVerifyOtp />} />

          {/* Industry Protected */}
          <Route element={<IndustryProtectedRoute><IndustryLayout /></IndustryProtectedRoute>}>
            <Route path="/industry/dashboard" element={<IDashboard />} />
            <Route path="/industry/problems" element={<IProblems />} />
            <Route path="/industry/problems/:id" element={<IProblemDetails />} />
            <Route path="/industry/adoptions" element={<IAdoptions />} />
            <Route path="/industry/messages" element={<IMessages />} />
          </Route>

          {/* Admin Portal */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/gov-users/:id" element={<AdminUserDetail />} />
          </Route>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          <Route path="/" element={<Home />} />
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/university" element={<Navigate to="/university/dashboard" replace />} />
          <Route path="/government" element={<Navigate to="/government/dashboard" replace />} />
          <Route path="/industry" element={<Navigate to="/industry/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </IndustryAuthProvider>
      </GovAuthProvider>
      </UniversityAuthProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
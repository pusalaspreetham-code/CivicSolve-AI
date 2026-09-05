import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import Loading from "./Loading";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { student, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loading label="Checking your session..." /></div>;
  }
  if (!student) {
    return <Navigate to="/student/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
};
export default ProtectedRoute;

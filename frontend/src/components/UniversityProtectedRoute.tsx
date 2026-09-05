import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useUniversityAuth } from "../context/UniversityAuthContext";
import Loading from "./Loading";

const UniversityProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { university, loading } = useUniversityAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loading label="Checking your session..." /></div>;
  }
  if (!university) {
    return <Navigate to="/university/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
};
export default UniversityProtectedRoute;

import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useIndustryAuth } from "../context/IndustryAuthContext";
import Loading from "./Loading";

const IndustryProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { industry, loading } = useIndustryAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading label="Checking your industry session..." />
      </div>
    );
  }

  if (!industry) {
    return <Navigate to="/industry/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default IndustryProtectedRoute;

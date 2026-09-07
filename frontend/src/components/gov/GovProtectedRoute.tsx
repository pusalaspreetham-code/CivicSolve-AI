import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useGovAuth } from '../../context/GovAuthContext';
import { Loader2 } from 'lucide-react';

interface GovProtectedRouteProps {
  children?: React.ReactNode;
}

export default function GovProtectedRoute({ children }: GovProtectedRouteProps) {
  const { govUser, loading } = useGovAuth();
  const location = useLocation();

  // While verifying the token in the background, show a spinner
  if (loading && !govUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  // If we have no user (and we're done loading), redirect to login
  if (!govUser) {
    return <Navigate to="/government/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

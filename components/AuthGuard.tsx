
import React from 'react';
import { useApp } from '../context/AppContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect to settings (where login form is) if trying to access other pages
    // Exception: We are using Settings page as the Login page for this simple app structure
    if (location.pathname !== '/settings') {
        return <Navigate to="/settings" replace />;
    }
  }

  return <>{children}</>;
};

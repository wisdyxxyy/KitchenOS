
import React from 'react';
import { useApp } from '../context/AppContext';
import { Loader2 } from 'lucide-react';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading } = useApp();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  // Auth requirement removed. Always render children.
  return <>{children}</>;
};

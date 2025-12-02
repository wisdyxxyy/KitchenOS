
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Recipes } from './pages/Recipes';
import { MenuPlanner } from './pages/MenuPlanner';
import { Statistics } from './pages/Statistics';
import { Settings } from './pages/Settings';
import { AuthGuard } from './components/AuthGuard';
import { AlertTriangle } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { dbError } = useApp();

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen relative">
        {dbError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertTriangle className="flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold">Database Access Error</p>
              <p className="text-sm opacity-90">{dbError}</p>
              <p className="text-xs mt-2 bg-white/50 p-2 rounded border border-red-100 inline-block">
                Please go to <b>Firebase Console {'>'} Firestore Database {'>'} Rules</b> and ensure rules allow read/write.
              </p>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            {/* Login is on Settings page, so we allow access to it */}
            <Route path="/settings" element={<Settings />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/inventory" element={<AuthGuard><Inventory /></AuthGuard>} />
            <Route path="/recipes" element={<AuthGuard><Recipes /></AuthGuard>} />
            <Route path="/menu" element={<AuthGuard><MenuPlanner /></AuthGuard>} />
            <Route path="/stats" element={<AuthGuard><Statistics /></AuthGuard>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
};

export default App;

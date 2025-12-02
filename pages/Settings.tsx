
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Database, LogOut, User as UserIcon, AlertTriangle, Chrome, Copy, Check } from 'lucide-react';
import { auth } from '../firebaseConfig';

export const Settings: React.FC = () => {
  const { 
    user,
    login,
    signup,
    loginWithGoogle,
    logout,
    exportData, 
    ingredients, 
    recipes
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [domainToWhitelist, setDomainToWhitelist] = useState('');

  // Robust domain extraction logic for blob/preview environments
  useEffect(() => {
    try {
      const href = window.location.href;
      let hostname = window.location.hostname;

      // If running inside a blob URL (common in previewers), hostname might be empty or misleading
      if (!hostname || href.startsWith('blob:')) {
        // Try to construct a URL object from the inner part if it's a blob
        const cleanUrl = href.replace(/^blob:/, '');
        try {
          const urlObj = new URL(cleanUrl);
          hostname = urlObj.hostname;
        } catch (e) {
          // Fallback regex if URL parsing fails
          const match = cleanUrl.match(/:\/\/(.[^/]+)/);
          if (match && match[1]) {
            hostname = match[1];
          }
        }
      }
      setDomainToWhitelist(hostname);
    } catch (e) {
      setDomainToWhitelist('Could not detect domain');
    }
  }, []);

  // Manual Backup Handlers
  const handleDownload = () => {
    const jsonString = exportData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `kitchen_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setError(`Domain not authorized. Please check the "Firebase Configuration Help" box below.`);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled. Go to Firebase Console > Authentication > Sign-in method to enable it.');
      } else {
        setError(err.message.replace('Firebase: ', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Account already exists. Please switch to "Sign In" to log in.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled. Go to Firebase Console > Authentication > Sign-in method to enable it.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up.');
      } else {
        setError(err.message.replace('Firebase: ', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const copyDomain = () => {
    navigator.clipboard.writeText(domainToWhitelist);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto">
         <div className="bg-white p-8 rounded-2xl shadow-xl w-full border border-slate-100">
           <div className="text-center mb-8">
             <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserIcon size={32} className="text-indigo-600"/>
             </div>
             <h1 className="text-2xl font-bold text-slate-800">Welcome to KitchenOS</h1>
             <p className="text-slate-500 mt-2">Sign in to sync your kitchen across all devices.</p>
           </div>
           
           {error && (
             <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 break-words">
               <div className="flex items-start gap-2">
                 <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                 <span>{error}</span>
               </div>
             </div>
           )}

           <div className="space-y-4">
             <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 bg-white text-slate-700 font-bold rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 relative"
             >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {loading ? 'Connecting...' : 'Continue with Google'}
             </button>

             {/* Domain Helper for Preview Environments */}
             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800">
                <p className="mb-1 font-bold">Firebase Configuration Help</p>
                <p className="mb-2 opacity-80">If you get an "Unauthorized Domain" error, please copy the domain below and add it to <span className="font-semibold">Firebase Console {'>'} Authentication {'>'} Settings {'>'} Authorized domains</span>.</p>
                <div className="flex items-center gap-2 bg-white p-2 rounded border border-blue-200">
                  <code className="flex-1 truncate select-all font-mono text-xs font-bold text-slate-700">{domainToWhitelist}</code>
                  <button onClick={copyDomain} className="text-blue-500 hover:text-blue-700 flex-shrink-0" title="Copy">
                    {copied ? <Check size={14}/> : <Copy size={14}/>}
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-slate-500 italic">
                  Note: Do not include "blob:", "https://" or paths. Just the domain.
                </p>
             </div>

             <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">Or use email</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

             <form onSubmit={handleAuth} className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                 <input 
                   type="email" 
                   required
                   className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                   value={email}
                   onChange={e => setEmail(e.target.value)}
                   placeholder="chef@example.com"
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                 <input 
                   type="password" 
                   required
                   minLength={6}
                   className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                   value={password}
                   onChange={e => setPassword(e.target.value)}
                   placeholder="••••••••"
                 />
               </div>
               
               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-2"
               >
                 {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In with Email')}
               </button>
             </form>

             <div className="mt-4 text-center">
               <button 
                 onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                 className="text-sm text-indigo-600 font-medium hover:underline"
               >
                 {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
               </button>
             </div>
           </div>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500">Manage your account and data.</p>
      </header>

      {/* Account Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-indigo-50/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
               <UserIcon size={24} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-800">Account</h2>
               <p className="text-sm text-slate-500">{user.email || user.displayName || 'User'}</p>
             </div>
          </div>
          <button 
            onClick={logout}
            className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
        
        <div className="p-6">
           <div className="grid grid-cols-2 gap-4 text-sm">
             <div className="p-4 bg-slate-50 rounded-xl">
               <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Recipes Synced</span>
               <span className="text-2xl font-bold text-slate-800">{recipes.length}</span>
             </div>
             <div className="p-4 bg-slate-50 rounded-xl">
               <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Ingredients Synced</span>
               <span className="text-2xl font-bold text-slate-800">{ingredients.length}</span>
             </div>
           </div>
           <div className="mt-4 text-xs text-slate-400 bg-slate-50 p-2 rounded flex gap-2 items-center">
             <Database size={12}/> All changes are automatically saved to the cloud (Firebase).
           </div>
        </div>
      </section>

      {/* Export Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <div className="flex items-center gap-3 mb-4">
           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
             <Download size={24} />
           </div>
           <div>
             <h2 className="text-lg font-bold text-slate-800">Export Data</h2>
             <p className="text-sm text-slate-500">Download a snapshot of your recipes (Inventory quantities hidden).</p>
           </div>
         </div>
         
         <button 
           onClick={handleDownload}
           className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
         >
           <Download size={18} /> Download JSON
         </button>
      </section>
    </div>
  );
};

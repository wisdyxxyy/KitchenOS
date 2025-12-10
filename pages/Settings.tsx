
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Database, User as UserIcon } from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    exportData, 
    ingredients, 
    recipes
  } = useApp();

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

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500">Manage your data.</p>
      </header>

      {/* Account Section - Simplified for Shared Mode */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-indigo-50/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
               <UserIcon size={24} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-800">Shared Kitchen Mode</h2>
               <p className="text-sm text-slate-500">Authentication is disabled. All users share the same database.</p>
             </div>
          </div>
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
             <Database size={12}/> Using shared Firestore database. Ensure rules allow public access.
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

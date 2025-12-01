
import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Upload, Trash2, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { exportData, importData, clearAllData, ingredients, recipes } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (confirm("Warning: Importing data will OVERWRITE all your current ingredients, recipes, and menu plans. This cannot be undone. Are you sure?")) {
          const success = importData(content);
          if (success) {
            alert("Data imported successfully!");
          } else {
            alert("Failed to import data. Please check the file format.");
          }
        }
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const handleClear = () => {
    if (confirm("Are you absolutely sure you want to delete ALL data? This includes all recipes, inventory, and plans.")) {
       clearAllData();
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">Settings & Data</h1>
        <p className="text-slate-500">Manage your application data and backups.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
               <Download size={24} />
             </div>
             <div>
               <h2 className="text-lg font-bold text-slate-800">Backup Data</h2>
               <p className="text-sm text-slate-500">Export everything to a file.</p>
             </div>
           </div>
           
           <p className="text-slate-600 mb-6 text-sm leading-relaxed">
             Download a copy of your database including all recipes, ingredients, and menu plans. 
             You can use this file to transfer your data to another device or browser.
           </p>

           <button 
             onClick={handleDownload}
             className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
           >
             <Database size={18} /> Export Database
           </button>
        </div>

        {/* Restore Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
               <Upload size={24} />
             </div>
             <div>
               <h2 className="text-lg font-bold text-slate-800">Restore Data</h2>
               <p className="text-sm text-slate-500">Import data from a backup file.</p>
             </div>
           </div>
           
           <p className="text-slate-600 mb-6 text-sm leading-relaxed">
             Upload a previously exported JSON file. 
             <strong className="block mt-2 text-amber-600 flex items-center gap-1">
               <AlertTriangle size={14}/> Warning: This will overwrite current data.
             </strong>
           </p>

           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full py-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
           >
             <Upload size={18} /> Select Backup File
           </button>
           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept=".json" 
             onChange={handleUpload}
           />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mt-8">
         <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-red-100 text-red-600 rounded-lg">
               <AlertTriangle size={20} />
             </div>
             <h2 className="text-lg font-bold text-red-800">Danger Zone</h2>
         </div>
         <div className="flex flex-col md:flex-row justify-between items-center gap-4">
           <div>
             <p className="text-red-700 text-sm font-medium">Clear Application Data</p>
             <p className="text-red-600/80 text-xs">Permanently remove {recipes.length} recipes and {ingredients.length} inventory items.</p>
           </div>
           <button 
             onClick={handleClear}
             className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
           >
             <Trash2 size={16} /> Reset All Data
           </button>
         </div>
      </div>
    </div>
  );
};

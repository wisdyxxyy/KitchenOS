
import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Upload, Trash2, Database, AlertTriangle, Cloud, CloudRain, RefreshCw, Key, Link2, Unlink, Copy, Check, Info } from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    exportData, 
    importData, 
    clearAllData, 
    ingredients, 
    recipes,
    syncConfig,
    saveSyncConfig,
    clearSyncConfig,
    syncPush,
    syncPull,
    createSyncBin
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sync Form State
  const [apiKey, setApiKey] = useState('');
  const [binId, setBinId] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Feedback State
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

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

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (confirm("Warning: Importing data will OVERWRITE recipes. Menu Plans are NOT imported. Inventory names will be merged, but stock quantities will NOT be overwritten (existing items keep their count, new items default to 0). Continue?")) {
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
    // Reset input
    e.target.value = '';
  };

  const handleClear = () => {
    if (confirm("Are you absolutely sure you want to delete ALL data? This includes all recipes, inventory, and plans.")) {
       clearAllData();
    }
  };

  // Cloud Sync Handlers
  const handleCreateBin = async () => {
    setNotification(null);
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      setNotification({ type: 'error', message: "Please enter a JSONBin.io Master Key" });
      return;
    }
    setLoading(true);
    try {
      const newBinId = await createSyncBin(cleanKey);
      saveSyncConfig(cleanKey, newBinId);
      setNotification({ type: 'success', message: "Cloud repository created and linked!" });
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkBin = () => {
    setNotification(null);
    // Extract ID if full URL is pasted
    let cleanBin = binId.trim();
    if (cleanBin.includes('/b/')) {
        cleanBin = cleanBin.split('/b/')[1].split('/')[0];
    }
    
    const cleanKey = apiKey.trim();
    
    if (!cleanKey || !cleanBin) {
      setNotification({ type: 'error', message: "Please enter both API Key and Bin ID" });
      return;
    }
    
    // Update local state to reflect cleaned version
    setBinId(cleanBin);
    setApiKey(cleanKey);
    
    saveSyncConfig(cleanKey, cleanBin);
    setNotification({ type: 'success', message: "Device linked successfully." });
  };

  const handlePush = async () => {
    if (!confirm("Overwrite cloud data with local data? (Inventory quantities and Menu Plans are NOT synced)")) return;
    setLoading(true);
    setNotification(null);
    try {
      await syncPush();
      setNotification({ type: 'success', message: "Successfully pushed data to cloud." });
    } catch (e: any) {
      console.error(e);
      setNotification({ type: 'error', message: "Push failed: " + e.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    if (!confirm("Overwrite local recipes with cloud data? Local inventory stock levels and Menu Plans will be preserved.")) return;
    setLoading(true);
    setNotification(null);
    try {
      await syncPull();
      setNotification({ type: 'success', message: "Successfully pulled data from cloud." });
    } catch (e: any) {
      console.error(e);
      setNotification({ type: 'error', message: "Pull failed: " + e.message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">Settings & Data</h1>
        <p className="text-slate-500">Manage your application data, backups, and cloud synchronization.</p>
      </header>

      {/* Cloud Sync Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-indigo-50/50">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
               <Cloud size={24} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-800">Cloud Sync (JSONBin.io)</h2>
               <p className="text-sm text-slate-500">Sync your recipes across devices without a server.</p>
             </div>
          </div>
        </div>

        <div className="p-6">
          {!syncConfig ? (
            <div className="space-y-6 max-w-2xl">
              <div className="text-sm text-slate-600 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="font-bold mb-2">How to setup sync:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Go to <a href="https://jsonbin.io/app/keys" target="_blank" className="text-blue-600 underline" rel="noreferrer">JSONBin.io</a> and sign up (free).</li>
                  <li>Copy your <strong>Master Key</strong> (X-Master-Key).</li>
                  <li>Paste it below to create a new sync repository or link an existing one.</li>
                </ol>
              </div>

              {notification && notification.type === 'error' && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
                  <AlertTriangle size={16}/> {notification.message}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">JSONBin Master Key</label>
                  <div className="relative">
                    <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input 
                      type="password"
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                      placeholder="$2b$10$..."
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-2">New Setup</h3>
                    <p className="text-xs text-slate-500 mb-4">I want to upload my current data to a new cloud repository.</p>
                    <button 
                      onClick={handleCreateBin}
                      disabled={loading}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {loading ? <RefreshCw size={16} className="animate-spin"/> : <CloudRain size={16}/>} Create & Sync
                    </button>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <h3 className="font-bold text-slate-800 mb-2">Join Existing</h3>
                     <p className="text-xs text-slate-500 mb-2">I have a Bin ID from another device.</p>
                     <input 
                        type="text"
                        className="w-full px-3 py-2 mb-3 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                        placeholder="Bin ID (e.g. 65f...)"
                        value={binId}
                        onChange={e => setBinId(e.target.value)}
                      />
                     <button 
                      onClick={handleLinkBin}
                      className="w-full py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100 flex justify-center items-center gap-2"
                    >
                      <Link2 size={16}/> Link Device
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                 <div>
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
                     <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Connected</span>
                   </div>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-slate-500">Bin ID:</span>
                      <code className="text-sm font-mono bg-white px-1 py-0.5 rounded border border-slate-200">{syncConfig.binId}</code>
                      <button onClick={() => copyToClipboard(syncConfig.binId)} className="text-slate-400 hover:text-indigo-600" title="Copy ID">
                        {copySuccess ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                      </button>
                   </div>
                   <p className="text-xs text-slate-400 mt-1">Last synced: {syncConfig.lastSynced ? new Date(syncConfig.lastSynced).toLocaleString() : 'Never'}</p>
                 </div>
                 <button onClick={clearSyncConfig} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                   <Unlink size={12}/> Unlink Device
                 </button>
               </div>

               {notification && (
                 <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                   notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
                 }`}>
                    {notification.type === 'success' ? <Check size={20} className="text-emerald-600"/> : <AlertTriangle size={20} className="text-red-600"/>}
                    <span className="font-medium">{notification.message}</span>
                 </div>
               )}

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                 <button 
                    onClick={handlePush}
                    disabled={loading}
                    className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50 shadow-sm shadow-indigo-200"
                 >
                    {loading ? <RefreshCw size={20} className="animate-spin"/> : <Upload size={20} />}
                    <div className="text-left">
                      <div className="font-bold">Push to Cloud</div>
                      <div className="text-xs opacity-80">Upload local changes</div>
                    </div>
                 </button>

                 <button 
                    onClick={handlePull}
                    disabled={loading}
                    className="p-4 bg-white border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50 rounded-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                 >
                    {loading ? <RefreshCw size={20} className="animate-spin"/> : <Download size={20} />}
                    <div className="text-left">
                      <div className="font-bold">Pull from Cloud</div>
                      <div className="text-xs opacity-80">Download remote data</div>
                    </div>
                 </button>
               </div>
               
               <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                 <Info size={14} className="mt-0.5 text-slate-400 shrink-0"/>
                 <p>Note: Inventory <strong>quantities</strong> and <strong>Menu Plans</strong> are local-only and are NOT synced to the cloud. Only Ingredient definitions and Recipe details are synced.</p>
               </div>
            </div>
          )}
        </div>
      </section>

      <div className="border-t border-slate-200 my-8"></div>

      {/* Local File Backup Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
               <Database size={24} />
             </div>
             <div>
               <h2 className="text-lg font-bold text-slate-800">Local Backup</h2>
               <p className="text-sm text-slate-500">Download .json file</p>
             </div>
           </div>
           
           <button 
             onClick={handleDownload}
             className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
           >
             <Download size={18} /> Export to File
           </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
               <Upload size={24} />
             </div>
             <div>
               <h2 className="text-lg font-bold text-slate-800">Local Restore</h2>
               <p className="text-sm text-slate-500">Upload .json file</p>
             </div>
           </div>

           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
           >
             <Upload size={18} /> Import File
           </button>
           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept=".json" 
             onChange={handleUpload}
           />
        </div>
      </section>

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

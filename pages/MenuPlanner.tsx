
import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Recipe, Ingredient } from '../types';
import { ChevronLeft, ChevronRight, Plus, Sparkles, XCircle, Utensils, Camera, Image as ImageIcon } from 'lucide-react';
import { suggestRecipesFromInventory } from '../services/geminiService';
import { RecipePicker } from '../components/RecipePicker';
import { convertFileToBase64 } from '../utils/imageUtils';

export const MenuPlanner: React.FC = () => {
  const { menuPlans, recipes, ingredients, updateMenuPlan, getRecipeById } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState<{date: string, type: 'lunch'|'dinner'} | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  
  // Ref for handling multiple file inputs dynamically
  // Structure: fileInputRef.current["YYYY-MM-DD-lunch"]
  const fileInputRef = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Helper to generate week dates
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1); // Start Monday
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDates = getWeekDates(selectedDate);
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const changeWeek = (dir: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (dir * 7));
    setSelectedDate(newDate);
  };

  const handleRecipeSelect = (recipeId: string) => {
    if (!showPicker) return;
    const dateStr = showPicker.date;
    const existing = menuPlans.find(p => p.date === dateStr) || { date: dateStr, lunchRecipeIds: [], dinnerRecipeIds: [] };
    
    const key = showPicker.type === 'lunch' ? 'lunchRecipeIds' : 'dinnerRecipeIds';
    const currentIds = existing[key] || [];

    // Avoid duplicates
    if (!currentIds.includes(recipeId)) {
      updateMenuPlan({
        ...existing,
        [key]: [...currentIds, recipeId]
      });
    }
    
    setShowPicker(null);
  };

  const removeRecipeFromPlan = (dateStr: string, type: 'lunch'|'dinner', recipeId: string) => {
    const existing = menuPlans.find(p => p.date === dateStr);
    if (!existing) return;
    
    const key = type === 'lunch' ? 'lunchRecipeIds' : 'dinnerRecipeIds';
    const currentIds = existing[key] || [];
    
    updateMenuPlan({
      ...existing,
      [key]: currentIds.filter(id => id !== recipeId)
    });
  };

  const handleMealImageUpload = async (dateStr: string, type: 'lunch' | 'dinner', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await convertFileToBase64(e.target.files[0]);
        const existing = menuPlans.find(p => p.date === dateStr) || { date: dateStr, lunchRecipeIds: [], dinnerRecipeIds: [] };
        
        const key = type === 'lunch' ? 'lunchImage' : 'dinnerImage';
        updateMenuPlan({ ...existing, [key]: base64 });
      } catch (err) {
        console.error("Image upload failed", err);
      }
    }
  };

  const removeMealImage = (dateStr: string, type: 'lunch' | 'dinner') => {
    const existing = menuPlans.find(p => p.date === dateStr);
    if (existing) {
       const key = type === 'lunch' ? 'lunchImage' : 'dinnerImage';
       updateMenuPlan({ ...existing, [key]: undefined });
    }
  };

  const handleAiSuggest = async () => {
    setLoadingAi(true);
    setShowAiModal(true);
    const results = await suggestRecipesFromInventory(ingredients);
    setAiSuggestions(results);
    setLoadingAi(false);
  };

  const renderRecipeSlot = (dateStr: string, type: 'lunch' | 'dinner', recipeIds: string[], image?: string) => {
    return (
      <div className="flex-1 bg-slate-50 rounded-lg p-2 flex flex-col gap-1 overflow-hidden min-h-[100px] relative">
        <span className="text-[10px] font-bold text-slate-400 uppercase flex justify-between items-center mb-1">
          {type}
          <div className="flex gap-1">
            <button 
               onClick={() => fileInputRef.current[`${dateStr}-${type}`]?.click()}
               className={`p-0.5 rounded transition-colors ${image ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-200'}`}
               title="Add photo"
            >
               <Camera size={12} />
            </button>
            <input 
               type="file" 
               className="hidden" 
               accept="image/*"
               ref={el => fileInputRef.current[`${dateStr}-${type}`] = el}
               onChange={(e) => handleMealImageUpload(dateStr, type, e)}
            />
            <button 
               onClick={() => setShowPicker({date: dateStr, type})}
               className="hover:bg-slate-200 rounded p-0.5 text-slate-500"
               title="Add item"
            >
              <Plus size={12} />
            </button>
          </div>
        </span>
        
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[120px] custom-scrollbar z-10">
          {recipeIds && recipeIds.map(id => {
            const recipe = getRecipeById(id);
            if (!recipe) return null;
            return (
              <div key={id} className="group relative bg-white border border-slate-200 rounded p-1.5 shadow-sm">
                <div className="text-sm font-medium text-slate-800 leading-tight pr-4">{recipe.name}</div>
                <button 
                  onClick={() => removeRecipeFromPlan(dateStr, type, id)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                ><XCircle size={14}/></button>
              </div>
            );
          })}
          {(!recipeIds || recipeIds.length === 0) && !image && (
            <button 
              onClick={() => setShowPicker({date: dateStr, type})}
              className="mt-1 w-full flex-1 border-2 border-dashed border-slate-200 rounded text-slate-300 hover:border-emerald-300 hover:text-emerald-400 transition-colors flex justify-center items-center min-h-[30px]"
            >
              <Plus size={14} />
            </button>
          )}
        </div>

        {/* Meal Photo Thumbnail */}
        {image && (
          <div className="mt-2 w-full h-16 rounded overflow-hidden relative group flex-shrink-0">
            <img src={image} alt={`${type} meal`} className="w-full h-full object-cover" />
            <button 
              onClick={() => removeMealImage(dateStr, type)}
              className="absolute top-0.5 right-0.5 bg-black/50 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <XCircle size={12}/>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 relative h-full">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Weekly Planner</h1>
          <p className="text-slate-500">Plan your meals based on what you have.</p>
        </div>
        
        <div className="flex gap-4">
           <button 
            onClick={handleAiSuggest}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm transition-all"
          >
            <Sparkles size={16} /> AI Suggestions
          </button>

          <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-200 p-1">
            <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-slate-50 rounded"><ChevronLeft size={20}/></button>
            <span className="px-4 font-bold text-slate-700 w-32 md:w-40 text-center text-sm">
              {weekDates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <button onClick={() => changeWeek(1)} className="p-2 hover:bg-slate-50 rounded"><ChevronRight size={20}/></button>
          </div>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDates.map((date) => {
          const dateStr = formatDate(date);
          const plan = menuPlans.find(p => p.date === dateStr);
          const isToday = formatDate(new Date()) === dateStr;

          const lunchIds = plan?.lunchRecipeIds || [];
          const dinnerIds = plan?.dinnerRecipeIds || [];
          const lunchImg = plan?.lunchImage;
          const dinnerImg = plan?.dinnerImage;

          return (
            <div key={dateStr} className={`bg-white rounded-xl border ${isToday ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'} p-3 flex flex-col gap-3 min-h-[400px]`}>
              <div className="flex justify-center items-center pb-2 border-b border-slate-100 relative">
                 <div className="text-center">
                    <span className="block text-xs font-bold text-slate-400 uppercase">{date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                    <span className={`block text-lg font-bold ${isToday ? 'text-emerald-600' : 'text-slate-800'}`}>{date.getDate()}</span>
                 </div>
              </div>

              {renderRecipeSlot(dateStr, 'lunch', lunchIds, lunchImg)}
              {renderRecipeSlot(dateStr, 'dinner', dinnerIds, dinnerImg)}
            </div>
          );
        })}
      </div>

      <RecipePicker 
        isOpen={!!showPicker}
        onClose={() => setShowPicker(null)}
        onSelect={handleRecipeSelect}
        recipes={recipes}
        ingredients={ingredients}
        title={showPicker ? `Select for ${showPicker.type} (${showPicker.date})` : ''}
      />

      {/* AI Suggestions Modal */}
      {showAiModal && (
         <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                  <Sparkles size={20} className="text-indigo-500"/> Chef AI Suggestions
                </h3>
                <button onClick={() => setShowAiModal(false)}><XCircle size={24} className="text-slate-400"/></button>
              </div>
              
              {loadingAi ? (
                <div className="py-12 text-center text-indigo-400">Thinking up delicious ideas...</div>
              ) : (
                <div className="space-y-3">
                   {aiSuggestions.map((s, idx) => (
                      <div key={idx} className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                        <div className="font-bold text-indigo-900 text-lg">{s.name}</div>
                        <div className="text-sm text-indigo-700 mt-1">{s.description}</div>
                        {s.missingIngredients && s.missingIngredients !== 'None' && (
                          <div className="text-xs text-red-500 mt-2 font-medium bg-white/50 p-1 rounded inline-block">Missing: {s.missingIngredients}</div>
                        )}
                      </div>
                    ))}
                    {aiSuggestions.length === 0 && <p className="text-center text-slate-400">Could not generate suggestions.</p>}
                </div>
              )}
           </div>
         </div>
      )}
    </div>
  );
};

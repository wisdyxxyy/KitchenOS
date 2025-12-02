import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Recipe, RecipeIngredient } from '../types';
import { Plus, Trash2, Edit2, Wand2, Loader2, Save, X, ChefHat, Search, Filter, ChevronDown, Check, Image as ImageIcon, Upload, Egg, AlertCircle } from 'lucide-react';
import { parseRecipeFromText } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { RecipeModal } from '../components/RecipeModal';
import { useLocation } from 'react-router-dom';
import { convertFileToBase64 } from '../utils/imageUtils';

export const Recipes: React.FC = () => {
  const { recipes, ingredients, addRecipe, deleteRecipe, updateRecipe, addIngredient } = useApp();
  const location = useLocation();

  const [isEditing, setIsEditing] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [parseText, setParseText] = useState('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [ingredientFilter, setIngredientFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('All');

  // View State
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

  // Form State
  const [currentRecipe, setCurrentRecipe] = useState<Partial<Recipe>>({
    name: '',
    ingredients: [],
    steps: [],
    tags: [],
    image: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recipeNameInputRef = useRef<HTMLInputElement>(null);

  // Ingredient Dropdown State
  const [activeIngredientIndex, setActiveIngredientIndex] = useState<number | null>(null);

  // Handle auto-open edit from Dashboard redirect
  useEffect(() => {
    if (location.state && location.state.editRecipeId) {
      const r = recipes.find(r => r.id === location.state.editRecipeId);
      if (r) {
        startEditing(r);
        // Clean up state so refreshing doesn't re-trigger
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, recipes]);

  // Auto-focus name when editing starts
  useEffect(() => {
    if (isEditing && recipeNameInputRef.current) {
      recipeNameInputRef.current.focus();
    }
  }, [isEditing]);

  // Check duplicate name
  const isDuplicateName = currentRecipe.name && recipes.some(r => 
    r.name.trim().toLowerCase() === currentRecipe.name!.trim().toLowerCase() && r.id !== currentRecipe.id
  );

  // Get unique tags for filter
  const allTags = Array.from(new Set(recipes.flatMap(r => r.tags))).sort();

  // Sort ingredients for the dropdown
  const sortedIngredients = [...ingredients].sort((a, b) => a.name.localeCompare(b.name));

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by specific ingredient name
    const matchesIngredient = ingredientFilter === '' || r.ingredients.some(i => i.name.toLowerCase().includes(ingredientFilter.toLowerCase()));
    
    const matchesTag = tagFilter === 'All' || r.tags.includes(tagFilter);
    return matchesSearch && matchesTag && matchesIngredient;
  });

  const handleAiParse = async () => {
    if (!parseText) return;
    setLoadingAi(true);
    const result = await parseRecipeFromText(parseText);
    setLoadingAi(false);
    if (result) {
      setCurrentRecipe({ ...result, tags: result.tags || [], ingredients: result.ingredients || [] });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await convertFileToBase64(e.target.files[0]);
        setCurrentRecipe(prev => ({ ...prev, image: base64 }));
      } catch (err) {
        console.error("Image upload failed", err);
        alert("Failed to upload image.");
      }
    }
  };

  const handleSave = async () => {
    if (!currentRecipe.name) return;

    if (isDuplicateName) {
      if (!confirm("A recipe with this name already exists. Do you want to continue?")) return;
    }

    // 1. Auto-create missing ingredients in Inventory
    // We use a simple loop, but ideally we should wait for promises. 
    // However, Firestore writes are async/optimistic.
    for (const recipeIng of (currentRecipe.ingredients || [])) {
      const rawName = recipeIng.name.trim();
      if (!rawName) continue;

      // Check existence case-insensitively
      const exists = ingredients.some(invIng => invIng.name.toLowerCase() === rawName.toLowerCase());

      if (!exists) {
        // Add new ingredient to inventory with default values
        try {
          await addIngredient({
            id: uuidv4(),
            name: rawName.charAt(0).toUpperCase() + rawName.slice(1), // Capitalize
            quantity: 0, // Default to 0 stock
            unit: 'pcs',
            category: 'other',
            lowStockThreshold: 1,
            showInRestockList: true, // Default to showing in restock list
            updatedAt: new Date().toISOString()
          });
        } catch (e) {
          console.error("Failed to auto-create ingredient", e);
        }
      }
    }
    
    // 2. Save Recipe
    const recipeData = {
         name: currentRecipe.name,
         ingredients: currentRecipe.ingredients || [],
         steps: currentRecipe.steps || [],
         tags: currentRecipe.tags || [],
         description: currentRecipe.description || '',
         prepTime: currentRecipe.prepTime || '30 min',
         image: currentRecipe.image
    };

    try {
      if (currentRecipe.id) {
         // Update existing
         await updateRecipe(currentRecipe.id, recipeData);
      } else {
        // Add new
        const newRecipe: Recipe = {
          id: uuidv4(),
          ...recipeData
        };
        await addRecipe(newRecipe);
      }
      setIsEditing(false);
      resetForm();
    } catch (error) {
       // Global error handler in AppContext/App.tsx will catch db errors if strict rules
    }
  };

  const resetForm = () => {
    setCurrentRecipe({ name: '', ingredients: [], steps: [], tags: [], image: '' });
    setParseText('');
  };

  const startEditing = (recipe: Recipe) => {
    setCurrentRecipe({ ...recipe });
    setIsEditing(true);
    setViewingRecipe(null);
  };

  const addIngredientLine = () => {
    setCurrentRecipe(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), { name: '', quantity: '' }]
    }));
  };

  const updateIngredientLine = (idx: number, field: keyof RecipeIngredient, val: string) => {
     const newIngs = [...(currentRecipe.ingredients || [])];
     newIngs[idx] = { ...newIngs[idx], [field]: val };
     setCurrentRecipe(prev => ({ ...prev, ingredients: newIngs }));
  };

  const removeIngredientLine = (idx: number) => {
    const newIngs = [...(currentRecipe.ingredients || [])];
    newIngs.splice(idx, 1);
    setCurrentRecipe(prev => ({ ...prev, ingredients: newIngs }));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Recipes Collection</h1>
          <p className="text-slate-500">Manage your favorite dishes and cooking procedures.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => { resetForm(); setIsEditing(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} /> Add Recipe
          </button>
        )}
      </header>

      <RecipeModal 
        recipe={viewingRecipe} 
        onClose={() => setViewingRecipe(null)} 
        onEdit={startEditing} 
      />

      {isEditing ? (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-visible animate-in zoom-in-95 duration-200 relative">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center rounded-t-2xl">
            <h2 className="text-lg font-bold text-slate-700">{currentRecipe.id ? 'Edit Recipe' : 'New Recipe'}</h2>
            <button onClick={() => setIsEditing(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
               {/* Image Upload Section */}
               <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Recipe Image</label>
                <div 
                  className="relative w-full h-48 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden group cursor-pointer hover:border-emerald-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {currentRecipe.image ? (
                    <>
                      <img src={currentRecipe.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium flex items-center gap-2"><Edit2 size={16}/> Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <ImageIcon size={32} className="mb-2" />
                      <span className="text-sm">Click to upload photo</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
                {currentRecipe.image && (
                   <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentRecipe(prev => ({...prev, image: ''})) }}
                    className="text-xs text-red-500 hover:text-red-700 mt-1 flex items-center gap-1"
                   >
                     <Trash2 size={12}/> Remove image
                   </button>
                )}
               </div>

              {/* AI Parser */}
              {!currentRecipe.id && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <label className="block text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
                    <Wand2 size={16} /> AI Quick Import
                  </label>
                  <textarea 
                    className="w-full p-3 rounded-lg border-indigo-200 focus:ring-2 focus:ring-indigo-400 text-sm bg-white text-slate-900 placeholder:text-slate-400"
                    rows={3}
                    placeholder="Paste any text here... e.g. 'Spaghetti Carbonara: 2 eggs, 100g pancetta, 200g pasta. Fry pancetta, mix eggs...'"
                    value={parseText}
                    onChange={e => setParseText(e.target.value)}
                  ></textarea>
                  <button 
                    onClick={handleAiParse}
                    disabled={loadingAi}
                    className="mt-2 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loadingAi ? <Loader2 size={14} className="animate-spin" /> : 'Parse with AI'}
                  </button>
                </div>
              )}

              <div>
                <label className="label text-slate-700 font-medium mb-1 block">Recipe Name</label>
                <input 
                  ref={recipeNameInputRef}
                  type="text" 
                  className={`w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${isDuplicateName ? 'border-amber-500 focus:ring-amber-500 focus:border-amber-500' : ''}`}
                  value={currentRecipe.name}
                  onChange={e => setCurrentRecipe({...currentRecipe, name: e.target.value})}
                />
                {isDuplicateName && (
                  <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> Name already exists
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="label text-slate-700 font-medium mb-1 block">Prep Time</label>
                   <input 
                    type="text" 
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500" 
                    placeholder="e.g. 30 min"
                    value={currentRecipe.prepTime}
                    onChange={e => setCurrentRecipe({...currentRecipe, prepTime: e.target.value})}
                  />
                </div>
                 <div>
                   <label className="label text-slate-700 font-medium mb-1 block">Tags (comma separated)</label>
                   <input 
                    type="text" 
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500" 
                    placeholder="e.g. Italian, Dinner"
                    value={currentRecipe.tags?.join(', ')}
                    onChange={e => setCurrentRecipe({...currentRecipe, tags: e.target.value.split(',').map(s => s.trim())})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
               <div>
                 <div className="flex justify-between items-center mb-2">
                   <label className="font-bold text-sm text-slate-700">Ingredients</label>
                   <button onClick={addIngredientLine} className="text-xs text-emerald-600 font-bold hover:underline">+ Add Line</button>
                 </div>
                 <div className="space-y-2">
                   {currentRecipe.ingredients?.map((ing, idx) => (
                     <div key={idx} className="flex gap-2 group items-start z-10">
                       <input 
                        placeholder="Qty" 
                        className="w-24 p-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 h-[38px]"
                        value={ing.quantity}
                        onChange={e => updateIngredientLine(idx, 'quantity', e.target.value)}
                       />
                       
                       {/* Custom Ingredient Select Combobox */}
                       <div className="flex-1 relative">
                          <div className="relative">
                            <input 
                              placeholder="Ingredient Name" 
                              className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 pr-8 h-[38px]"
                              value={ing.name}
                              onChange={e => updateIngredientLine(idx, 'name', e.target.value)}
                              onFocus={() => setActiveIngredientIndex(idx)}
                              onBlur={() => setTimeout(() => setActiveIngredientIndex(null), 200)}
                            />
                            <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                          </div>
                          
                          {activeIngredientIndex === idx && (
                            <div className="absolute z-50 w-full bg-white border border-slate-200 shadow-xl max-h-60 overflow-y-auto rounded-lg mt-1 left-0 animate-in fade-in zoom-in-95 duration-100">
                               {sortedIngredients
                                  .filter(i => i.name.toLowerCase().includes(ing.name.toLowerCase()))
                                  .map(i => (
                                    <div 
                                      key={i.id}
                                      className="px-3 py-2 hover:bg-emerald-50 cursor-pointer text-sm text-slate-700 flex justify-between items-center border-b border-slate-50 last:border-0"
                                      onMouseDown={(e) => {
                                          e.preventDefault(); // Prevent blur before click registers
                                          updateIngredientLine(idx, 'name', i.name);
                                          setActiveIngredientIndex(null);
                                      }}
                                    >
                                      <span className="font-medium">{i.name}</span>
                                      {ing.name.toLowerCase() === i.name.toLowerCase() && <Check size={14} className="text-emerald-600"/>}
                                    </div>
                                  ))
                               }
                               {sortedIngredients.filter(i => i.name.toLowerCase().includes(ing.name.toLowerCase())).length === 0 && (
                                 <div className="px-3 py-2 text-xs text-slate-500 bg-slate-50 italic">
                                   {ing.name ? `New item "${ing.name}" will be added to inventory` : 'Start typing to search inventory...'}
                                 </div>
                               )}
                            </div>
                          )}
                       </div>

                       <button onClick={() => removeIngredientLine(idx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                         <X size={16} />
                       </button>
                     </div>
                   ))}
                   {(!currentRecipe.ingredients || currentRecipe.ingredients.length === 0) && (
                     <div className="text-sm text-slate-400 italic text-center py-2 bg-slate-50 rounded-lg">No ingredients added yet</div>
                   )}
                   <div className="text-xs text-slate-400 mt-2 text-center bg-blue-50/50 p-2 rounded">
                     Tip: Select from the list or type a new name to auto-create it in your Inventory!
                   </div>
                 </div>
               </div>

               <div>
                <label className="font-bold text-sm text-slate-700 mb-2 block">Instructions (One per line)</label>
                <textarea 
                  className="w-full p-3 border border-slate-300 rounded-lg text-sm h-48 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 font-mono"
                  value={currentRecipe.steps?.join('\n')}
                  onChange={e => setCurrentRecipe({...currentRecipe, steps: e.target.value.split('\n')})}
                  placeholder="1. Boil water...&#10;2. Add pasta..."
                ></textarea>
               </div>
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
             <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 font-medium hover:text-slate-900">Cancel</button>
             <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 flex items-center gap-2">
               <Save size={18} /> {currentRecipe.id ? 'Update Recipe' : 'Save Recipe'}
             </button>
          </div>
        </div>
      ) : (
        <>
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search recipe names..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="relative w-full md:w-64">
              <Egg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Filter by ingredient..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                value={ingredientFilter}
                onChange={e => setIngredientFilter(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="text-slate-400" size={18} />
              <select 
                className="w-full md:w-48 p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
              >
                <option value="All">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <div 
                key={recipe.id} 
                onClick={() => setViewingRecipe(recipe)}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative cursor-pointer overflow-hidden"
              >
                {/* Image Background if available */}
                {recipe.image && (
                  <div className="absolute top-0 left-0 w-full h-24 overflow-hidden z-0 opacity-20 group-hover:opacity-30 transition-opacity">
                    <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover blur-sm scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
                  </div>
                )}

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); startEditing(recipe); }} 
                    className="p-2 bg-white text-blue-500 rounded-full shadow-sm hover:bg-blue-50 border border-slate-100"
                  >
                    <Edit2 size={16}/>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteRecipe(recipe.id); }} 
                    className="p-2 bg-white text-red-500 rounded-full shadow-sm hover:bg-red-50 border border-slate-100"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
                
                <div className="flex items-center gap-3 mb-4 relative z-0">
                  <div className={`text-emerald-600 p-3 rounded-xl flex-shrink-0 ${recipe.image ? 'bg-white/80 backdrop-blur shadow-sm' : 'bg-emerald-100'}`}>
                    {recipe.image ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden">
                           <img src={recipe.image} alt="icon" className="w-full h-full object-cover" />
                        </div>
                    ) : <ChefHat size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{recipe.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{recipe.ingredients.length} ingredients • {recipe.prepTime}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4 relative z-0">
                  {recipe.tags.map((tag, i) => (
                    <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{tag}</span>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4 relative z-0">
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {recipe.ingredients.map(i => i.name).join(', ')}
                  </p>
                </div>
              </div>
            ))}
            {filteredRecipes.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400">
                {recipes.length === 0 ? "No recipes yet. Add one or ask AI to help!" : "No recipes match your search."}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
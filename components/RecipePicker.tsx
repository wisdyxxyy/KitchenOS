
import React, { useState } from 'react';
import { Recipe, Ingredient } from '../types';
import { Search, Filter, CheckCircle2, XCircle, Sparkles, Egg } from 'lucide-react';

interface RecipePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (recipeId: string) => void;
  recipes: Recipe[];
  ingredients: Ingredient[];
  title?: string;
}

export const RecipePicker: React.FC<RecipePickerProps> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  recipes, 
  ingredients,
  title = "Select Recipe" 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ingredientFilter, setIngredientFilter] = useState('');
  const [filterAvailable, setFilterAvailable] = useState(false);

  if (!isOpen) return null;

  const checkAvailability = (recipe: Recipe): 'full' | 'partial' | 'missing' => {
    let foundCount = 0;
    recipe.ingredients.forEach(ri => {
      const exists = ingredients.some(i => 
        i.name.toLowerCase().includes(ri.name.toLowerCase()) && i.quantity > 0
      );
      if (exists) foundCount++;
    });

    if (foundCount === recipe.ingredients.length) return 'full';
    if (foundCount > 0) return 'partial';
    return 'missing';
  };

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by specific ingredient name
    const matchesIngredient = ingredientFilter === '' || r.ingredients.some(i => i.name.toLowerCase().includes(ingredientFilter.toLowerCase()));
    
    if (filterAvailable) {
      return matchesSearch && matchesIngredient && checkAvailability(r) !== 'missing';
    }
    return matchesSearch && matchesIngredient;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <p className="text-sm text-slate-500">Search and select a dish to add</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <XCircle size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search recipes..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="relative flex-1">
              <Egg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Include ingredient..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={ingredientFilter}
                onChange={e => setIngredientFilter(e.target.value)}
              />
            </div>
          </div>
          
          <button 
            onClick={() => setFilterAvailable(!filterAvailable)}
            className={`self-start flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterAvailable ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'}`}
          >
            <Filter size={16} /> Available Only
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-4 grid grid-cols-1 gap-2 bg-slate-50/50 flex-1">
          {filteredRecipes.map(recipe => {
            const status = checkAvailability(recipe);
            return (
              <button 
                key={recipe.id}
                onClick={() => onSelect(recipe.id)}
                className="text-left bg-white border border-slate-200 p-4 rounded-xl hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500 transition-all group shadow-sm"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-800 group-hover:text-emerald-700">{recipe.name}</h3>
                  {status === 'full' && <CheckCircle2 size={18} className="text-emerald-500" />}
                  {status === 'partial' && <div className="w-3 h-3 rounded-full bg-amber-400 mt-1" title="Partial ingredients" />}
                  {status === 'missing' && <div className="w-3 h-3 rounded-full bg-red-400 mt-1" title="Missing ingredients" />}
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {recipe.ingredients.map(i => i.name).join(', ')}
                </p>
              </button>
            );
          })}
          {filteredRecipes.length === 0 && (
             <div className="text-center py-12 text-slate-400 flex flex-col items-center">
               <Search size={32} className="mb-2 opacity-50"/>
               <p>No recipes match your search.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

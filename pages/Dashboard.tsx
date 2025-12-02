
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, ChefHat, Calendar, ArrowRight, Plus, BarChart3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Recipe } from '../types';
import { RecipeModal } from '../components/RecipeModal';
import { RecipePicker } from '../components/RecipePicker';

export const Dashboard: React.FC = () => {
  const { ingredients, recipes, menuPlans, getRecipeById, updateMenuPlan } = useApp();
  const navigate = useNavigate();
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [showPicker, setShowPicker] = useState<'lunch' | 'dinner' | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const todaysMenu = menuPlans.find(p => p.date === today);
  
  // Filter for dashboard stats: Low Stock & Out of Stock
  // Explicitly check for showInRestockList !== false (default is true if undefined)
  const lowStockItems = ingredients.filter(i => 
    i.quantity <= i.lowStockThreshold && 
    i.quantity > 0 &&
    i.showInRestockList !== false
  );
  
  const outOfStockItems = ingredients.filter(i => 
    i.quantity === 0 &&
    i.showInRestockList !== false
  );

  const lunchRecipes = (todaysMenu?.lunchRecipeIds || []).map(id => getRecipeById(id)).filter(Boolean);
  const dinnerRecipes = (todaysMenu?.dinnerRecipeIds || []).map(id => getRecipeById(id)).filter(Boolean);

  const handleAddRecipe = (recipeId: string) => {
    if (!showPicker) return;
    
    const existing = todaysMenu || { date: today, lunchRecipeIds: [], dinnerRecipeIds: [] };
    const key = showPicker === 'lunch' ? 'lunchRecipeIds' : 'dinnerRecipeIds';
    const currentIds = existing[key] || [];

    if (!currentIds.includes(recipeId)) {
      updateMenuPlan({
        ...existing,
        [key]: [...currentIds, recipeId]
      });
    }
    setShowPicker(null);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    // Navigate to recipes page and pass state to open editor could be done via URL or context
    // For simplicity, we just go to recipes page, the user can find it. 
    // Ideally, we'd use a query param ?edit=id
    navigate('/recipes', { state: { editRecipeId: recipe.id } });
  };

  return (
    <div className="space-y-6">
      <RecipeModal 
        recipe={viewingRecipe} 
        onClose={() => setViewingRecipe(null)} 
        onEdit={handleEditRecipe}
      />
      
      <RecipePicker 
        isOpen={!!showPicker}
        onClose={() => setShowPicker(null)}
        onSelect={handleAddRecipe}
        recipes={recipes}
        ingredients={ingredients}
        title={`Add to ${showPicker === 'lunch' ? 'Lunch' : 'Dinner'} (Today)`}
      />

      <header>
        <h1 className="text-3xl font-bold text-slate-800">Welcome Back</h1>
        <p className="text-slate-500">Here's what's happening in your kitchen today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/stats" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer block group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <ChefHat size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium flex items-center gap-1">Total Recipes <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity"/></p>
              <h3 className="text-2xl font-bold text-slate-800">{recipes.length}</h3>
            </div>
          </div>
        </Link>

        <Link to="/inventory" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer block group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium flex items-center gap-1">Low Stock <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity"/></p>
              <h3 className="text-2xl font-bold text-slate-800">{lowStockItems.length}</h3>
            </div>
          </div>
        </Link>

        <Link to="/inventory" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer block group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium flex items-center gap-1">Out of Stock <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity"/></p>
              <h3 className="text-2xl font-bold text-slate-800">{outOfStockItems.length}</h3>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Menu */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={20} className="text-emerald-500" />
              Today's Menu
            </h2>
            <Link to="/menu" className="text-sm text-emerald-600 font-medium hover:underline">Manage Plan</Link>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lunch</span>
                 <button onClick={() => setShowPicker('lunch')} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded transition-colors" title="Add Item">
                   <Plus size={16} />
                 </button>
              </div>
              
              {lunchRecipes.length > 0 ? (
                <ul className="space-y-2">
                  {lunchRecipes.map((lunch, i) => (
                    <li 
                      key={i} 
                      onClick={() => setViewingRecipe(lunch as Recipe)}
                      className="flex items-center justify-between cursor-pointer hover:bg-white p-2 rounded-lg -mx-2 transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
                    >
                      <h3 className="font-semibold text-slate-800">{lunch!.name}</h3>
                      <span className="text-xs bg-white px-2 py-1 rounded-md border border-slate-200">{lunch!.prepTime || '20 min'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 italic text-sm">No lunch planned</p>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dinner</span>
                 <button onClick={() => setShowPicker('dinner')} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded transition-colors" title="Add Item">
                   <Plus size={16} />
                 </button>
              </div>

              {dinnerRecipes.length > 0 ? (
                 <ul className="space-y-2">
                 {dinnerRecipes.map((dinner, i) => (
                   <li 
                      key={i} 
                      onClick={() => setViewingRecipe(dinner as Recipe)}
                      className="flex items-center justify-between cursor-pointer hover:bg-white p-2 rounded-lg -mx-2 transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
                    >
                     <h3 className="font-semibold text-slate-800">{dinner!.name}</h3>
                     <span className="text-xs bg-white px-2 py-1 rounded-md border border-slate-200">{dinner!.prepTime || '45 min'}</span>
                   </li>
                 ))}
               </ul>
              ) : (
                <p className="text-slate-400 italic text-sm">No dinner planned</p>
              )}
            </div>
          </div>
        </section>

        {/* Shopping List Quick View */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              Restock Needed
            </h2>
            <Link to="/inventory" className="text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1">
              View Inventory <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
             {[...outOfStockItems, ...lowStockItems].slice(0, 5).map(item => (
               <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                 <div className="flex items-center gap-3">
                   <span className={`w-2 h-2 rounded-full ${item.quantity === 0 ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                   <span className="font-medium text-slate-700">{item.name}</span>
                 </div>
                 <div className="text-sm text-slate-500">
                    {item.quantity === 0 ? 'Out of stock' : `${item.quantity} ${item.unit} left`}
                 </div>
               </div>
             ))}
             {outOfStockItems.length === 0 && lowStockItems.length === 0 && (
               <p className="text-slate-400 text-center py-4">Inventory looks great! 🎉</p>
             )}
          </div>
        </section>
      </div>
    </div>
  );
};

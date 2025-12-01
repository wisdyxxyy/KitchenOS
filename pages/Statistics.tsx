import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, Calendar, PieChart, TrendingUp } from 'lucide-react';

export const Statistics: React.FC = () => {
  const { menuPlans, recipes } = useApp();
  
  // Default to current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState(endOfMonth);

  // Stats Logic
  const getStats = () => {
    const plans = menuPlans.filter(p => p.date >= startDate && p.date <= endDate);
    
    const recipeCounts: Record<string, number> = {};
    let totalMeals = 0;

    plans.forEach(p => {
      [...p.lunchRecipeIds, ...p.dinnerRecipeIds].forEach(id => {
        recipeCounts[id] = (recipeCounts[id] || 0) + 1;
        totalMeals++;
      });
    });

    // Aggregate Ingredients
    const ingredientUsage: Record<string, string[]> = {};

    Object.entries(recipeCounts).forEach(([rId, count]) => {
      const recipe = recipes.find(r => r.id === rId);
      if (recipe) {
        recipe.ingredients.forEach(ing => {
          if (!ingredientUsage[ing.name]) ingredientUsage[ing.name] = [];
          // Add usage entry: "200g (x2)"
          ingredientUsage[ing.name].push(`${ing.quantity} (x${count})`);
        });
      }
    });

    const topRecipes = Object.entries(recipeCounts)
      .map(([id, count]) => ({ recipe: recipes.find(r => r.id === id), count }))
      .filter(item => item.recipe)
      .sort((a, b) => b.count - a.count);

    return { totalMeals, topRecipes, ingredientUsage };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Kitchen Statistics</h1>
          <p className="text-slate-500">Review your cooking history and ingredient usage.</p>
        </div>
        
        <div className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <Calendar size={18} className="text-slate-400 ml-2" />
          <input 
            type="date" 
            className="text-sm bg-transparent border-none focus:ring-0 text-slate-700 font-medium"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <span className="text-slate-300">—</span>
           <input 
            type="date" 
            className="text-sm bg-transparent border-none focus:ring-0 text-slate-700 font-medium"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
           <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={24}/></div>
           <div>
             <p className="text-slate-500 text-sm font-medium">Total Dishes Cooked</p>
             <h3 className="text-3xl font-bold text-slate-800">{stats.totalMeals}</h3>
           </div>
         </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
           <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><BarChart3 size={24}/></div>
           <div>
             <p className="text-slate-500 text-sm font-medium">Unique Recipes</p>
             <h3 className="text-3xl font-bold text-slate-800">{stats.topRecipes.length}</h3>
           </div>
         </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
           <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><PieChart size={24}/></div>
           <div>
             <p className="text-slate-500 text-sm font-medium">Ingredients Used</p>
             <h3 className="text-3xl font-bold text-slate-800">{Object.keys(stats.ingredientUsage).length}</h3>
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Recipes */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Top Dishes</h2>
          <div className="space-y-4">
            {stats.topRecipes.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                 <div className="flex items-center gap-3">
                   <span className="w-6 h-6 flex items-center justify-center bg-slate-200 rounded-full text-xs font-bold text-slate-600">{idx + 1}</span>
                   <span className="font-medium text-slate-700">{item.recipe?.name}</span>
                 </div>
                 <div className="text-sm font-bold text-emerald-600">{item.count} times</div>
              </div>
            ))}
            {stats.topRecipes.length === 0 && <p className="text-slate-400 italic">No data for this period.</p>}
          </div>
        </section>

        {/* Ingredient Consumption Report */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Ingredient Consumption</h2>
          <div className="overflow-y-auto max-h-[300px] pr-2 custom-scrollbar space-y-2">
            {Object.entries(stats.ingredientUsage).map(([name, quantities], idx) => (
              <div key={idx} className="text-sm border-b border-slate-50 pb-2 last:border-0">
                <div className="flex justify-between">
                   <span className="font-medium text-slate-700">{name}</span>
                   <span className="text-slate-400 text-xs">{quantities.length} items cooked</span>
                </div>
                <div className="text-slate-500 text-xs mt-1">
                  Required: {quantities.join(', ')}
                </div>
              </div>
            ))}
             {Object.keys(stats.ingredientUsage).length === 0 && <p className="text-slate-400 italic">No data for this period.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};
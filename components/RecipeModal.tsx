
import React from 'react';
import { Recipe, Ingredient } from '../types';
import { X, Clock, Utensils, ChefHat, BookOpen, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  onEdit?: (recipe: Recipe) => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose, onEdit }) => {
  const { ingredients } = useApp();

  if (!recipe) return null;

  const getIngredientStatus = (recipeIngName: string) => {
    const invItem = ingredients.find(i => i.name.trim().toLowerCase() === recipeIngName.trim().toLowerCase());
    if (!invItem) return { hasStock: false, quantity: 0, unit: '' };
    return { hasStock: invItem.quantity > 0, quantity: invItem.quantity, unit: invItem.unit };
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {/* Header Image */}
          {recipe.image && (
             <div className="w-full h-48 rounded-t-2xl overflow-hidden relative">
               <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
             </div>
          )}
          
          <div className={`p-6 border-b border-slate-100 flex justify-between items-start ${recipe.image ? 'absolute bottom-0 left-0 right-0 border-none text-white' : 'bg-slate-50/50 rounded-t-2xl'}`}>
            <div>
              <h2 className={`text-2xl font-bold ${recipe.image ? 'text-white drop-shadow-md' : 'text-slate-800'}`}>{recipe.name}</h2>
              <div className="flex gap-2 mt-2 flex-wrap">
                 {recipe.tags.map((tag, i) => (
                  <span 
                    key={i} 
                    className={`text-xs px-2 py-1 rounded-md font-medium border ${recipe.image ? 'bg-black/30 border-white/20 text-white' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
          </div>
           <button onClick={onClose} className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${recipe.image ? 'bg-black/30 text-white hover:bg-black/50' : 'hover:bg-slate-200 text-slate-400'}`}>
              <X size={24} />
            </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 bg-white">
          <div className="flex gap-6 text-sm text-slate-500 border-b border-slate-100 pb-4">
            <span className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full"><Clock size={16} /> {recipe.prepTime || '30 mins'}</span>
            <span className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full"><Utensils size={16} /> {recipe.ingredients.length} Ingredients</span>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><ChefHat size={20}/></div>
              Ingredients Check
            </h3>
            <ul className="grid grid-cols-1 gap-2">
              {recipe.ingredients.map((ing, i) => {
                const status = getIngredientStatus(ing.name);
                return (
                  <li key={i} className={`flex justify-between items-center p-3 border rounded-xl ${status.hasStock ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                    <div className="flex items-center gap-3">
                       {status.hasStock ? (
                         <CheckCircle2 size={18} className="text-emerald-500" />
                       ) : (
                         <AlertCircle size={18} className="text-red-400" />
                       )}
                       <div>
                         <span className="font-medium text-slate-700 block">{ing.name}</span>
                         <span className="text-xs text-slate-400">Recipe needs: {ing.quantity}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className={`text-sm font-bold ${status.hasStock ? 'text-emerald-700' : 'text-red-500'}`}>
                         {status.hasStock ? 'Available' : 'Missing'}
                       </span>
                       {status.hasStock && (
                         <div className="text-xs text-emerald-600/80">Stock: {status.quantity} {status.unit}</div>
                       )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><BookOpen size={20}/></div>
              Instructions
            </h3>
            <div className="space-y-4">
              {recipe.steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {i + 1}
                  </div>
                  <p className="text-slate-600 leading-relaxed mt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between rounded-b-2xl">
          {onEdit && (
            <button 
              onClick={() => { onClose(); onEdit(recipe); }}
              className="px-5 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2 transition-colors"
            >
              <Edit2 size={16} /> Edit Recipe
            </button>
          )}
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 transition-colors ml-auto shadow-md shadow-slate-200">Close</button>
        </div>
      </div>
    </div>
  );
};

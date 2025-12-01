
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ingredient, Recipe, MenuPlan, SyncConfig } from '../types';
import { createBin, readBin, updateBin } from '../services/syncService';

interface AppContextType {
  ingredients: Ingredient[];
  recipes: Recipe[];
  menuPlans: MenuPlan[];
  syncConfig: SyncConfig | null;
  addIngredient: (ing: Ingredient) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  updateMenuPlan: (plan: MenuPlan) => void;
  getRecipeById: (id: string) => Recipe | undefined;
  checkLowStock: () => Ingredient[];
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  clearAllData: () => void;
  saveSyncConfig: (apiKey: string, binId: string) => void;
  clearSyncConfig: () => void;
  syncPush: () => Promise<void>;
  syncPull: () => Promise<void>;
  createSyncBin: (apiKey: string) => Promise<string>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  INGREDIENTS: 'skm_ingredients',
  RECIPES: 'skm_recipes',
  MENU: 'skm_menu',
  SYNC: 'skm_sync_config'
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menuPlans, setMenuPlans] = useState<MenuPlan[]>([]);
  const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    const savedIngredients = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
    const savedRecipes = localStorage.getItem(STORAGE_KEYS.RECIPES);
    const savedMenu = localStorage.getItem(STORAGE_KEYS.MENU);
    const savedSync = localStorage.getItem(STORAGE_KEYS.SYNC);

    if (savedIngredients) setIngredients(JSON.parse(savedIngredients));
    if (savedRecipes) setRecipes(JSON.parse(savedRecipes));
    if (savedSync) setSyncConfig(JSON.parse(savedSync));
    
    if (savedMenu) {
      const parsed = JSON.parse(savedMenu);
      // Migration: Convert single ID to Array if necessary (Handle legacy data)
      const migratedMenu = parsed.map((p: any) => {
        // Migrate old 'image' to 'dinnerImage' if 'dinnerImage' is empty
        let dinnerImg = p.dinnerImage;
        if (!dinnerImg && p.image) {
          dinnerImg = p.image;
        }

        return {
          date: p.date,
          lunchRecipeIds: p.lunchRecipeIds || (p.lunchRecipeId ? [p.lunchRecipeId] : []),
          dinnerRecipeIds: p.dinnerRecipeIds || (p.dinnerRecipeId ? [p.dinnerRecipeId] : []),
          notes: p.notes,
          lunchImage: p.lunchImage,
          dinnerImage: dinnerImg
        };
      });
      setMenuPlans(migratedMenu);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuPlans));
  }, [menuPlans]);
  
  useEffect(() => {
    if (syncConfig) {
      localStorage.setItem(STORAGE_KEYS.SYNC, JSON.stringify(syncConfig));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SYNC);
    }
  }, [syncConfig]);

  const addIngredient = (ing: Ingredient) => {
    setIngredients(prev => [...prev, ing]);
  };

  const updateIngredient = (id: string, updates: Partial<Ingredient>) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i));
  };

  const deleteIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  };

  const addRecipe = (recipe: Recipe) => {
    setRecipes(prev => [...prev, recipe]);
  };

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRecipe = (id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  const updateMenuPlan = (plan: MenuPlan) => {
    setMenuPlans(prev => {
      const existing = prev.find(p => p.date === plan.date);
      if (existing) {
        return prev.map(p => p.date === plan.date ? { ...p, ...plan } : p);
      }
      return [...prev, plan];
    });
  };

  const getRecipeById = (id: string) => recipes.find(r => r.id === id);

  const checkLowStock = () => {
    return ingredients.filter(i => i.quantity <= i.lowStockThreshold && i.quantity > 0);
  };

  // --- Import / Export Logic (Reused by Sync) ---

  const exportData = () => {
    // Export ingredients with quantity set to 0 to respect local inventory privacy/state
    const ingredientsExport = ingredients.map(i => ({
      ...i,
      quantity: 0
    }));

    const data = {
      ingredients: ingredientsExport,
      recipes,
      // menuPlans are NOT exported to keep them local
      version: 1,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      // Basic validation
      if (!Array.isArray(data.ingredients) || !Array.isArray(data.recipes)) {
        console.error("Invalid data format: missing arrays");
        return false;
      }
      
      // Merge Ingredients: Preserve local quantities if item exists
      // If item is new (not in local state), defaults to 0 (as per export or default)
      const mergedIngredients = data.ingredients.map((importIng: Ingredient) => {
        const existing = ingredients.find(i => i.id === importIng.id);
        return {
          ...importIng,
          quantity: existing ? existing.quantity : 0
        };
      });
      
      // Load data
      setIngredients(mergedIngredients);
      setRecipes(data.recipes);
      // menuPlans are NOT imported to preserve local schedule
      return true;
    } catch (e) {
      console.error("Import failed:", e);
      return false;
    }
  };

  const clearAllData = () => {
    setIngredients([]);
    setRecipes([]);
    setMenuPlans([]);
    localStorage.removeItem(STORAGE_KEYS.INGREDIENTS);
    localStorage.removeItem(STORAGE_KEYS.RECIPES);
    localStorage.removeItem(STORAGE_KEYS.MENU);
  };

  // --- Cloud Sync Logic ---

  const saveSyncConfig = (apiKey: string, binId: string) => {
    setSyncConfig({ apiKey: apiKey.trim(), binId: binId.trim() });
  };

  const clearSyncConfig = () => {
    setSyncConfig(null);
  };

  const syncPush = async () => {
    if (!syncConfig) throw new Error("Sync not configured");
    
    // Use exportData logic to ensure quantities and menuPlans are excluded
    const jsonString = exportData();
    const data = JSON.parse(jsonString);

    await updateBin(syncConfig.binId, syncConfig.apiKey, data);
    
    setSyncConfig(prev => prev ? { ...prev, lastSynced: new Date().toISOString() } : null);
  };

  const syncPull = async () => {
    if (!syncConfig) throw new Error("Sync not configured");
    
    const response = await readBin(syncConfig.binId, syncConfig.apiKey);
    
    // JSONBin returns data wrapped in 'record'
    if (response.record) {
      // Use importData logic to ensure local quantities and menuPlans are preserved
      importData(JSON.stringify(response.record));
      setSyncConfig(prev => prev ? { ...prev, lastSynced: new Date().toISOString() } : null);
    }
  };

  const createSyncBin = async (apiKey: string): Promise<string> => {
     // Create initial bin with current data (sanitized)
     const jsonString = exportData();
     const data = JSON.parse(jsonString);
     
     const response = await createBin(apiKey, data);
     return response.metadata.id;
  };

  return (
    <AppContext.Provider value={{
      ingredients,
      recipes,
      menuPlans,
      syncConfig,
      addIngredient,
      updateIngredient,
      deleteIngredient,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      updateMenuPlan,
      getRecipeById,
      checkLowStock,
      exportData,
      importData,
      clearAllData,
      saveSyncConfig,
      clearSyncConfig,
      syncPush,
      syncPull,
      createSyncBin
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

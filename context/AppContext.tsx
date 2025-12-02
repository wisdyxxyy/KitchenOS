
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ingredient, Recipe, MenuPlan, User } from '../types';
import { auth, db } from '../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

interface AppContextType {
  user: User | null;
  loading: boolean;
  ingredients: Ingredient[];
  recipes: Recipe[];
  menuPlans: MenuPlan[];
  
  // Auth Methods
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;

  // Data Methods
  addIngredient: (ing: Ingredient) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  updateMenuPlan: (plan: MenuPlan) => void;
  getRecipeById: (id: string) => Recipe | undefined;
  checkLowStock: () => Ingredient[];
  
  // Legacy / Utility
  exportData: () => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menuPlans, setMenuPlans] = useState<MenuPlan[]>([]);

  // 1. Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        });
      } else {
        setUser(null);
        // Clear data on logout
        setIngredients([]);
        setRecipes([]);
        setMenuPlans([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Firestore Collections when User is logged in
  useEffect(() => {
    if (!user) return;

    // Listeners using Modular SDK
    const ingredientsRef = collection(db, 'users', user.uid, 'ingredients');
    const recipesRef = collection(db, 'users', user.uid, 'recipes');
    const menuRef = collection(db, 'users', user.uid, 'menuPlans');

    const unsubIngredients = onSnapshot(ingredientsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ingredient));
      setIngredients(data);
    });

    const unsubRecipes = onSnapshot(recipesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
      setRecipes(data);
    });

    const unsubMenu = onSnapshot(menuRef, (snapshot) => {
      const data = snapshot.docs.map(doc => {
         const d = doc.data();
         // Handle legacy format if any
         let dinnerImg = d.dinnerImage;
         if (!dinnerImg && d.image) dinnerImg = d.image;

         return {
           date: d.date,
           lunchRecipeIds: d.lunchRecipeIds || (d.lunchRecipeId ? [d.lunchRecipeId] : []),
           dinnerRecipeIds: d.dinnerRecipeIds || (d.dinnerRecipeId ? [d.dinnerRecipeId] : []),
           notes: d.notes,
           lunchImage: d.lunchImage,
           dinnerImage: dinnerImg
         } as MenuPlan;
      });
      setMenuPlans(data);
    });

    return () => {
      unsubIngredients();
      unsubRecipes();
      unsubMenu();
    };
  }, [user]);

  // --- Auth Wrappers ---
  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  // --- CRUD Methods (Modular SDK) ---

  const addIngredient = async (ing: Ingredient) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'ingredients', ing.id), ing);
    } catch (e) { console.error("Error adding ingredient", e); }
  };

  const updateIngredient = async (id: string, updates: Partial<Ingredient>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'ingredients', id), updates, { merge: true });
    } catch (e) { console.error("Error updating ingredient", e); }
  };

  const deleteIngredient = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'ingredients', id));
    } catch (e) { console.error("Error deleting ingredient", e); }
  };

  const addRecipe = async (recipe: Recipe) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'recipes', recipe.id), recipe);
    } catch (e) { console.error("Error adding recipe", e); }
  };

  const updateRecipe = async (id: string, updates: Partial<Recipe>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'recipes', id), updates, { merge: true });
    } catch (e) { console.error("Error updating recipe", e); }
  };

  const deleteRecipe = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'recipes', id));
    } catch (e) { console.error("Error deleting recipe", e); }
  };

  const updateMenuPlan = async (plan: MenuPlan) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'menuPlans', plan.date), plan);
    } catch (e) { console.error("Error updating menu", e); }
  };

  const getRecipeById = (id: string) => recipes.find(r => r.id === id);

  const checkLowStock = () => {
    return ingredients.filter(i => i.quantity <= i.lowStockThreshold && i.quantity > 0);
  };

  // --- Export Logic ---
  const exportData = () => {
    const ingredientsExport = ingredients.map(i => ({
      ...i,
      quantity: 0
    }));

    const data = {
      ingredients: ingredientsExport,
      recipes,
      version: 1,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  };

  return (
    <AppContext.Provider value={{
      user,
      loading,
      ingredients,
      recipes,
      menuPlans,
      login,
      signup,
      loginWithGoogle,
      logout,
      addIngredient,
      updateIngredient,
      deleteIngredient,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      updateMenuPlan,
      getRecipeById,
      checkLowStock,
      exportData
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

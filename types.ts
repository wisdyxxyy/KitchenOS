
export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'tsp' | 'tbsp' | 'cup' | 'pcs' | 'pack';

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  category: 'vegetable' | 'meat' | 'spice' | 'grain' | 'dairy' | 'other';
  lowStockThreshold: number;
  updatedAt: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: string; // String to allow fuzzy matching or "2 cloves"
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[]; // e.g., "spicy", "quick", "dinner"
  prepTime?: string;
  description?: string;
  image?: string; // Base64 string
}

export interface MenuPlan {
  date: string; // YYYY-MM-DD
  lunchRecipeIds: string[];
  dinnerRecipeIds: string[];
  notes?: string;
  lunchImage?: string; // Base64 string
  dinnerImage?: string; // Base64 string
  /** @deprecated used for migration */
  image?: string; 
}

export type AvailabilityStatus = 'available' | 'partial' | 'missing';

export interface SuggestionResult {
  recipeName: string;
  reason: string;
  matchScore: number;
}

export interface SyncConfig {
  apiKey: string;
  binId: string;
  lastSynced?: string;
}

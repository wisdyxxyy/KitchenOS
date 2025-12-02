
import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, Recipe } from "../types";

// Helper to safely get the API Key in various environments (Vite, Process, etc.)
const getApiKey = () => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
    return (import.meta as any).env.VITE_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return '';
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper to parse a raw text recipe into structured JSON OR Generate one from a name
export const parseRecipeFromText = async (text: string): Promise<Partial<Recipe> | null> => {
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are an expert chef and recipe assistant.
        
        INPUT: "${text}"
        
        TASK:
        Determine if the input is a full recipe text (with steps/ingredients) OR just a request/dish name.
        
        1. **IF Full Text**: Parse the text into the structured JSON format provided. Extract name, ingredients, steps, etc.
        2. **IF Name/Description Only** (e.g., "Spaghetti Carbonara", "I want a spicy chicken dish"): GENERATE a complete, delicious, standard recipe for this request. Invent the ingredients and steps.
        
        IMPORTANT LANGUAGE REQUIREMENT:
        - The Output JSON values MUST be in **Simplified Chinese (简体中文)**.
        - Even if the input is English, translate the result to Chinese.
        - Do NOT translate the JSON Keys (keep 'name', 'ingredients', 'quantity' in English).
        
        REQUIREMENTS:
        - 'ingredients' should be an array of objects with 'name' and 'quantity' (e.g. "200g").
        - 'steps' should be an array of strings.
        - 'tags' should be relevant (e.g., "Dinner", "Italian", "Spicy").
        - 'prepTime' should be estimated (e.g., "30 min").
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            prepTime: { type: Type.STRING },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING }
                }
              }
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini parse error:", error);
    return null;
  }
};

// Helper to suggest recipes based on inventory
export const suggestRecipesFromInventory = async (inventory: Ingredient[]): Promise<any[]> => {
  if (!ai) return [];

  // Filter only items with quantity > 0
  const availableItems = inventory
    .filter(i => i.quantity > 0)
    .map(i => `${i.name} (${i.quantity} ${i.unit})`)
    .join(', ');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `I have these ingredients: ${availableItems}. Suggest 3 creative dishes I can make. Primarily use what I have, but you can suggest adding 1-2 common items if needed. Output in Simplified Chinese (简体中文).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              missingIngredients: { type: Type.STRING, description: "List of ingredients I need to buy, or 'None'" }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini suggestion error:", error);
    return [];
  }
};

import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, Recipe } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper to parse a raw text recipe into structured JSON
export const parseRecipeFromText = async (text: string): Promise<Partial<Recipe> | null> => {
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Extract a structured recipe from the following text. If information is missing, infer reasonable defaults or leave empty. Text: "${text}"`,
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
      contents: `I have these ingredients: ${availableItems}. Suggest 3 creative dishes I can make. Primarily use what I have, but you can suggest adding 1-2 common items if needed.`,
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
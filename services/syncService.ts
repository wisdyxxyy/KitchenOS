import { SyncConfig } from "../types";

const BASE_URL = 'https://api.jsonbin.io/v3/b';

const handleResponse = async (response: Response) => {
  const text = await response.text();
  
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`;
    try {
      const err = JSON.parse(text);
      if (err && err.message) {
        errorMessage = err.message;
      }
    } catch (e) {
      // parsing failed, likely HTML or raw text
      if (text.trim().startsWith('<')) {
           errorMessage = `API returned HTML (Status ${response.status}). Please check your Bin ID and API Key.`;
      } else if (text.length > 0) {
           errorMessage = `API Error ${response.status}: ${text.substring(0, 100)}`;
      }
    }
    throw new Error(errorMessage);
  }

  try {
      return JSON.parse(text);
  } catch (e) {
      throw new Error("Failed to parse API response");
  }
};

export const createBin = async (apiKey: string, data: any): Promise<any> => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': apiKey.trim(),
      'X-Bin-Name': 'SmartKitchenData'
    },
    body: JSON.stringify(data)
  });
  
  return handleResponse(response);
};

export const updateBin = async (binId: string, apiKey: string, data: any): Promise<any> => {
  const response = await fetch(`${BASE_URL}/${binId.trim()}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': apiKey.trim()
    },
    body: JSON.stringify(data)
  });

  return handleResponse(response);
};

export const readBin = async (binId: string, apiKey: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/${binId.trim()}/latest`, {
    method: 'GET',
    headers: {
      'X-Master-Key': apiKey.trim()
    }
  });

  return handleResponse(response);
};

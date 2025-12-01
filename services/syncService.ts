import { SyncConfig } from "../types";

const BASE_URL = 'https://api.jsonbin.io/v3/b';

export const createBin = async (apiKey: string, data: any): Promise<any> => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': apiKey,
      'X-Bin-Name': 'SmartKitchenData'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to create bin');
  }
  return response.json();
};

export const updateBin = async (binId: string, apiKey: string, data: any): Promise<any> => {
  const response = await fetch(`${BASE_URL}/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': apiKey
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to update bin');
  }
  return response.json();
};

export const readBin = async (binId: string, apiKey: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/${binId}/latest`, {
    method: 'GET',
    headers: {
      'X-Master-Key': apiKey
    }
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to read bin');
  }
  return response.json();
};

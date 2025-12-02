
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { FIREBASE_KEYS } from "./keys";

// Determine if we are using Vite (import.meta.env) or standard process.env
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

// --- CONFIGURATION ---
// 1. Try to load from Environment Variables (Best for Vercel/GitHub)
const envConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID")
};

// 2. Manual Fallback using keys.ts
const manualConfig = FIREBASE_KEYS;

// Select config: Env vars take precedence, then keys.ts
const firebaseConfig = {
  apiKey: envConfig.apiKey || manualConfig.apiKey,
  authDomain: envConfig.authDomain || manualConfig.authDomain,
  projectId: envConfig.projectId || manualConfig.projectId,
  storageBucket: envConfig.storageBucket || manualConfig.storageBucket,
  messagingSenderId: envConfig.messagingSenderId || manualConfig.messagingSenderId,
  appId: envConfig.appId || manualConfig.appId
};

// Initialize Firebase
let app: any;
let auth: any;
let db: any;

try {
  if (!firebaseConfig.apiKey) {
    console.error("Firebase Config Missing. Please edit keys.ts and fill in your keys.");
    // We don't throw immediately to allow the UI to render the error banner
  } else {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

export { auth, db };
export default app;

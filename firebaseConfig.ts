
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3jgYXE8wifTe_SCooOA6Ghn9Jp8wxo0w",
  authDomain: "smartkitchen-e27e7.firebaseapp.com",
  projectId: "smartkitchen-e27e7",
  storageBucket: "smartkitchen-e27e7.firebasestorage.app",
  messagingSenderId: "48066300532",
  appId: "1:48066300532:web:a00a1f380863f882769f21"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

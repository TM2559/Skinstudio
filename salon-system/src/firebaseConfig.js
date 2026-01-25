/* eslint-disable no-undef */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Bezpečný přístup k ENV
const getEnv = (key) => {
  try { return import.meta.env[key] || ""; } catch { return ""; }
};

// Detekce prostředí (Canvas vs Lokální Vite)
// V lokálním prostředí tyto proměnné neexistují, proto je kontrolujeme přes typeof
const isCanvas = typeof __firebase_config !== 'undefined';

const firebaseConfig = isCanvas
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: getEnv('VITE_FIREBASE_API_KEY'),
      authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: getEnv('VITE_FIREBASE_APP_ID'),
    };

export const EMAILJS_CONFIG = {
  SERVICE_ID: getEnv('VITE_EMAILJS_SERVICE_ID'),
  CONFIRM_TEMPLATE: getEnv('VITE_EMAILJS_CONFIRM_TEMPLATE_ID'),
  REMINDER_TEMPLATE: getEnv('VITE_EMAILJS_REMINDER_TEMPLATE_ID'),
  PUBLIC_KEY: getEnv('VITE_EMAILJS_PUBLIC_KEY')
};

// Inicializace
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Pokud jsme v Canvasu, použijeme injektované ID, jinak defaultní nebo prázdné
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Helpery pro cesty
export const getCollectionPath = (colName) => 
  isCanvas 
    ? collection(db, 'artifacts', appId, 'public', 'data', colName)
    : collection(db, colName);

export const getDocPath = (colName, docId) => 
  isCanvas 
    ? doc(db, 'artifacts', appId, 'public', 'data', colName, docId)
    : doc(db, colName, docId);
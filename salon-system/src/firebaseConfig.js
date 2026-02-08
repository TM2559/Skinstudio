/* eslint-disable no-undef */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Bezpečný přístup k ENV
const getEnv = (key) => {
  try { return import.meta.env[key] || ""; } catch { return ""; }
};

// Detekce prostředí (Canvas vs Lokální Vite)
// V lokálním prostředí tyto proměnné neexistují, proto je kontrolujeme přes typeof
const isCanvas = typeof __firebase_config !== 'undefined';

const projectId = getEnv('VITE_FIREBASE_PROJECT_ID');
const storageBucketEnv = getEnv('VITE_FIREBASE_STORAGE_BUCKET');
const firebaseConfig = isCanvas
  ? JSON.parse(__firebase_config)
  : {
      apiKey: getEnv('VITE_FIREBASE_API_KEY'),
      authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId,
      storageBucket: storageBucketEnv || (projectId ? `${projectId}.appspot.com` : ''),
      messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: getEnv('VITE_FIREBASE_APP_ID'),
    };

export const EMAILJS_CONFIG = {
  SERVICE_ID: getEnv('VITE_EMAILJS_SERVICE_ID'),
  CONFIRM_TEMPLATE: getEnv('VITE_EMAILJS_CONFIRM_TEMPLATE_ID'),
  REMINDER_TEMPLATE: getEnv('VITE_EMAILJS_REMINDER_TEMPLATE_ID'),
  PUBLIC_KEY: getEnv('VITE_EMAILJS_PUBLIC_KEY')
};

// Instagram – celá URL nebo jen username (např. skinstudio.uhb)
const instagramUrl = getEnv('VITE_INSTAGRAM_URL');
const instagramUsername = getEnv('VITE_INSTAGRAM_USERNAME');
export const INSTAGRAM_URL = instagramUrl || (instagramUsername ? `https://www.instagram.com/${instagramUsername.replace(/^@/, '')}/` : '');
// Volitelné: URL příspěvků pro embed, oddělené čárkou (max cca 6)
export const INSTAGRAM_POST_URLS = (getEnv('VITE_INSTAGRAM_POST_URLS') || '').split(',').map(s => s.trim()).filter(Boolean);

// Inicializace
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

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
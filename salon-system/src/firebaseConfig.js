/* eslint-disable no-undef */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";

// Bezpečný přístup k ENV
const getEnv = (key) => {
  try { return import.meta.env[key] || ""; } catch { return ""; }
};

// V testech (Vitest) bez API klíče neinicializovat Firebase – zabrání auth/invalid-api-key v CI
const isVitestNoKey = typeof import.meta.env.VITEST !== 'undefined' && import.meta.env.VITEST && !getEnv('VITE_FIREBASE_API_KEY');

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

// Instagram – celá URL nebo jen username (např. skinstudio.uhb)
const instagramUrl = getEnv('VITE_INSTAGRAM_URL');
const instagramUsername = getEnv('VITE_INSTAGRAM_USERNAME');
export const INSTAGRAM_URL = instagramUrl || (instagramUsername ? `https://www.instagram.com/${instagramUsername.replace(/^@/, '')}/` : '');
// Volitelné: URL příspěvků pro embed, oddělené čárkou (max cca 6)
export const INSTAGRAM_POST_URLS = (getEnv('VITE_INSTAGRAM_POST_URLS') || '').split(',').map(s => s.trim()).filter(Boolean);

// Google Recenze – stejná URL jako v QR kódu (fallback = Skin Studio place ID)
export const GOOGLE_REVIEW_URL = getEnv('VITE_GOOGLE_REVIEW_URL') || 'https://g.page/r/CWkt9xHMgMjqEAE/review';

// Pokud jsme v Canvasu, použijeme injektované ID, jinak defaultní nebo prázdné
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Inicializace (v testech bez API klíče použít mocky, aby CI nepadalo na auth/invalid-api-key)
let app;
let auth;
let db;
let storage;
let functions;

if (isVitestNoKey) {
  app = {};
  auth = { currentUser: null };
  db = {};
  storage = {};
  functions = {};
} else {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app, 'europe-west1');
}

export { auth, db, storage };

// Helpery pro cesty
export const getCollectionPath = (colName) =>
  isVitestNoKey
    ? {}
    : isCanvas
      ? collection(db, 'artifacts', appId, 'public', 'data', colName)
      : collection(db, colName);

export const getDocPath = (colName, docId) =>
  isVitestNoKey
    ? {}
    : isCanvas
      ? doc(db, 'artifacts', appId, 'public', 'data', colName, docId)
      : doc(db, colName, docId);

export const callSendConfirmationSms = isVitestNoKey
  ? () => Promise.resolve({ data: {} })
  : httpsCallable(functions, 'sendConfirmationSms');

export const callSendReminderSms = isVitestNoKey
  ? () => Promise.resolve({ data: { sent: 0, errors: [] } })
  : httpsCallable(functions, 'sendReminderSms');

// Admin password verification (server-side)
export const callVerifyAdminPassword = isVitestNoKey
  ? () => Promise.resolve({ data: { verified: true } })
  : httpsCallable(functions, 'verifyAdminPassword');

// Admin WebAuthn (Face ID / Touch ID)
export const getAdminWebAuthnRegistrationOptions = isVitestNoKey
  ? () => Promise.resolve({ data: {} })
  : httpsCallable(functions, 'getAdminWebAuthnRegistrationOptions');
export const verifyAdminWebAuthnRegistration = isVitestNoKey
  ? () => Promise.resolve({ data: {} })
  : httpsCallable(functions, 'verifyAdminWebAuthnRegistration');
export const getAdminWebAuthnLoginOptions = isVitestNoKey
  ? () => Promise.resolve({ data: {} })
  : httpsCallable(functions, 'getAdminWebAuthnLoginOptions');
export const verifyAdminWebAuthnLogin = isVitestNoKey
  ? () => Promise.resolve({ data: {} })
  : httpsCallable(functions, 'verifyAdminWebAuthnLogin');

// Resend email callables
export const callSendBookingConfirmationEmail = isVitestNoKey
  ? () => Promise.resolve({ data: { sent: true } })
  : httpsCallable(functions, 'sendBookingConfirmationEmail');
export const callSendAdminNotificationEmail = isVitestNoKey
  ? () => Promise.resolve({ data: { sent: true } })
  : httpsCallable(functions, 'sendAdminNotificationEmail');
export const callSendReminderEmail = isVitestNoKey
  ? () => Promise.resolve({ data: { sent: true } })
  : httpsCallable(functions, 'sendReminderEmailCallable');

export const callSendAdminVoucherOrderEmail = isVitestNoKey
  ? () => Promise.resolve({ data: { sent: true } })
  : httpsCallable(functions, 'sendAdminVoucherOrderEmail');
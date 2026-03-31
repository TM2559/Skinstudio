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
const hasFirebaseApiKey = !!getEnv('VITE_FIREBASE_API_KEY');
export const isFirebaseRuntimeConfigured = isCanvas || hasFirebaseApiKey;
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

// Google Recenze – stejná URL jako v QR kódu (fallback = Skin Studio place ID)
export const GOOGLE_REVIEW_URL = getEnv('VITE_GOOGLE_REVIEW_URL') || 'https://g.page/r/CWkt9xHMgMjqEAE/review';

// Pokud jsme v Canvasu, použijeme injektované ID; lokálně lze přečíst i z artifacts přes VITE_FIREBASE_ARTIFACTS_APP_ID
const appId = typeof __app_id !== 'undefined' ? __app_id : getEnv('VITE_FIREBASE_ARTIFACTS_APP_ID') || 'default-app-id';

// Inicializace (v testech bez API klíče použít mocky, aby CI nepadalo na auth/invalid-api-key)
let app;
let auth;
let db;
let storage;
let functions;
const useFirebaseMocks = isVitestNoKey || !isFirebaseRuntimeConfigured;

if (useFirebaseMocks) {
  app = {};
  auth = { currentUser: null };
  db = {};
  storage = {};
  functions = {};
  if (!isVitestNoKey && !isFirebaseRuntimeConfigured) {
    console.warn('Firebase runtime config missing (VITE_FIREBASE_API_KEY). Running in degraded mode.');
  }
} else {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app, 'europe-west1');
}

export { auth, db, storage };

// Helpery pro cesty
// Důležité: V Canvasu se data ukládají pod artifacts/<appId>/public/data/<colName>,
// lokálně přímo do <colName>.
export const getCollectionPath = (colName) =>
  isVitestNoKey
    ? {}
    : isCanvas
      ? collection(db, 'artifacts', appId, 'public', 'data', colName)
      : collection(db, colName);

/** Cesta ke kolekci jako řetězec (pro zobrazení v UI / diagnostiku). */
export const getCollectionPathString = (colName) =>
  isVitestNoKey ? '' : isCanvas ? `artifacts/${appId}/public/data/${colName}` : colName;

export const getDocPath = (colName, docId) =>
  isVitestNoKey
    ? {}
    : isCanvas
      ? doc(db, 'artifacts', appId, 'public', 'data', colName, docId)
      : doc(db, colName, docId);

/**
 * Galerie a proměny (fotky na webu) – zápis vždy do kořene.
 * Používejte pouze pro: gallery_items, transformation_items.
 */
export const getPublicContentCollectionPath = (colName) =>
  isVitestNoKey ? {} : collection(db, colName);

export const getPublicContentDocPath = (colName, docId) =>
  isVitestNoKey ? {} : doc(db, colName, docId);

/** Cesta k veřejnému obsahu (vždy jen název kolekce). */
export const getPublicContentCollectionPathString = (colName) =>
  isVitestNoKey ? '' : colName;

/**
 * Pro ČTENÍ galerie a proměn: vrací pole cest (kořen + artifacts),
 * aby se zobrazila i data uložená v Canvasu pod artifacts. Zápis zůstává jen do kořene.
 * Na lokále se zkouší i artifacts (appId z VITE_FIREBASE_ARTIFACTS_APP_ID nebo default-app-id).
 */
export const getPublicContentCollectionPathsForRead = (colName) => {
  if (isVitestNoKey) return [];
  const root = collection(db, colName);
  const artifactsPath = collection(db, 'artifacts', appId, 'public', 'data', colName);
  return [root, artifactsPath];
};

/** Dokument pro mazání podle zdroje (0 = kořen, 1 = artifacts). */
export const getPublicContentDocPathBySourceIndex = (colName, docId, sourcePathIndex) => {
  if (isVitestNoKey) return {};
  return sourcePathIndex === 0
    ? doc(db, colName, docId)
    : doc(db, 'artifacts', appId, 'public', 'data', colName, docId);
};

export const callSendConfirmationSms = useFirebaseMocks
  ? () => Promise.resolve({ data: {} })
  : httpsCallable(functions, 'sendConfirmationSms');

export const callSendReminderSms = useFirebaseMocks
  ? () => Promise.resolve({ data: { sent: 0, errors: [] } })
  : httpsCallable(functions, 'sendReminderSms');

// Admin password verification (server-side)
export const callVerifyAdminPassword = useFirebaseMocks
  ? () => Promise.resolve({ data: { verified: true } })
  : httpsCallable(functions, 'verifyAdminPassword');

// Admin WebAuthn (Face ID / Touch ID)
export const getAdminWebAuthnRegistrationOptions = useFirebaseMocks
  ? () => Promise.resolve({ data: {} })
  : httpsCallable(functions, 'getAdminWebAuthnRegistrationOptions');
export const verifyAdminWebAuthnRegistration = useFirebaseMocks
  ? () => Promise.resolve({ data: {} })
  : httpsCallable(functions, 'verifyAdminWebAuthnRegistration');
export const getAdminWebAuthnLoginOptions = useFirebaseMocks
  ? () => Promise.resolve({ data: {} })
  : httpsCallable(functions, 'getAdminWebAuthnLoginOptions');
export const verifyAdminWebAuthnLogin = useFirebaseMocks
  ? () => Promise.resolve({ data: {} })
  : httpsCallable(functions, 'verifyAdminWebAuthnLogin');
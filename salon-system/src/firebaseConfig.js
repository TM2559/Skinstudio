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
  useFirebaseMocks
    ? {}
    : isCanvas
      ? collection(db, 'artifacts', appId, 'public', 'data', colName)
      : collection(db, colName);

/** Cesta ke kolekci jako řetězec (pro zobrazení v UI / diagnostiku). */
export const getCollectionPathString = (colName) =>
  isVitestNoKey ? '' : isCanvas ? `artifacts/${appId}/public/data/${colName}` : colName;

// Public content helpers (galerie + proměny): support both root and artifacts for read compatibility.
export const getPublicContentCollectionPath = (colName) => getCollectionPath(colName);

export const getPublicContentCollectionPathString = (colName) => getCollectionPathString(colName);

export const getPublicContentCollectionPathsForRead = (colName) => {
  if (useFirebaseMocks) return [{}];
  if (isCanvas) return [collection(db, 'artifacts', appId, 'public', 'data', colName)];
  return [collection(db, colName), collection(db, 'artifacts', appId, 'public', 'data', colName)];
};

export const getPublicContentDocPathBySourceIndex = (colName, docId, sourcePathIndex = 0) => {
  if (useFirebaseMocks) return {};
  if (isCanvas) return doc(db, 'artifacts', appId, 'public', 'data', colName, docId);
  return sourcePathIndex === 1
    ? doc(db, 'artifacts', appId, 'public', 'data', colName, docId)
    : doc(db, colName, docId);
};

export const getDocPath = (colName, docId) =>
  useFirebaseMocks
    ? {}
    : isCanvas
      ? doc(db, 'artifacts', appId, 'public', 'data', colName, docId)
      : doc(db, colName, docId);

export const callSendConfirmationSms = useFirebaseMocks
  ? () => Promise.resolve({ data: {} })
  : httpsCallable(functions, 'sendConfirmationSms');

export const callSendReminderSms = useFirebaseMocks
  ? () => Promise.resolve({ data: { sent: 0, errors: [] } })
  : httpsCallable(functions, 'sendReminderSms');
export const callSendBookingEmails = useFirebaseMocks
  ? () => Promise.resolve({ data: { clientOk: true, adminOk: true } })
  : httpsCallable(functions, 'sendBookingEmails');
export const callSendReminderEmails = useFirebaseMocks
  ? () => Promise.resolve({ data: { sent: 0, errors: [] } })
  : httpsCallable(functions, 'sendReminderEmails');

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
export const getAdminWebAuthnConfigured = useFirebaseMocks
  ? () => Promise.resolve({ data: { configured: false } })
  : httpsCallable(functions, 'getAdminWebAuthnConfigured');
export const getAdminWebAuthnLoginOptions = useFirebaseMocks
  ? () => Promise.resolve({ data: {} })
  : httpsCallable(functions, 'getAdminWebAuthnLoginOptions');
export const verifyAdminWebAuthnLogin = useFirebaseMocks
  ? () => Promise.resolve({ data: {} })
  : httpsCallable(functions, 'verifyAdminWebAuthnLogin');

export const callCreateVoucherOrder = useFirebaseMocks
  ? () => Promise.resolve({ data: { orderId: 'test-id', total_price: 0 } })
  : httpsCallable(functions, 'createVoucherOrder');
export const callUpdateVoucherOrderStatus = useFirebaseMocks
  ? () => Promise.resolve({ data: { success: true, smsSent: false } })
  : httpsCallable(functions, 'updateVoucherOrderStatus');

// Resend email callables
export const callSendBookingConfirmationEmail = useFirebaseMocks
  ? () => Promise.resolve({ data: { sent: true } })
  : httpsCallable(functions, 'sendBookingConfirmationEmail');
export const callSendAdminNotificationEmail = useFirebaseMocks
  ? () => Promise.resolve({ data: { sent: true } })
  : httpsCallable(functions, 'sendAdminNotificationEmail');
export const callSendReminderEmail = useFirebaseMocks
  ? () => Promise.resolve({ data: { sent: true } })
  : httpsCallable(functions, 'sendReminderEmailCallable');

export const callSendAdminVoucherOrderEmail = useFirebaseMocks
  ? () => Promise.resolve({ data: { sent: true } })
  : httpsCallable(functions, 'sendAdminVoucherOrderEmail');

export const callUpdateVoucherOrder = useFirebaseMocks
  ? () => Promise.resolve({ data: { success: true } })
  : httpsCallable(functions, 'updateVoucherOrder');
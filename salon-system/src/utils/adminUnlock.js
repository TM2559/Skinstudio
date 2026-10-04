import { auth } from '../firebaseConfig';
import { ADMIN } from '../constants/config';

/**
 * „Odemčení“ admina na tomto zařízení: po přihlášení Face ID / heslem se uloží čas
 * a po dobu ADMIN.UNLOCK_TTL_MS se na TOMTO zařízení znovu neptáme.
 * Jiné zařízení (i s passkey synchronizovaným přes iCloud) se musí přihlásit samo –
 * údaj je jen v localStorage. Serverová práva dál hlídá admin claim ve Firebase Auth.
 */
const KEY = 'skinstudio_admin_unlocked_at';

export function markAdminUnlocked(now = Date.now()) {
  try {
    localStorage.setItem(KEY, String(now));
  } catch { /* private mód apod. – prostě se příště zeptáme znovu */ }
}

export function clearAdminUnlock() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}

export function isAdminUnlockFresh(now = Date.now()) {
  try {
    const t = Number(localStorage.getItem(KEY));
    return t > 0 && t <= now && now - t < ADMIN.UNLOCK_TTL_MS;
  } catch {
    return false;
  }
}

/** Odemčeno na tomto zařízení A aktuální Firebase uživatel má admin claim. */
export async function hasValidAdminSession() {
  if (!isAdminUnlockFresh()) return false;
  try {
    await auth.authStateReady?.();
    const res = await auth.currentUser?.getIdTokenResult();
    return !!res?.claims?.admin;
  } catch {
    return false;
  }
}

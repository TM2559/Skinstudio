import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { auth, callVerifyAdminPassword } from '../firebaseConfig';
import { ADMIN } from '../constants/config';
import { markAdminUnlocked, clearAdminUnlock, hasValidAdminSession, isAdminUnlockFresh } from '../utils/adminUnlock';

const AdminAuthContext = createContext(null);

/** Po ověření na serveru obnovit token; bez admin claimu by zápisy (směny, rezervace) Firestore odmítl. */
async function hasAdminClaimAfterLogin() {
  try {
    const res = await auth.currentUser?.getIdTokenResult(true);
    return !!res?.claims?.admin;
  } catch {
    return false;
  }
}

export function AdminAuthProvider({ children }) {
  const location = useLocation();
  const [view, setView] = useState(() => (location.pathname === ADMIN.HIDDEN_PATH ? 'login' : 'customer'));
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showFaceIdSetupPrompt, setShowFaceIdSetupPrompt] = useState(false);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    if (location.pathname === '/rezervace') {
      setView('customer');
    } else if (location.pathname === ADMIN.HIDDEN_PATH) {
      // Skrytá adresa (ikona na ploše telefonu) → rovnou přihlášení, bez klikání na logo.
      setView('login');
    }
  }, [location.pathname]);

  // Refresh na /rezervace (admin přihlášený přes logo): na odemčeném zařízení obnovit admina,
  // jinak by F5 vždy odhlásil. Zákazníkům (bez lokálního odemčení) se nic nemění.
  useEffect(() => {
    if (location.pathname !== '/rezervace' || !isAdminUnlockFresh()) return;
    let cancelled = false;
    hasValidAdminSession().then((ok) => {
      if (ok && !cancelled) setView('admin');
    });
    return () => { cancelled = true; };
  }, [location.pathname]);

  // Na zařízení odemčeném v posledních ADMIN.UNLOCK_TTL_MS přeskočit přihlášení.
  useEffect(() => {
    if (view !== 'login') return;
    let cancelled = false;
    hasValidAdminSession().then((ok) => {
      if (ok && !cancelled) setView('admin');
    });
    return () => { cancelled = true; };
  }, [view]);

  useEffect(() => {
    if (clicks > 0) {
      const t = setTimeout(() => setClicks(0), ADMIN.LOGIN_CLICK_TIMEOUT_MS);
      return () => clearTimeout(t);
    }
  }, [clicks]);

  const handleLogoClick = useCallback(() => {
    setClicks((prev) => {
      const newCount = prev + 1;
      if (newCount >= ADMIN.LOGIN_CLICK_COUNT) {
        setView('login');
        return 0;
      }
      return newCount;
    });
  }, []);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    if (!adminPassword) return;
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const { data } = await callVerifyAdminPassword({ password: adminPassword });
      if (data?.verified) {
        if (!(await hasAdminClaimAfterLogin())) {
          setLoginError('Přihlášení se nepropsalo do oprávnění. Zkuste to znovu.');
          return;
        }
        markAdminUnlocked();
        setShowFaceIdSetupPrompt(true);
      } else {
        setLoginError('Chybné heslo');
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('permission-denied') || msg.includes('Chybné heslo')) {
        setLoginError('Chybné heslo');
      } else {
        setLoginError('Přihlášení selhalo. Zkuste to znovu.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  }, [adminPassword]);

  const handleWebAuthnLoginSuccess = useCallback(async () => {
    if (!(await hasAdminClaimAfterLogin())) {
      setLoginError('Přihlášení se nepropsalo do oprávnění. Zkuste to znovu.');
      return;
    }
    markAdminUnlocked();
    setView('admin');
    setLoginError('');
  }, []);

  const handleSkipFaceIdSetup = useCallback(() => {
    setShowFaceIdSetupPrompt(false);
    setView('admin');
    setAdminPassword('');
  }, []);

  const handleFaceIdSetupDone = useCallback(() => {
    setShowFaceIdSetupPrompt(false);
    setView('admin');
    setAdminPassword('');
  }, []);

  const handleLogout = useCallback(() => {
    clearAdminUnlock();
    setView('customer');
    setAdminPassword('');
  }, []);

  const value = useMemo(() => ({
    view,
    setView,
    adminPassword,
    setAdminPassword,
    loginError,
    setLoginError,
    isLoggingIn,
    showFaceIdSetupPrompt,
    handleLogoClick,
    handleLogin,
    handleWebAuthnLoginSuccess,
    handleSkipFaceIdSetup,
    handleFaceIdSetupDone,
    handleLogout,
  }), [view, adminPassword, loginError, isLoggingIn, showFaceIdSetupPrompt, handleLogoClick, handleLogin, handleWebAuthnLoginSuccess, handleSkipFaceIdSetup, handleFaceIdSetupDone, handleLogout]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within <AdminAuthProvider>');
  return ctx;
}

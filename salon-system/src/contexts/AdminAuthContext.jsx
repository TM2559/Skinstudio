import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { auth, callVerifyAdminPassword } from '../firebaseConfig';
import { ADMIN } from '../constants/config';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const location = useLocation();
  const [view, setView] = useState('customer');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showFaceIdSetupPrompt, setShowFaceIdSetupPrompt] = useState(false);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    if (location.pathname === '/rezervace') {
      setView('customer');
    }
  }, [location.pathname]);

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
        await auth.currentUser?.getIdToken(true);
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
    await auth.currentUser?.getIdToken(true);
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
  }), [view, adminPassword, loginError, isLoggingIn, showFaceIdSetupPrompt, handleLogoClick, handleLogin, handleWebAuthnLoginSuccess, handleSkipFaceIdSetup, handleFaceIdSetupDone]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within <AdminAuthProvider>');
  return ctx;
}

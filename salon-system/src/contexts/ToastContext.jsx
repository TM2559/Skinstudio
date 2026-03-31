import React, { createContext, useContext } from 'react';
import useToast from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within <ToastProvider>');
  return ctx;
}

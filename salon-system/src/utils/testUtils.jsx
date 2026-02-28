import React from 'react';
import { render } from '@testing-library/react';
import { ToastProvider } from '../contexts/ToastContext';

/**
 * Custom render that wraps components with required providers (Toast, etc.).
 * Use this instead of @testing-library/react's `render` in tests.
 */
export function renderWithProviders(ui, options = {}) {
  function Wrapper({ children }) {
    return <ToastProvider>{children}</ToastProvider>;
  }
  return render(ui, { wrapper: Wrapper, ...options });
}

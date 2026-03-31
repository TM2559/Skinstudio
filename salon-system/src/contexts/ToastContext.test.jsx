import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToastContext } from './ToastContext';

function wrapper({ children }) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe('ToastContext', () => {
  it('provides toast methods', () => {
    const { result } = renderHook(() => useToastContext(), { wrapper });
    expect(typeof result.current.show).toBe('function');
    expect(typeof result.current.success).toBe('function');
    expect(typeof result.current.error).toBe('function');
    expect(typeof result.current.info).toBe('function');
    expect(typeof result.current.dismiss).toBe('function');
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useToastContext());
    }).toThrow('useToastContext must be used within <ToastProvider>');
  });

  it('show() creates a toast accessible in context', () => {
    const { result } = renderHook(() => useToastContext(), { wrapper });
    act(() => result.current.show('Hello'));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Hello');
  });

  it('dismiss() removes a toast', () => {
    const { result } = renderHook(() => useToastContext(), { wrapper });
    let id;
    act(() => { id = result.current.show('Test'); });
    act(() => result.current.dismiss(id));
    expect(result.current.toasts).toHaveLength(0);
  });
});

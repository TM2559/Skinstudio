import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ADMIN } from '../constants/config';

const mockGetIdToken = vi.fn(() => Promise.resolve('token'));
const mockCallVerify = vi.fn();

vi.mock('../firebaseConfig', () => ({
  auth: { currentUser: { getIdToken: (...args) => mockGetIdToken(...args) } },
  callVerifyAdminPassword: (...args) => mockCallVerify(...args),
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/rezervace' }),
}));

import { AdminAuthProvider, useAdminAuth } from './AdminAuthContext';

function wrapper({ children }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}

describe('AdminAuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides default values', () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    expect(result.current.view).toBe('customer');
    expect(result.current.isLoggingIn).toBe(false);
    expect(result.current.loginError).toBe('');
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useAdminAuth());
    }).toThrow('useAdminAuth must be used within <AdminAuthProvider>');
  });

  it('handleLogoClick switches to login after N clicks', () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    for (let i = 0; i < ADMIN.LOGIN_CLICK_COUNT; i++) {
      act(() => result.current.handleLogoClick());
    }
    expect(result.current.view).toBe('login');
  });

  it('handleLogin sets error on wrong password', async () => {
    mockCallVerify.mockRejectedValueOnce(new Error('permission-denied: Chybné heslo'));
    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    act(() => result.current.setAdminPassword('wrong'));
    await act(async () => {
      await result.current.handleLogin({ preventDefault: vi.fn() });
    });

    expect(result.current.loginError).toBe('Chybné heslo');
    expect(result.current.isLoggingIn).toBe(false);
  });

  it('handleLogin shows FaceId prompt on success', async () => {
    mockCallVerify.mockResolvedValueOnce({ data: { verified: true } });
    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    act(() => result.current.setAdminPassword('correct'));
    await act(async () => {
      await result.current.handleLogin({ preventDefault: vi.fn() });
    });

    expect(result.current.showFaceIdSetupPrompt).toBe(true);
    expect(mockGetIdToken).toHaveBeenCalledWith(true);
  });

  it('handleLogin does nothing with empty password', async () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await act(async () => {
      await result.current.handleLogin({ preventDefault: vi.fn() });
    });
    expect(mockCallVerify).not.toHaveBeenCalled();
  });

  it('handleSkipFaceIdSetup switches to admin', () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    act(() => result.current.handleSkipFaceIdSetup());
    expect(result.current.view).toBe('admin');
    expect(result.current.showFaceIdSetupPrompt).toBe(false);
  });

  it('handleFaceIdSetupDone switches to admin', () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    act(() => result.current.handleFaceIdSetupDone());
    expect(result.current.view).toBe('admin');
  });

  it('handleWebAuthnLoginSuccess refreshes token and switches to admin', async () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await act(async () => {
      await result.current.handleWebAuthnLoginSuccess();
    });
    expect(mockGetIdToken).toHaveBeenCalledWith(true);
    expect(result.current.view).toBe('admin');
  });

  it('handles generic login error', async () => {
    mockCallVerify.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    act(() => result.current.setAdminPassword('pass'));
    await act(async () => {
      await result.current.handleLogin({ preventDefault: vi.fn() });
    });

    expect(result.current.loginError).toBe('Přihlášení selhalo. Zkuste to znovu.');
  });
});

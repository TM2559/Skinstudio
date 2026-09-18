import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockClaims = { value: {} };
vi.mock('../firebaseConfig', () => ({
  auth: {
    authStateReady: () => Promise.resolve(),
    currentUser: { getIdTokenResult: () => Promise.resolve({ claims: mockClaims.value }) },
  },
}));

import { markAdminUnlocked, clearAdminUnlock, isAdminUnlockFresh, hasValidAdminSession } from './adminUnlock';
import { ADMIN } from '../constants/config';

describe('adminUnlock', () => {
  beforeEach(() => {
    localStorage.clear();
    mockClaims.value = {};
  });

  it('is locked by default', () => {
    expect(isAdminUnlockFresh()).toBe(false);
  });

  it('stays unlocked only within the TTL', () => {
    const t = 1_000_000;
    markAdminUnlocked(t);
    expect(isAdminUnlockFresh(t + 1000)).toBe(true);
    expect(isAdminUnlockFresh(t + ADMIN.UNLOCK_TTL_MS - 1)).toBe(true);
    expect(isAdminUnlockFresh(t + ADMIN.UNLOCK_TTL_MS)).toBe(false);
  });

  it('rejects timestamps from the future and garbage', () => {
    markAdminUnlocked(Date.now() + 60_000);
    expect(isAdminUnlockFresh()).toBe(false);
    localStorage.setItem('skinstudio_admin_unlocked_at', 'abc');
    expect(isAdminUnlockFresh()).toBe(false);
  });

  it('clearAdminUnlock locks again', () => {
    markAdminUnlocked();
    clearAdminUnlock();
    expect(isAdminUnlockFresh()).toBe(false);
  });

  it('requires both a fresh unlock and the admin claim', async () => {
    mockClaims.value = { admin: true };
    expect(await hasValidAdminSession()).toBe(false);
    markAdminUnlocked();
    expect(await hasValidAdminSession()).toBe(true);
    mockClaims.value = {};
    expect(await hasValidAdminSession()).toBe(false);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { DataProvider, useData } from './DataContext';

let authStateCallback = null;

vi.mock('firebase/auth', () => ({
  signInAnonymously: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn((_, cb) => {
    authStateCallback = cb;
    return vi.fn();
  }),
  onIdTokenChanged: vi.fn(() => vi.fn()),
  signInWithCustomToken: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  query: vi.fn((ref) => ref),
  onSnapshot: vi.fn(() => vi.fn()),
}));

vi.mock('../firebaseConfig', () => ({
  auth: {},
  getCollectionPath: vi.fn((name) => ({ _path: name })),
  getDocPath: vi.fn(() => ({ id: 'voucher' })),
}));

vi.mock('../utils/helpers', () => ({
  filterCosmeticsServices: (services) => services.filter((s) => s.category !== 'PMU'),
}));

vi.mock('../constants/config', () => ({
  COLLECTIONS: {
    RESERVATIONS: 'reservations',
    SCHEDULE: 'schedule',
    SCHEDULE_PMU: 'schedule_pmu',
    SERVICES: 'services',
    ADDONS: 'addons',
    SERVICE_ADDON_LINKS: 'service_addon_links',
    VOUCHER_TEMPLATES: 'voucher_templates',
    VOUCHER_ORDERS: 'voucher_orders',
  },
}));

function wrapper({ children }) {
  return <DataProvider>{children}</DataProvider>;
}

describe('DataContext', () => {
  it('provides loading=true initially', () => {
    const { result } = renderHook(() => useData(), { wrapper });
    expect(result.current.loading).toBe(true);
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useData());
    }).toThrow('useData must be used within <DataProvider>');
  });

  it('provides empty collections initially', () => {
    const { result } = renderHook(() => useData(), { wrapper });
    expect(result.current.reservations).toEqual([]);
    expect(result.current.services).toEqual([]);
    expect(result.current.addons).toEqual([]);
    expect(result.current.voucherTemplates).toEqual([]);
    expect(result.current.schedule).toEqual({});
  });

  it('provides computed properties', () => {
    const { result } = renderHook(() => useData(), { wrapper });
    expect(result.current.servicesStandardOnly).toEqual([]);
    expect(result.current.servicesWithAddons).toEqual([]);
    expect(result.current.servicesStandardWithAddons).toEqual([]);
  });
});

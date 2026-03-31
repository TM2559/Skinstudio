import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useIsMobile from './useIsMobile';

describe('useIsMobile', () => {
  let listeners;
  let currentMatches;

  beforeEach(() => {
    listeners = [];
    currentMatches = false;
    window.matchMedia = vi.fn((query) => ({
      matches: currentMatches,
      media: query,
      addEventListener: (_, handler) => listeners.push(handler),
      removeEventListener: (_, handler) => {
        listeners = listeners.filter((l) => l !== handler);
      },
    }));
  });

  it('returns false for wide viewport', () => {
    currentMatches = false;
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(false);
  });

  it('returns true for narrow viewport', () => {
    currentMatches = true;
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(true);
  });

  it('updates when viewport changes', () => {
    currentMatches = false;
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(false);

    act(() => {
      listeners.forEach((fn) => fn({ matches: true }));
    });
    expect(result.current).toBe(true);
  });

  it('cleans up listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile(768));
    expect(listeners).toHaveLength(1);
    unmount();
    expect(listeners).toHaveLength(0);
  });

  it('uses default breakpoint from config', () => {
    currentMatches = false;
    renderHook(() => useIsMobile());
    expect(window.matchMedia).toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useToast from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('starts with no toasts', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toHaveLength(0);
  });

  it('show() adds a toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.show('Hello'));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Hello');
    expect(result.current.toasts[0].type).toBe('info');
  });

  it('success() adds a success toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.success('OK'));
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('error() adds an error toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.error('Fail'));
    expect(result.current.toasts[0].type).toBe('error');
  });

  it('info() adds an info toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.info('Info'));
    expect(result.current.toasts[0].type).toBe('info');
  });

  it('dismiss() removes a specific toast', () => {
    const { result } = renderHook(() => useToast(0));
    let id;
    act(() => { id = result.current.show('A'); });
    act(() => result.current.show('B'));
    expect(result.current.toasts).toHaveLength(2);
    act(() => result.current.dismiss(id));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('B');
  });

  it('auto-dismisses after timeout', () => {
    const { result } = renderHook(() => useToast(1000));
    act(() => result.current.show('Temp'));
    expect(result.current.toasts).toHaveLength(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.toasts).toHaveLength(0);
  });

  it('does not auto-dismiss when autoDismissMs is 0', () => {
    const { result } = renderHook(() => useToast(0));
    act(() => result.current.show('Persistent'));
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.toasts).toHaveLength(1);
  });

  it('returns unique ids for each toast', () => {
    const { result } = renderHook(() => useToast(0));
    let id1, id2;
    act(() => { id1 = result.current.show('A'); });
    act(() => { id2 = result.current.show('B'); });
    expect(id1).not.toBe(id2);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

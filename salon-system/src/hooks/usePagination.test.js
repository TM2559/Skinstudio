import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import usePagination from './usePagination';

describe('usePagination', () => {
  const items = Array.from({ length: 55 }, (_, i) => ({ id: i }));

  it('returns first page of items', () => {
    const { result } = renderHook(() => usePagination(items, 20));
    expect(result.current.pageItems).toHaveLength(20);
    expect(result.current.page).toBe(0);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.totalItems).toBe(55);
  });

  it('navigates to next page', () => {
    const { result } = renderHook(() => usePagination(items, 20));
    act(() => result.current.nextPage());
    expect(result.current.page).toBe(1);
    expect(result.current.pageItems[0].id).toBe(20);
  });

  it('navigates to previous page', () => {
    const { result } = renderHook(() => usePagination(items, 20));
    act(() => result.current.nextPage());
    act(() => result.current.prevPage());
    expect(result.current.page).toBe(0);
  });

  it('does not go below page 0', () => {
    const { result } = renderHook(() => usePagination(items, 20));
    act(() => result.current.prevPage());
    expect(result.current.page).toBe(0);
  });

  it('does not exceed last page', () => {
    const { result } = renderHook(() => usePagination(items, 20));
    act(() => result.current.setPage(99));
    expect(result.current.page).toBe(2);
    expect(result.current.pageItems).toHaveLength(15);
  });

  it('last page has remaining items', () => {
    const { result } = renderHook(() => usePagination(items, 20));
    act(() => result.current.setPage(2));
    expect(result.current.pageItems).toHaveLength(15);
  });

  it('resets to page 0', () => {
    const { result } = renderHook(() => usePagination(items, 20));
    act(() => result.current.nextPage());
    act(() => result.current.resetPage());
    expect(result.current.page).toBe(0);
  });

  it('handles empty items', () => {
    const { result } = renderHook(() => usePagination([], 20));
    expect(result.current.pageItems).toHaveLength(0);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.page).toBe(0);
  });

  it('handles items fewer than page size', () => {
    const small = [{ id: 1 }, { id: 2 }];
    const { result } = renderHook(() => usePagination(small, 20));
    expect(result.current.pageItems).toHaveLength(2);
    expect(result.current.totalPages).toBe(1);
  });

  it('uses default page size of 20', () => {
    const { result } = renderHook(() => usePagination(items));
    expect(result.current.pageItems).toHaveLength(20);
    expect(result.current.totalPages).toBe(3);
  });
});

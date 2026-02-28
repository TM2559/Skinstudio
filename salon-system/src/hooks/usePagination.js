import { useState, useMemo } from 'react';

export default function usePagination(items, pageSize = 20) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  const pageItems = useMemo(
    () => items.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [items, safePage, pageSize]
  );

  return {
    pageItems,
    page: safePage,
    totalPages,
    totalItems: items.length,
    setPage,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages - 1)),
    prevPage: () => setPage((p) => Math.max(p - 1, 0)),
    resetPage: () => setPage(0),
  };
}

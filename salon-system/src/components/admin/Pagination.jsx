import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, totalItems, onPrev, onNext }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-stone-100">
      <span className="text-xs text-stone-400">
        {totalItems} záznamů · strana {page + 1} z {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page === 0}
          className="p-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages - 1}
          className="p-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

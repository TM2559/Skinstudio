import React from 'react';

export default function PrimaryCTA({ isSubmitting, onClick }) {
  const label = isSubmitting ? 'Odesílám…' : 'Pokračovat';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSubmitting}
      aria-busy={isSubmitting || undefined}
      className="shrink-0 px-8 py-3.5 text-[15px] font-medium rounded-none border border-transparent bg-[#C5A880] text-[#FFFFFF] transition-transform touch-manipulation active:scale-[0.98] hover:bg-[#b89a6e] disabled:opacity-70 disabled:cursor-wait"
    >
      {label}
    </button>
  );
}

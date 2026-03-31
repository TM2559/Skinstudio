import React from 'react';

export default function SummaryPrice({ totalPrice, formatPrice, hasSelection }) {
  const mobileEmpty = '0 Kč';
  const desktopEmpty = '—';
  const amount = hasSelection ? formatPrice(totalPrice) : null;

  return (
    <div className="flex items-end justify-between gap-3 min-w-0">
      <span className="text-[12px] text-[#71717A] uppercase tracking-[0.05em] shrink-0 lg:text-sm lg:normal-case lg:tracking-normal lg:text-[#6b6560]">
        Celkem k úhradě
      </span>
      <span
        className="text-[18px] font-semibold text-[#18181B] tabular-nums text-right shrink-0 lg:text-xl lg:font-semibold lg:text-[#2a2624] lg:tracking-tight"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="lg:hidden">{amount ?? mobileEmpty}</span>
        <span className="hidden lg:inline">{amount ?? desktopEmpty}</span>
      </span>
    </div>
  );
}

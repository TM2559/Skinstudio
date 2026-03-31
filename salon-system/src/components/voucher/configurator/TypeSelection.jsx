import React from 'react';
import { formatPrice, valueCategoryMinDisplay } from '../voucherCheckoutUtils';

export const CATEGORY_META = {
  value: { emoji: '💰', title: 'Hodnotový poukaz' },
  cosmetics: { emoji: '✨', title: 'Kosmetické ošetření' },
  pmu: { emoji: '💋', title: 'Permanentní make-up' },
};

export default function TypeSelection({ categoryGroups, expandedCategory, onOpenCategory, onCollapse }) {
  return (
    <section className="mb-16 lg:mb-20" aria-label="Výběr poukazu">
      <fieldset>
        <legend className="sr-only">Vyberte typ a konkrétní dárkový poukaz</legend>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#A3A3A3] mb-8">Typ poukazu</p>
        <div
          className={`grid gap-px bg-[#E5E5E5] border border-[#E5E5E5] ${
            categoryGroups.length === 1
              ? 'grid-cols-1 max-w-md'
              : categoryGroups.length === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-3'
          }`}
        >
          {categoryGroups.map(({ key, vouchers }) => {
            const meta = CATEGORY_META[key];
            const minP = valueCategoryMinDisplay(vouchers);
            const isExpanded = expandedCategory === key;
            const dimOthers = expandedCategory != null && !isExpanded;
            return (
              <div key={key} className="flex flex-col min-w-0 bg-[#FFFFFF]">
                <button
                  type="button"
                  onClick={() => onOpenCategory(key)}
                  aria-expanded={expandedCategory != null ? isExpanded : undefined}
                  aria-controls="voucher-service-dropdown"
                  className={`text-left w-full flex flex-col items-center justify-center text-center px-6 py-10 sm:py-12 transition-[opacity,transform] duration-200 min-h-[140px] ${
                    isExpanded
                      ? 'bg-[#FAFAFA] ring-1 ring-inset ring-[#171717]'
                      : 'bg-[#FFFFFF] hover:bg-[#FAFAFA]/80'
                  } ${dimOthers ? 'opacity-35 scale-[0.99]' : 'opacity-100 scale-100'}`}
                >
                  <span className="text-3xl sm:text-4xl mb-3 select-none" aria-hidden>
                    {meta.emoji}
                  </span>
                  <span className="font-medium text-base sm:text-[17px] text-[#171717] leading-snug tracking-tight">
                    {meta.title}
                  </span>
                  <span className="text-sm text-[#737373] mt-3 font-normal">od {formatPrice(minP)}</span>
                </button>
              </div>
            );
          })}
        </div>
        {expandedCategory != null && (
          <button
            type="button"
            onClick={onCollapse}
            className="mt-8 text-sm text-[#737373] border-b border-[#D4D4D4] border-opacity-0 hover:border-opacity-100 pb-0.5 transition-colors hover:text-[#171717]"
          >
            Zobrazit znovu všechny typy poukazů
          </button>
        )}
      </fieldset>
    </section>
  );
}

import React from 'react';
import { Gift, Sparkles, PenTool } from 'lucide-react';
import { formatPrice, valueCategoryMinDisplay } from '../voucherCheckoutUtils';
import { CATEGORY_META } from './stepMeta';

const CATEGORY_ICONS = {
  value: Gift,
  cosmetics: Sparkles,
  pmu: PenTool,
};

const cardBase =
  'relative overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] border border-[#E4E4E7] bg-[#FFFFFF]';
const cardSelected = 'border-[#C5A880] ring-1 ring-inset ring-[#C5A880] bg-[#FAFAFA]';

export default function TypeSelectionGrid({ categoryGroups, expandedCategory, onOpenCategory }) {
  return (
    <div
      className={`grid gap-3 ${
        categoryGroups.length === 1
          ? 'grid-cols-1 max-w-md'
          : categoryGroups.length === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-3'
      }`}
    >
      {categoryGroups.map(({ key, vouchers }) => {
        const meta = CATEGORY_META[key];
        const Icon = CATEGORY_ICONS[key];
        const minP = valueCategoryMinDisplay(vouchers);
        const isExpanded = expandedCategory === key;
        const dimOthers = expandedCategory != null && !isExpanded;
        const iconClass = isExpanded
          ? 'text-[#C5A880]'
          : 'text-[#71717A] group-hover:text-[#18181B]';
        return (
          <button
            key={key}
            type="button"
            onClick={() => onOpenCategory(key)}
            aria-expanded={expandedCategory != null ? isExpanded : undefined}
            aria-controls="voucher-service-dropdown"
            className={`group flex w-full flex-col items-center px-6 text-left ${cardBase} ${
              isExpanded ? cardSelected : 'hover:bg-[#FAFAFA]'
            } ${dimOthers ? 'opacity-[0.38]' : 'opacity-100'}`}
          >
            <div className="flex w-full flex-col items-center justify-center gap-3 py-8">
              {Icon && (
                <Icon
                  className={`shrink-0 transition-colors duration-200 ${iconClass}`}
                  size={24}
                  strokeWidth={1.5}
                  aria-hidden
                />
              )}
              <span className="text-center text-[16px] font-medium leading-snug tracking-tight text-[#18181B]">
                {meta.title}
              </span>
            </div>
            <span className="pb-6 text-center text-sm font-normal text-[#6b6560]">od {formatPrice(minP)}</span>
          </button>
        );
      })}
    </div>
  );
}

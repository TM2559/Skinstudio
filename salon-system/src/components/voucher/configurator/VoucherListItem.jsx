import React from 'react';
import { formatPrice, formatKcDigits, templateAmountMinKc } from '../voucherCheckoutUtils';

const cardBase =
  'relative overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] border border-[#E4E4E7] bg-[#FFFFFF]';
const cardSelected = 'border-[#C5A880] ring-1 ring-inset ring-[#C5A880] bg-[#FAFAFA]';

export default function VoucherListItem({
  voucher: v,
  isSelected,
  onSelect,
  customAmountDraft,
  onCustomAmountDraft,
  customAmountInputRef,
}) {
  const minK = templateAmountMinKc(v);
  const draftParsed =
    isSelected && v.is_custom_amount ? parseInt(String(customAmountDraft).replace(/\s/g, ''), 10) : NaN;
  const hasTypedAmount = v.is_custom_amount && Number.isFinite(draftParsed) && draftParsed > 0;
  const caLine2Ok = v.is_custom_amount && isSelected && hasTypedAmount && draftParsed >= minK;

  return (
    <div className="relative">
      <label
        className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 cursor-pointer px-6 py-7 ${cardBase} ${
          isSelected ? cardSelected : 'hover:bg-[#FAFAFA]'
        } ${v.is_custom_amount ? 'relative' : ''}`}
      >
        <input
          type="radio"
          name="voucher"
          value={v.id}
          checked={isSelected}
          onChange={() => {
            onCustomAmountDraft('');
            onSelect(v);
          }}
          className="sr-only"
          aria-checked={isSelected}
          aria-label={
            v.is_custom_amount
              ? `Poukaz na … Kč, částka v korunách, minimálně ${minK}`
              : `${v.name}, ${formatPrice(v.price || 0)}`
          }
        />
        {v.is_custom_amount ? (
          <>
            <div className="min-w-0 flex-1 pointer-events-none">
              <span className="font-medium text-base sm:text-[17px] text-[#2a2624] block tracking-tight">
                {hasTypedAmount ? `Poukaz na ${formatKcDigits(draftParsed)} Kč` : 'Poukaz na … Kč'}
              </span>
              <span
                className={`mt-3 block ${
                  hasTypedAmount
                    ? caLine2Ok
                      ? 'font-semibold text-[#2a2624]'
                      : 'font-semibold text-[#6b6560]'
                    : 'font-medium text-[#b5aea7]'
                }`}
              >
                {hasTypedAmount ? formatPrice(draftParsed) : '—'}
              </span>
              {!isSelected && (
                <p className="mt-3 text-xs sm:text-sm text-[#6b6560] leading-relaxed max-w-md">
                  {`Zvolte si libovolnou částku od ${formatKcDigits(minK)} Kč — po výběru zadejte číslo.`}
                </p>
              )}
            </div>
            {isSelected && (
              <input
                ref={customAmountInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={customAmountDraft}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  onCustomAmountDraft(raw);
                }}
                className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0 text-base"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                aria-label={`Částka v korunách, minimálně ${minK}`}
              />
            )}
          </>
        ) : (
          <>
            <span className="font-medium text-base sm:text-[17px] text-[#2a2624] tracking-tight">{v.name}</span>
            <span className="font-semibold text-[#2a2624] shrink-0 tabular-nums">{formatPrice(v.price || 0)}</span>
          </>
        )}
      </label>
      {v.is_custom_amount && isSelected && (
        <p className="px-6 pb-6 -mt-2 text-xs sm:text-sm text-[#6b6560] leading-relaxed bg-[#FAFAFA] border border-t-0 border-[#E4E4E7]">
          {`Zadejte vlastní částku (minimálně ${formatKcDigits(minK)} Kč).`}
        </p>
      )}
    </div>
  );
}

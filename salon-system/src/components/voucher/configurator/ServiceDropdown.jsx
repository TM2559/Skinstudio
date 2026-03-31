import React from 'react';
import { formatPrice, formatKcDigits, templateAmountMinKc } from '../voucherCheckoutUtils';

/**
 * Výběr konkrétního poukazu ve zvolené kategorii — panel ve stylu rozbalovacího seznamu (bez nativního výběrového pole).
 */
export default function ServiceDropdown({
  visible,
  vouchers,
  selectedVoucher,
  onSelectVoucher,
  customAmountDraft,
  onCustomAmountDraft,
  customAmountInputRef,
}) {
  if (!visible || !vouchers?.length) return null;

  return (
    <section className="mb-16 lg:mb-20" aria-labelledby="service-dropdown-heading">
      <h2 id="service-dropdown-heading" className="text-[11px] uppercase tracking-[0.2em] text-[#A3A3A3] mb-8">
        Konkrétní poukaz
      </h2>
      <div
        id="voucher-service-dropdown"
        role="radiogroup"
        aria-label="Vyberte konkrétní dárkový poukaz"
        className="border border-[#E5E5E5] bg-[#FFFFFF] divide-y divide-[#E5E5E5]"
      >
        {vouchers.map((v) => {
          const isSelected = selectedVoucher?.id === v.id;
          const minK = templateAmountMinKc(v);
          const draftParsed =
            isSelected && v.is_custom_amount
              ? parseInt(String(customAmountDraft).replace(/\s/g, ''), 10)
              : NaN;
          const hasTypedAmount =
            v.is_custom_amount && Number.isFinite(draftParsed) && draftParsed > 0;
          const caLine2Ok =
            v.is_custom_amount && isSelected && hasTypedAmount && draftParsed >= minK;

          return (
            <div key={v.id} className="relative">
                <label
                  className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 cursor-pointer px-6 py-7 transition-colors ${
                    isSelected ? 'bg-[#FAFAFA]' : 'bg-[#FFFFFF] hover:bg-[#FAFAFA]/50'
                  } ${v.is_custom_amount ? 'relative' : ''}`}
                >
                  <input
                    type="radio"
                    name="voucher"
                    value={v.id}
                    checked={isSelected}
                    onChange={() => {
                      onCustomAmountDraft('');
                      onSelectVoucher(v);
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
                        <span className="font-medium text-base sm:text-[17px] text-[#171717] block tracking-tight">
                          {hasTypedAmount
                            ? `Poukaz na ${formatKcDigits(draftParsed)} Kč`
                            : 'Poukaz na … Kč'}
                        </span>
                        <span
                          className={`mt-3 block ${
                            hasTypedAmount
                              ? caLine2Ok
                                ? 'font-semibold text-[#171717]'
                                : 'font-semibold text-[#737373]'
                              : 'font-medium text-[#A3A3A3]'
                          }`}
                        >
                          {hasTypedAmount ? formatPrice(draftParsed) : '—'}
                        </span>
                        {!isSelected && (
                          <p className="mt-3 text-xs sm:text-sm text-[#737373] leading-relaxed max-w-md">
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
                      <span className="font-medium text-base sm:text-[17px] text-[#171717] tracking-tight">
                        {v.name}
                      </span>
                      <span className="font-semibold text-[#171717] shrink-0 tabular-nums">
                        {formatPrice(v.price || 0)}
                      </span>
                    </>
                  )}
                </label>
              {v.is_custom_amount && isSelected && (
                <p className="px-6 pb-6 -mt-2 text-xs sm:text-sm text-[#737373] leading-relaxed">
                  {`Zadejte vlastní částku (minimálně ${formatKcDigits(minK)} Kč).`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

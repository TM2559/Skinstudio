import React from 'react';
import { Banknote } from 'lucide-react';
import PrimaryCTA from './PrimaryCTA';
import { getNextStepMessage } from './voucherConfiguratorFlow';

export default function StickyFooter({
  formatPrice,
  totalPrice,
  hasSelection,
  expandedCategory,
  selectedVoucher,
  customAmountValid,
  dateValid,
  phoneValid,
  emailValid,
  submitError,
  isSubmitting,
  onPrimaryClick,
}) {
  const nextStep = getNextStepMessage({
    expandedCategory,
    selectedVoucher,
    customAmountValid,
    dateValid,
    phoneValid,
    emailValid,
  });

  const amount = hasSelection ? formatPrice(totalPrice) : '0 Kč';

  return (
    <footer
      role="contentinfo"
      aria-label="Rekapitulace a další krok"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E4E4E7] bg-[#FFFFFF] shadow-[0_-12px_48px_rgba(0,0,0,0.04)] pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-1"
    >
      <div className="mx-auto max-w-2xl px-5 py-5 sm:px-6 sm:py-6">
        {submitError && (
          <p className="text-[11px] font-medium text-[#EF4444] mb-3 border-b border-[#EF4444]/30 pb-2" role="alert">
            {submitError}
          </p>
        )}

        <div className="flex flex-row items-center justify-between gap-4 sm:gap-6 min-h-[3.25rem]">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[11px] font-medium tracking-[0.05em] text-[#71717A] uppercase">Celkem k úhradě</span>
            <span className="text-[20px] font-semibold text-[#18181B] tabular-nums" aria-live="polite">
              {amount}
            </span>
            {selectedVoucher && nextStep && (
              <span className="mt-0.5 hidden text-xs leading-snug text-[#71717A] sm:block line-clamp-2" aria-live="polite">
                {nextStep}
              </span>
            )}
            {hasSelection && (
              <span className="mt-1 hidden items-center gap-1.5 text-[11px] text-[#71717A] md:flex">
                <Banknote size={14} strokeWidth={1.5} className="shrink-0 text-[#C5A880]" aria-hidden />
                Platba proběhne v hotovosti při osobním převzetí.
              </span>
            )}
          </div>

          <PrimaryCTA isSubmitting={isSubmitting} onClick={onPrimaryClick} />
        </div>
      </div>
    </footer>
  );
}

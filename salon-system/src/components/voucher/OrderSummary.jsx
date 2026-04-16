import React from 'react';
import { Banknote, QrCode } from 'lucide-react';
import { formatPrice } from './voucherCheckoutUtils';

export default function OrderSummary({
  selectedVoucher,
  effectiveVoucherPrice,
  packaging,
  totalPrice,
  submitError,
  isSubmitting,
  onSubmit,
  canSubmit,
  ctaClassName = '',
}) {
  const voucherLabel = selectedVoucher
    ? selectedVoucher.is_custom_amount
      ? effectiveVoucherPrice > 0
        ? `Hodnotový poukaz ${formatPrice(effectiveVoucherPrice)}`
        : 'Hodnotový poukaz (vlastní hodnota)'
      : selectedVoucher.name
    : null;

  const packagingLabel = packaging === 'box' ? 'Luxusní krabička' : 'Dárková obálka';
  const packagingPrice = packaging === 'box' ? 100 : 0;

  return (
    <div className="mt-10 border border-[#E4E4E7] bg-white">
      {/* Řádky souhrnu */}
      <div className="px-6 py-5 border-b border-[#E4E4E7]">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#9c9590] mb-4">Shrnutí objednávky</p>
        {!selectedVoucher ? (
          <p className="text-[14px] text-[#737373] italic">Zatím nevybráno.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[14px] text-[#2a2624]">{voucherLabel}</span>
              <span className="text-[14px] font-semibold text-[#2a2624] tabular-nums shrink-0">
                {effectiveVoucherPrice > 0 ? formatPrice(effectiveVoucherPrice) : '—'}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px] text-[#6b6560]">{packagingLabel}</span>
              <span className="text-[13px] text-[#6b6560] tabular-nums shrink-0">
                {packagingPrice > 0 ? `+ ${formatPrice(packagingPrice)}` : 'v ceně'}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4 pt-2 border-t border-[#E4E4E7] mt-1">
              <span className="text-[15px] font-semibold text-[#2a2624]">Celkem</span>
              <span className="text-[20px] font-semibold text-[#2a2624] tabular-nums shrink-0" aria-live="polite">
                {totalPrice > 0 ? formatPrice(totalPrice) : '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Způsob platby */}
      <div className="px-6 py-5 border-b border-[#E4E4E7] bg-[#FAFAFA]">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#9c9590] mb-3">Způsob platby</p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-3">
            <Banknote size={16} className="text-[#6b6560] mt-0.5 shrink-0" aria-hidden />
            <span className="text-[14px] text-[#2a2624]">Hotovost při osobním převzetí</span>
          </div>
          <div className="flex items-start gap-3">
            <QrCode size={16} className="text-[#6b6560] mt-0.5 shrink-0" aria-hidden />
            <span className="text-[14px] text-[#2a2624]">
              QR kód při převzetí{' '}
              <span className="text-[#6b6560]">(zasíláme den předem)</span>
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-5">
        {submitError && (
          <p className="text-[13px] text-[#EF4444] mb-4" role="alert">{submitError}</p>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`w-full bg-[#171717] text-white font-medium py-4 text-[15px] tracking-wide hover:bg-black transition-colors disabled:bg-[#E5E5E5] disabled:text-[#A3A3A3] disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] ${ctaClassName}`.trim()}
        >
          {isSubmitting ? 'Odesílám…' : 'Dokončit objednávku poukazu'}
        </button>
        <p className="text-[12px] text-[#737373] text-center mt-3">
          Potvrzení objednávky posíláme do 30 minut v pracovní době.
        </p>
      </div>
    </div>
  );
}

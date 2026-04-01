import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';

function formatPrice(n) {
  if (n == null || n === '' || Number.isNaN(Number(n))) return '—';
  return new Intl.NumberFormat('cs-CZ').format(Number(n)) + ' Kč';
}

export default function VoucherSuccessPage() {
  const location = useLocation();
  const state = location.state || {};
  const totalPrice = state.totalPrice;
  const voucherLabel = state.voucherLabel ?? 'Dárkový poukaz';
  const pickupSummaryLine = state.pickupSummaryLine ?? 'Osobní vyzvednutí';

  return (
    <div className="min-h-[70vh] flex flex-col justify-center bg-[#FAFAFA] text-[#18181B] selection:bg-[#C5A880] selection:text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-24 text-center">
        <div
          className="mb-8 flex h-12 w-12 items-center justify-center rounded-full border border-[#E4E4E7] bg-[#FAFAFA]"
          aria-hidden
        >
          <Check className="h-5 w-5 text-[#18181B]" strokeWidth={1.5} aria-hidden />
        </div>

        <h1 className="mb-4 text-[28px] font-medium tracking-tight text-[#18181B] md:text-[32px]">
          Děkujeme za objednávku
        </h1>

        <p className="mb-12 max-w-md text-[16px] text-[#71717A]">
          Váš dárkový poukaz jsme začali připravovat. Budeme vás brzy kontaktovat telefonicky nebo emailem a domluvíme si čas a místo převzetí.
        </p>

        <div className="mb-12 w-full border border-[#E4E4E7] bg-[#FFFFFF] p-6 text-left" role="region" aria-labelledby="voucher-success-summary-heading">
          <h3 id="voucher-success-summary-heading" className="mb-4 text-[11px] font-medium uppercase tracking-[0.05em] text-[#71717A]">
            Shrnutí
          </h3>
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="min-w-0 text-[#18181B]">{voucherLabel}</span>
            <span className="shrink-0 font-medium tabular-nums text-[#18181B]">{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[14px] text-[#71717A]">
            <span className="min-w-0">{pickupSummaryLine}</span>
            <span className="shrink-0">Zdarma</span>
          </div>
        </div>

        <Link
          to="/"
          className="pb-1 text-[14px] font-medium text-[#18181B] border-b border-[#18181B] transition-colors hover:border-[#71717A] hover:text-[#71717A]"
        >
          Zpět na úvodní stránku
        </Link>
      </div>
    </div>
  );
}

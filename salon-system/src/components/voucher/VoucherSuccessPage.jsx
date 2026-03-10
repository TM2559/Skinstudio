import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';

function formatPrice(n) {
  return new Intl.NumberFormat('cs-CZ').format(n) + ' Kč';
}

export default function VoucherSuccessPage() {
  const location = useLocation();
  const state = location.state || {};
  const totalPrice = state.totalPrice ?? 0;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-[#FFFFFF]">
      <div className="text-center max-w-lg">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#171717] text-white mb-6" aria-hidden>
          <Check size={28} strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-medium text-[#171717] mb-2">
          Objednávka byla přijata
        </h1>
        <p className="text-[#737373] mb-0">
          Děkujeme. Váš dárkový poukaz začínáme připravovat.
        </p>

        <div
          className="bg-[#F9FAFB] border border-[#E5E5E5] rounded-md p-6 mt-8 max-w-md mx-auto text-left"
          role="region"
          aria-labelledby="next-steps-heading"
        >
          <h2 id="next-steps-heading" className="sr-only">
            Další kroky
          </h2>
          <ol className="space-y-4 text-sm text-[#171717] list-none pl-0">
            <li className="flex gap-3">
              <span className="flex shrink-0 w-6 h-6 rounded-full bg-[#E5E5E5] text-[#171717] font-semibold text-xs flex items-center justify-center" aria-hidden>1</span>
              Vyčkejte na SMS s potvrzením a adresou pro vyzvednutí.
            </li>
            <li className="flex gap-3">
              <span className="flex shrink-0 w-6 h-6 rounded-full bg-[#E5E5E5] text-[#171717] font-semibold text-xs flex items-center justify-center" aria-hidden>2</span>
              Připravte si prosím přesnou hotovost ({formatPrice(totalPrice)}).
            </li>
          </ol>
        </div>

        <Link
          to="/"
          className="inline-block mt-8 px-6 py-3 border border-[#E5E5E5] text-[#171717] font-medium rounded-md hover:bg-[#FAFAFA] transition-colors"
        >
          Zpět na úvodní stránku
        </Link>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { WEB_CONTENT } from '../../constants/content';

export default function CheckoutHeader() {
  const { brandName, ariaLabelHome } = WEB_CONTENT.header;
  const { backToSite } = WEB_CONTENT.voucherCheckout;

  return (
    <header className="sticky top-0 z-40 border-b border-[#E4E4E7] bg-[#FAFAFA]/95 backdrop-blur-sm pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5 sm:px-6">
        <Link
          to="/"
          className="font-display text-lg font-semibold tracking-tight text-[#18181B] transition-colors hover:text-[#52525B]"
          aria-label={ariaLabelHome}
        >
          {brandName}
        </Link>
        <Link
          to="/"
          className="text-sm font-medium text-[#71717A] transition-colors hover:text-[#18181B]"
        >
          {backToSite}
        </Link>
      </div>
    </header>
  );
}

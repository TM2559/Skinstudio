import React, { useState } from 'react';
import { WEB_CONTENT } from '../../constants/content';
import { VOUCHER_CHECKOUT_HERO_URL } from '../../constants/config';

/**
 * Emoční kotva nad formulářem — vložte soubor z `VOUCHER_CHECKOUT_HERO_URL` (default `public/voucher-checkout-hero.jpg`).
 */
export default function VoucherCheckoutHero() {
  const [useFallback, setUseFallback] = useState(false);
  const alt = WEB_CONTENT.voucherCheckout.heroImageAlt;

  if (useFallback) {
    return (
      <div
        className="mb-12 aspect-[21/9] w-full overflow-hidden bg-gradient-to-br from-[#E4E4E7] via-[#F4F4F5] to-[#D4D4D8]"
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    <div className="mb-12 aspect-[21/9] w-full overflow-hidden bg-[#E4E4E7]">
      <img
        src={VOUCHER_CHECKOUT_HERO_URL}
        alt={alt}
        className="h-full w-full object-cover"
        onError={() => setUseFallback(true)}
      />
    </div>
  );
}

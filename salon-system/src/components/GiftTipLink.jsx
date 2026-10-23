import React from 'react';
import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { WEB_CONTENT } from '../constants/content';
import { giftVoucherHref } from '../utils/voucherHelpers';

/**
 * Štítek „Tip na dárek“ u služby v ceníku, na kterou jde objednat dárkový poukaz.
 * @param {'light'|'dark'} props.variant
 * @param {string} [props.serviceId] - S ID je štítek odkaz na objednávku poukazu, bez něj jen štítek.
 */
export default function GiftTipLink({ variant = 'light', serviceId }) {
  const isDark = variant === 'dark';
  const className = `inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap align-middle transition-colors ${
    isDark
      ? 'border border-[#daa59c]/40 text-[#daa59c] hover:bg-[#daa59c]/10'
      : 'border border-[#C5A880]/50 bg-[#FAF7F3] text-[#7A5C28] hover:bg-[#F3ECE2]'
  }`;
  const content = (
    <>
      <Gift size={11} aria-hidden /> {WEB_CONTENT.cenik.giftTip}
    </>
  );
  if (!serviceId) return <span className={className}>{content}</span>;
  return (
    <Link to={giftVoucherHref(serviceId)} className={className} aria-label={WEB_CONTENT.cenik.giftTipAria}>
      {content}
    </Link>
  );
}

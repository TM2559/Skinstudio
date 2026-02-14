import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import ServiceDescriptionMarkdown from './ServiceDescriptionMarkdown';

/** Remove parenthetical meta-commentary from description text. */
function cleanDescription(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ROSE_ACCENT = '#daa59c';
const BORDER_DARK = 'rgba(255,255,255,0.08)';

/**
 * Unified expandable service list (accordion) for Cosmetics (light) and PMU (dark) sections.
 * @param {Object} props
 * @param {Array} props.services - List of { id, name, price, description }
 * @param {'light'|'dark'} props.variant - Light = gold accents; dark = rose gold on dark bg
 * @param {string} props.loadingText - Shown when services.length === 0
 * @param {string} props.ctaReservovat - Button label (e.g. "Rezervovat termín")
 * @param {string} [props.ctaReservovatShort] - Optional short CTA for footer button
 * @param {string} [props.priceNote] - Optional note below list (e.g. PMU "dle ceníku")
 * @param {(service: Object) => string} props.getReserveHref - (s) => url for reserve button
 * @param {string} [props.footerHref] - Optional href for footer CTA (if omitted, no footer button)
 */
export default function ServiceListAccordion({
  services = [],
  variant = 'light',
  loadingText = 'Načítání…',
  ctaReservovat,
  ctaReservovatShort,
  priceNote,
  getReserveHref,
  footerHref,
}) {
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const isDark = variant === 'dark';

  const borderColor = isDark ? BORDER_DARK : '#E5E5E5';
  const titleClass = isDark
    ? 'font-display text-lg sm:text-xl font-semibold text-white min-w-0 pr-4'
    : 'font-display text-lg sm:text-xl text-stone-800 font-semibold min-w-0 pr-4';
  const priceClass = isDark
    ? `font-normal tabular-nums text-right font-medium`
    : 'font-normal text-stone-700 tabular-nums text-right';
  const priceStyle = isDark ? { color: ROSE_ACCENT } : undefined;
  const rowHoverClass = isDark
    ? 'hover:bg-white/5 active:bg-white/10'
    : 'hover:bg-stone-50/80 active:bg-stone-100/80';
  const chevronClass = isDark ? 'text-white/50' : 'text-stone-400';

  if (services.length === 0) {
    return (
      <div className={isDark ? 'text-center py-12 text-[#A1A1AA]/80 text-sm' : 'text-center py-12 text-sm text-gray-500'}>
        {loadingText}
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-0" style={{ borderColor }}>
        {services.map((s) => {
          const hasDescription = !!(s.description && cleanDescription(s.description));
          const isExpanded = expandedServiceId === s.id;
          const priceText =
            s.price != null && s.price !== 0
              ? (s.isStartingPrice ? `od ${Number(s.price)} Kč` : `${Number(s.price)} Kč`)
              : (isDark ? 'dle ceníku' : '—');
          return (
            <li
              key={s.id}
              className={isDark ? 'border-b last:border-b-0 border-white/5' : ''}
              style={!isDark ? { borderColor } : undefined}
            >
              <button
                type="button"
                onClick={() => setExpandedServiceId((id) => (id === s.id ? null : s.id))}
                className={`w-full flex justify-between items-center text-left transition-colors py-[20px] ${rowHoverClass} ${isDark ? 'px-0' : ''}`}
              >
                <span className={titleClass}>{s.name}</span>
                <div className="flex items-center shrink-0">
                  <span className={priceClass} style={priceStyle}>
                    {priceText}
                  </span>
                  {hasDescription && (
                    <span className={`ml-4 flex items-center justify-center shrink-0 ${chevronClass}`}>
                      {isExpanded ? <ChevronUp size={20} aria-hidden /> : <ChevronDown size={20} aria-hidden />}
                    </span>
                  )}
                </div>
              </button>
              <div
                className="grid ease-out"
                style={{
                  gridTemplateRows: isExpanded && hasDescription ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.3s ease, opacity 0.3s ease',
                }}
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    className="pb-6 pt-0 px-0 transition-opacity duration-300 ease-out"
                    style={{ opacity: isExpanded && hasDescription ? 1 : 0 }}
                  >
                    {hasDescription && (
                      <>
                        <ServiceDescriptionMarkdown text={s.description} theme={isDark ? 'dark' : 'light'} />
                        {getReserveHref ? (
                          <Link
                            to={getReserveHref(s)}
                            className={
                              isDark
                                ? 'mt-6 inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 font-sans font-semibold text-xs uppercase tracking-widest text-white transition-all duration-300 hover:brightness-95 border border-[#D49A91]/20 focus:outline-none focus:ring-2 focus:ring-[#daa59c] focus:ring-offset-2 focus:ring-offset-[#0F0F0F]'
                                : 'mt-6 inline-flex items-center justify-center gap-2 bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)] focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2'
                            }
                            style={
                              isDark
                                ? {
                                    background: 'linear-gradient(to bottom, #B37E76, #D49A91, #B37E76)',
                                    boxShadow: '0 4px 20px rgba(179,126,118,0.3)',
                                  }
                                : undefined
                            }
                          >
                            <Calendar size={16} /> {ctaReservovat}
                          </Link>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {priceNote && (
        <p className={`mt-6 text-center text-sm ${isDark ? 'text-[#A1A1AA]/70' : 'text-gray-500'}`}>
          {priceNote}
        </p>
      )}
      {footerHref && ctaReservovatShort && (
        <div className="text-center mt-8">
          <Link
            to={footerHref}
            className={
              isDark
                ? 'inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 font-sans font-semibold text-xs uppercase tracking-widest text-white transition-all duration-300 hover:brightness-95 border border-[#D49A91]/20'
                : 'inline-flex items-center justify-center gap-2 bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)]'
            }
            style={
              isDark
                ? {
                    background: 'linear-gradient(to bottom, #B37E76, #D49A91, #B37E76)',
                    boxShadow: '0 4px 20px rgba(179,126,118,0.3)',
                  }
                : undefined
            }
          >
            <Calendar size={14} /> {ctaReservovatShort}
          </Link>
        </div>
      )}
    </>
  );
}

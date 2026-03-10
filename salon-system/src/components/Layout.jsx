import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MapPin, Mail, Phone } from 'lucide-react';
import { INSTAGRAM_URL } from '../firebaseConfig';
import InstagramShowcase from './InstagramShowcase';
import { TaglineWithHeart } from './FooterTagline';
import { WEB_CONTENT } from '../constants/content';

const getNav = () => {
  return [...WEB_CONTENT.header.navItems];
};
const NAV = getNav();

export default function Layout({ children, setView }) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (hash) => {
    if (!isHome) return;
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const linkClass =
    'text-xs xl:text-sm font-semibold uppercase tracking-widest transition-colors text-stone-600 hover:text-[var(--skin-gold-dark)] whitespace-nowrap';
  const ctaClass =
    'bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 whitespace-nowrap shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)]';

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: 'var(--skin-cream)' }}>
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(253, 251, 247, 0.9)',
          borderColor: 'rgba(0,0,0,0.05)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16 gap-4">
          <Link
            to="/"
            className="font-display font-bold text-xl sm:text-2xl tracking-wide text-[var(--skin-charcoal)] hover:text-stone-700 transition-colors shrink-0"
            aria-label={WEB_CONTENT.header.ariaLabelHome}
          >
            {WEB_CONTENT.header.brandName}
          </Link>

          <nav className="hidden lg:flex items-center gap-3 xl:gap-4 shrink min-w-0">
            {NAV.map((item) => {
              if (item.hash) {
                if (item.to !== '/') {
                  return (
                    <Link key={item.label} to={item.to} className={linkClass}>
                      {item.label}
                    </Link>
                  );
                }
                return isHome ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => scrollTo(item.hash)}
                    className={linkClass}
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={item.label}
                    to={`/#${item.hash}`}
                    className={linkClass}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={item.cta ? ctaClass : linkClass}
                  onClick={item.to === '/rezervace' ? () => { setView?.('customer'); window.scrollTo(0, 0); } : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            className="lg:hidden p-2 text-stone-600 hover:text-[var(--skin-gold-dark)] transition-colors shrink-0"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={WEB_CONTENT.header.ariaLabelMenu}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div
            className="lg:hidden border-t px-4 py-3 flex flex-col gap-1"
            style={{
              backgroundColor: 'rgba(253, 251, 247, 0.98)',
              borderColor: 'rgba(0,0,0,0.05)',
            }}
          >
            {NAV.map((item) => {
              if (item.hash) {
                if (item.to !== '/') {
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="py-3 text-sm font-semibold uppercase tracking-widest text-stone-600 hover:text-[var(--skin-gold-dark)] transition-colors block"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                }
                return isHome ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => scrollTo(item.hash)}
                    className={`text-left py-3 text-sm font-semibold uppercase tracking-widest text-stone-600 hover:text-[var(--skin-gold-dark)] transition-colors`}
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={item.label}
                    to={`/#${item.hash}`}
                    className="py-3 text-sm font-semibold uppercase tracking-widest text-stone-600 hover:text-[var(--skin-gold-dark)] transition-colors block"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={item.cta ? `inline-flex ${ctaClass} justify-center my-1` : `py-3 text-sm font-semibold uppercase tracking-widest text-stone-600 hover:text-[var(--skin-gold-dark)] transition-colors block`}
                    onClick={() => {
                    setMenuOpen(false);
                    if (item.to === '/rezervace') { setView?.('customer'); window.scrollTo(0, 0); }
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <InstagramShowcase />

      <footer id="kontakt" className="mt-auto bg-[#1c1c1c] font-sans font-light text-gray-200">
        <div className="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Column 1: Brand & Info */}
          <div>
            <h3 className="text-white uppercase tracking-wide font-semibold text-sm mb-2">
              {WEB_CONTENT.footer.brandHeading}
            </h3>
            <p className="font-medium mb-2">{WEB_CONTENT.footer.ownerName}</p>
            <p className="text-sm leading-relaxed">
              <TaglineWithHeart tagline={WEB_CONTENT.footer.tagline} heartWord={WEB_CONTENT.footer.heartReplacementWord} />
            </p>
          </div>

          {/* Column 2: Kontakt */}
          <div className="md:text-right md:flex md:flex-col md:items-end">
            <h3 className="text-white uppercase tracking-wide font-semibold text-sm mb-4">
              {WEB_CONTENT.footer.contactHeading}
            </h3>
            <address className="not-italic space-y-2 text-sm">
              <p className="flex items-center gap-2 md:justify-end">
                <MapPin size={16} className="shrink-0 opacity-70" />
                {WEB_CONTENT.footer.location}
              </p>
              <p className="flex items-center gap-2 md:justify-end">
                <Mail size={16} className="shrink-0 opacity-70" />
                <a href={`mailto:${WEB_CONTENT.footer.email}`} className="hover:text-[#8C5E35] transition-colors">
                  {WEB_CONTENT.footer.email}
                </a>
              </p>
              <p className="flex items-center gap-2 md:justify-end">
                <Phone size={16} className="shrink-0 opacity-70" />
                <a href={`tel:${WEB_CONTENT.footer.phone.replace(/\s/g, '')}`} className="hover:text-[#8C5E35] transition-colors">
                  {WEB_CONTENT.footer.phone}
                </a>
              </p>
              <p className="flex items-center gap-2 md:justify-end">
                IČO {WEB_CONTENT.footer.ico}
              </p>
              <p className="flex items-center gap-2 md:justify-end text-xs text-gray-400">
                {WEB_CONTENT.footer.tradeRegisterText}
              </p>
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700/60">
          <div className="container mx-auto px-6 py-4">
            <p className="text-xs text-center">
              {WEB_CONTENT.footer.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

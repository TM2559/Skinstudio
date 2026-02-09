import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Instagram } from 'lucide-react';
import { INSTAGRAM_URL } from '../firebaseConfig';
import InstagramShowcase from './InstagramShowcase';

const getNav = () => {
  const items = [
    { label: 'KOSMETIKA', to: '/kosmetika' },
    { label: 'PERMANENTNÍ MAKE-UP', to: '/pmu' },
    { label: 'KONTAKT', to: '/', hash: 'kontakt' },
  ];
  if (INSTAGRAM_URL) items.push({ label: 'Instagram', to: '/', hash: 'instagram', iconOnly: true });
  items.push({ label: 'REZERVACE', to: '/rezervace', cta: true });
  return items;
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

  const navLinkTo = (item) => {
    if (item.hash) return isHome ? `#${item.hash}` : `/#${item.hash}`;
    return item.to;
  };

  const linkClass =
    'text-xs xl:text-sm font-semibold uppercase tracking-widest transition-colors text-stone-600 hover:text-[var(--skin-gold-dark)] whitespace-nowrap';
  const ctaClass =
    'skin-accent text-xs xl:text-sm font-semibold uppercase tracking-widest px-3 xl:px-4 py-2 rounded-full whitespace-nowrap';

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
            aria-label="Skin Studio – Domů"
          >
            Skin Studio
          </Link>

          <nav className="hidden lg:flex items-center gap-3 xl:gap-4 shrink min-w-0">
            {NAV.map((item) => {
              if (item.iconOnly) {
                const href = isHome ? `#${item.hash}` : `/#${item.hash}`;
                return isHome ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => scrollTo(item.hash)}
                    className={linkClass}
                    aria-label="Instagram"
                  >
                    <Instagram size={20} strokeWidth={1.5} />
                  </button>
                ) : (
                  <Link
                    key={item.label}
                    to={href}
                    className={linkClass}
                    aria-label="Instagram"
                  >
                    <Instagram size={20} strokeWidth={1.5} />
                  </Link>
                );
              }
              if (item.hash) {
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
                  onClick={item.to === '/rezervace' ? () => setView?.('customer') : undefined}
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
            aria-label="Menu"
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
              if (item.iconOnly) {
                const href = isHome ? `#${item.hash}` : `/#${item.hash}`;
                return isHome ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => scrollTo(item.hash)}
                    className="py-3 text-stone-600 hover:text-[var(--skin-gold-dark)] transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram size={22} strokeWidth={1.5} />
                  </button>
                ) : (
                  <Link
                    key={item.label}
                    to={href}
                    className="py-3 inline-block text-stone-600 hover:text-[var(--skin-gold-dark)] transition-colors"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Instagram"
                  >
                    <Instagram size={22} strokeWidth={1.5} />
                  </Link>
                );
              }
              if (item.hash) {
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
                    if (item.to === '/rezervace') setView?.('customer');
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

      <footer
        className="border-t py-6 mt-auto skin-border"
        style={{ backgroundColor: 'var(--skin-white)' }}
      >
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <p className="text-[#6b6560] text-[10px] tracking-[0.3em] uppercase order-2 sm:order-1">
            © 2026 Skin Studio – Lucie Metelková
          </p>
          {INSTAGRAM_URL && (
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="order-1 sm:order-2 flex items-center gap-2 text-[#6b6560] hover:text-[var(--skin-charcoal)] transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={18} />
              <span className="text-[10px] uppercase tracking-wider">Instagram</span>
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}

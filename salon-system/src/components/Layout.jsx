import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Instagram, MapPin, Mail, Phone } from 'lucide-react';
import { INSTAGRAM_URL } from '../firebaseConfig';
import InstagramShowcase from './InstagramShowcase';

const getNav = () => {
  const items = [
    { label: 'KOSMETIKA', to: '/kosmetika' },
    { label: 'PERMANENTNÍ MAKE-UP', to: '/pmu#pmu' },
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

      <footer className="mt-auto bg-[#1c1c1c] text-gray-400">
        <div className="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Brand & Info */}
          <div>
            <h3 className="text-white uppercase tracking-wide font-semibold text-sm mb-2">
              SKIN STUDIO
            </h3>
            <p className="text-gray-400 font-medium mb-2">Lucie Metelková</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Prémiová péče o pleť a permanentní make-up v srdci Uherského Brodu.
            </p>
          </div>

          {/* Column 2: Rychlé odkazy */}
          <div>
            <h3 className="text-white uppercase tracking-wide font-semibold text-sm mb-4">
              NAVIGACE
            </h3>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-gray-400 hover:text-[#8C5E35] transition-colors text-sm">
                Domů
              </Link>
              <Link to="/#services" className="text-gray-400 hover:text-[#8C5E35] transition-colors text-sm">
                Služby
              </Link>
              <Link to="/#about" className="text-gray-400 hover:text-[#8C5E35] transition-colors text-sm">
                O mně
              </Link>
              <Link to="/#contact" className="text-gray-400 hover:text-[#8C5E35] transition-colors text-sm">
                Kontakt
              </Link>
              <Link
                to="/rezervace"
                className="text-gray-400 hover:text-[#8C5E35] transition-colors text-sm"
                onClick={() => setView?.('customer')}
              >
                Rezervace
              </Link>
            </nav>
          </div>

          {/* Column 3: Kontakt & Parkování */}
          <div>
            <h3 className="text-white uppercase tracking-wide font-semibold text-sm mb-4">
              KONTAKT
            </h3>
            <address className="not-italic space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <MapPin size={16} className="shrink-0 text-gray-500" />
                Masarykovo náměstí 72 (Budova ČSOB – 2. patro)
              </p>
              <p className="flex items-center gap-2">
                <Mail size={16} className="shrink-0 text-gray-500" />
                <a href="mailto:lucie@skinstudio.cz" className="hover:text-[#8C5E35] transition-colors">
                  lucie@skinstudio.cz
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} className="shrink-0 text-gray-500" />
                <a href="tel:+420724875558" className="hover:text-[#8C5E35] transition-colors">
                  +420 724 875 558
                </a>
              </p>
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700/60">
          <div className="container mx-auto px-6 py-4">
            <p className="text-gray-500 text-xs text-center">
              © 2024 Skin Studio Lucie Metelková. Všechna práva vyhrazena.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

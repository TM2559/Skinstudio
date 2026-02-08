import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { onSnapshot } from 'firebase/firestore';
import { getDocPath } from '../firebaseConfig';
import ComparisonSlider from './ComparisonSlider';
import ReservationApp from './ReservationApp';

const CATEGORY_PMU = 'PMU';

const PMU_SLIDERS_CONFIG = 'pmuSliders';

/** Jeden demo před/po slider, když v adminu ještě nic není */
const DEMO_SLIDER = {
  beforeImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
  afterImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
  altText: 'Ukázka před a po (demo)',
};

export default function PMUPage({ services = [], schedule = {}, reservations = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sliders, setSliders] = useState([]);

  const pmuServices = useMemo(
    () =>
      services
        .filter((s) => (s.category || 'STANDARD') === CATEGORY_PMU)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
    [services]
  );

  useEffect(() => {
    const docRef = getDocPath('config', PMU_SLIDERS_CONFIG);
    const unsub = onSnapshot(docRef, (snap) => {
      const data = snap.data();
      setSliders(Array.isArray(data?.sliders) ? data.sliders : []);
    });
    return () => unsub();
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#A1A1AA] font-sans antialiased">
      {/* Dark theme header – transparent, white text */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F0F]/80 backdrop-blur-md border-b border-white/5"
        aria-label="Navigace"
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <Link
            to="/"
            className="font-display font-bold text-xl tracking-wide text-white hover:text-[#daa59c] transition-colors shrink-0"
            aria-label="Skin Studio – Domů"
          >
            Skin Studio
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#daa59c] transition-colors"
            >
              Domů
            </Link>
            <button
              type="button"
              onClick={() => scrollTo('philosophy')}
              className="text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#daa59c] transition-colors"
            >
              Filozofie
            </button>
            <button
              type="button"
              onClick={() => scrollTo('portfolio')}
              className="text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#daa59c] transition-colors"
            >
              Portfolio
            </button>
            <button
              type="button"
              onClick={() => scrollTo('cenik')}
              className="text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#daa59c] transition-colors"
            >
              Ceník
            </button>
            <button
              type="button"
              onClick={() => scrollTo('rezervace-pmu')}
              className="text-sm font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full bg-gradient-to-r from-[#B37E76] via-[#D49A91] to-[#B37E76] text-white border border-[#D49A91]/20 shadow-lg shadow-[#B37E76]/30 hover:shadow-[#B37E76]/40 hover:scale-[1.01] transition-all"
            >
              Rezervace
            </button>
          </nav>

          <button
            type="button"
            className="md:hidden p-2 text-white hover:text-[#daa59c] transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-white/5 px-4 py-4 flex flex-col gap-1 bg-[#0F0F0F]">
            <Link
              to="/"
              className="py-3 text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#daa59c]"
              onClick={() => setMenuOpen(false)}
            >
              Domů
            </Link>
            <button
              type="button"
              onClick={() => scrollTo('philosophy')}
              className="text-left py-3 text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#daa59c]"
            >
              Filozofie
            </button>
            <button
              type="button"
              onClick={() => scrollTo('portfolio')}
              className="text-left py-3 text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#daa59c]"
            >
              Portfolio
            </button>
            <button
              type="button"
              onClick={() => scrollTo('cenik')}
              className="text-left py-3 text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#daa59c]"
            >
              Ceník
            </button>
            <button
              type="button"
              onClick={() => { scrollTo('rezervace-pmu'); setMenuOpen(false); }}
              className="inline-flex justify-center py-3 mt-2 text-sm font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full bg-gradient-to-r from-[#B37E76] via-[#D49A91] to-[#B37E76] text-white border border-[#D49A91]/20 shadow-lg shadow-[#B37E76]/30 hover:shadow-[#B37E76]/40 hover:scale-[1.01] transition-all"
            >
              Rezervace
            </button>
          </div>
        )}
      </header>

      <main>
        {/* Hero – full-screen, serif headline, gold CTA */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-16 text-center">
          <p className="font-display text-[#daa59c] text-sm uppercase tracking-[0.3em] mb-6">
            Permanent Make-Up
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight max-w-3xl">
            Umění trvalé krásy
          </h1>
          <p className="mt-8 text-[#A1A1AA] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Precizní linky. Přirozený výsledek. Výjimečný zážitek.
          </p>
          <button
            type="button"
            onClick={() => scrollTo('rezervace-pmu')}
            className="mt-12 inline-flex items-center justify-center px-8 py-4 font-semibold uppercase text-[10px] tracking-[0.2em] rounded-full bg-gradient-to-r from-[#B37E76] via-[#D49A91] to-[#B37E76] text-white border border-[#D49A91]/20 shadow-lg shadow-[#B37E76]/30 hover:shadow-[#B37E76]/40 hover:scale-[1.01] transition-all"
          >
            Objednat konzultaci
          </button>
        </section>

        {/* Philosophy – minimal text, plenty of dark space */}
        <section
          id="philosophy"
          className="scroll-mt-24 py-24 sm:py-32 px-4"
        >
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white mb-8">
              Filozofie
            </h2>
            <p className="text-[#A1A1AA] leading-relaxed text-base sm:text-lg">
              Trvalé líčení není o výrazné kresbě — je o jemnosti, symetrii a dlouhodobé spokojenosti.
              Každý tah je promyšlen tak, aby podtrhl vaši přirozenou krásu.
            </p>
            <p className="mt-8 text-[#A1A1AA]/80 text-sm sm:text-base leading-relaxed">
              Výběr pigmentů, technika i následná péče tvoří jeden celek. Svěřte se do rukou, které toto umění ovládají.
            </p>
          </div>
        </section>

        {/* Portfolio – před/po slidery z adminu + doplňková mřížka */}
        <section
          id="portfolio"
          className="scroll-mt-24 py-24 sm:py-32 px-4"
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white text-center mb-16">
              Portfolio
            </h2>
            <div className={`grid gap-8 ${sliders.length > 0 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'}`}>
              {(sliders.length > 0 ? sliders : [DEMO_SLIDER]).map((item, index) => (
                <div key={sliders.length > 0 ? `${item.beforeImage}-${index}` : 'demo'}>
                  <ComparisonSlider
                    beforeImage={item.beforeImage}
                    afterImage={item.afterImage}
                    altText={item.altText || 'Před a po'}
                  />
                  {sliders.length === 0 && (
                    <p className="text-center text-[#A1A1AA]/60 text-sm mt-4">
                      Demo – vlastní před/po přidáte v adminu v záložce PMU.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing / Booking – dark card */}
        <section
          id="cenik"
          className="scroll-mt-24 py-24 sm:py-32 px-4"
        >
          <div className="max-w-xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white text-center mb-12">
              Ceník a rezervace
            </h2>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 sm:p-10">
              <ul className="space-y-6 text-[#A1A1AA]">
                {pmuServices.length === 0 ? (
                  <li className="py-6 text-center text-[#A1A1AA]/80 text-sm">
                    Služby se připravují…
                  </li>
                ) : (
                  pmuServices.map((service, index) => {
                    const isLast = index === pmuServices.length - 1;
                    const priceText =
                      service.price == null || service.price === 0
                        ? 'dle ceníku'
                        : `${Number(service.price)} Kč`;
                    return (
                      <li
                        key={service.id}
                        className={`flex justify-between items-baseline pb-4 ${!isLast ? 'border-b border-white/5' : ''}`}
                      >
                        <span>
                          {service.name}
                          {service.duration ? (
                            <span className="ml-2 text-[#A1A1AA]/70 text-sm">
                              ({service.duration} min)
                            </span>
                          ) : null}
                        </span>
                        <span className="text-[#daa59c] font-medium">{priceText}</span>
                      </li>
                    );
                  })
                )}
              </ul>
              <p className="mt-8 text-[#A1A1AA]/70 text-sm text-center">
                Přesné ceny a termíny vám sdělíme při rezervaci nebo na konzultaci.
              </p>
              <button
                type="button"
                onClick={() => scrollTo('rezervace-pmu')}
                className="mt-8 w-full inline-flex items-center justify-center py-4 font-semibold uppercase text-[10px] tracking-[0.2em] rounded-full bg-gradient-to-r from-[#B37E76] via-[#D49A91] to-[#B37E76] text-white border border-[#D49A91]/20 shadow-lg shadow-[#B37E76]/30 hover:shadow-[#B37E76]/40 hover:scale-[1.01] transition-all"
              >
                Rezervovat termín
              </button>
            </div>
          </div>
        </section>

        {/* Rezervační widget – dark mode, pouze PMU služby */}
        <section id="rezervace-pmu" className="scroll-mt-24 py-24 sm:py-32 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white text-center mb-12">
              Rezervace PMU
            </h2>
            <ReservationApp
              loading={false}
              view="customer"
              setView={() => {}}
              adminPassword=""
              setAdminPassword={() => {}}
              loginError=""
              setLoginError={() => {}}
              handleLogoClick={() => {}}
              handleLogin={() => {}}
              services={services}
              schedule={schedule}
              reservations={reservations}
              mode="dark"
              widgetOnly
            />
          </div>
        </section>
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-[#A1A1AA]/60 text-xs uppercase tracking-widest">
          <Link to="/" className="hover:text-[#daa59c] transition-colors">
            Skin Studio
          </Link>
          <span>·</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}

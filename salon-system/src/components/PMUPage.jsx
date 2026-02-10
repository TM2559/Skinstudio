import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { query, where, onSnapshot } from 'firebase/firestore';
import { getCollectionPath } from '../firebaseConfig';
import { TRANSFORMATIONS_COLLECTION, PMU_CATEGORY } from '../constants/cosmetics';
import ComparisonSlider from './ComparisonSlider';
import ReservationApp from './ReservationApp';

const CATEGORY_PMU = 'PMU';

/** Demo před/po slider, když v adminu ještě nic není */
const DEMO_SLIDER = {
  beforeImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
  afterImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
  altText: 'Ukázka před a po (demo)',
};

export default function PMUPage({ services = [], schedule = {}, reservations = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sliders, setSliders] = useState([]);
  const pmuCarouselRef = useRef(null);
  const [pmuActiveIndex, setPmuActiveIndex] = useState(0);

  const pmuServices = useMemo(
    () =>
      services
        .filter((s) => (s.category || 'STANDARD') === CATEGORY_PMU)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
    [services]
  );

  useEffect(() => {
    const colT = getCollectionPath(TRANSFORMATIONS_COLLECTION);
    const qT = query(colT, where('category', '==', PMU_CATEGORY));
    const unsub = onSnapshot(qT, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setSliders(list);
    });
    return () => unsub();
  }, []);

  // Sync pagination dots with horizontal scroll position (mobile carousel)
  useEffect(() => {
    const el = pmuCarouselRef.current;
    if (!el || displaySliders.length <= 1) return;
    const onScroll = () => {
      const itemWidth = el.offsetWidth * 0.85 + 16;
      const index = Math.round(el.scrollLeft / itemWidth);
      const clamped = Math.min(Math.max(0, index), displaySliders.length - 1);
      setPmuActiveIndex(clamped);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [sliders.length]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const displaySliders = sliders.length > 0
    ? sliders.map((item) => ({
        beforeImage: item.imageBeforeUrl,
        afterImage: item.imageAfterUrl,
        altText: item.title || 'Před a po',
      }))
    : [DEMO_SLIDER];

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#A1A1AA] font-sans antialiased">
      {/* Dark theme header – jako na main/produkci */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F0F]/80 backdrop-blur-md border-b border-white/5"
        aria-label="Navigace"
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <Link
            to="/"
            className="font-display font-bold text-xl tracking-wide text-white hover:text-[#C48F83] transition-colors shrink-0"
            aria-label="Skin Studio – Domů"
          >
            Skin Studio
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83] transition-colors"
            >
              Domů
            </Link>
            <button
              type="button"
              onClick={() => scrollTo('philosophy')}
              className="text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83] transition-colors"
            >
              Filozofie
            </button>
            <button
              type="button"
              onClick={() => scrollTo('portfolio')}
              className="text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83] transition-colors"
            >
              Portfolio
            </button>
            <button
              type="button"
              onClick={() => scrollTo('cenik')}
              className="text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83] transition-colors"
            >
              Ceník
            </button>
            <button
              type="button"
              onClick={() => scrollTo('rezervace-pmu')}
              className="text-sm font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full bg-[#C48F83] text-white hover:bg-[#C48F83]/90 hover:scale-[1.01] transition-all"
            >
              Rezervace
            </button>
          </nav>

          <button
            type="button"
            className="md:hidden p-2 text-white hover:text-[#C48F83] transition-colors"
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
              className="py-3 text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83]"
              onClick={() => setMenuOpen(false)}
            >
              Domů
            </Link>
            <button
              type="button"
              onClick={() => scrollTo('philosophy')}
              className="text-left py-3 text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83]"
            >
              Filozofie
            </button>
            <button
              type="button"
              onClick={() => scrollTo('portfolio')}
              className="text-left py-3 text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83]"
            >
              Portfolio
            </button>
            <button
              type="button"
              onClick={() => scrollTo('cenik')}
              className="text-left py-3 text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83]"
            >
              Ceník
            </button>
            <button
              type="button"
              onClick={() => { scrollTo('rezervace-pmu'); setMenuOpen(false); }}
              className="inline-flex justify-center py-3 mt-2 text-sm font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full bg-[#C48F83] text-white hover:bg-[#C48F83]/90 hover:scale-[1.01] transition-all"
            >
              Rezervace
            </button>
          </div>
        )}
      </header>

      <main>
        {/* Hero – full-screen, jako na main */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-16 text-center">
          <p className="font-display text-[#C48F83] text-sm uppercase tracking-[0.3em] mb-6">
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
            className="mt-12 inline-flex items-center justify-center px-8 py-4 font-semibold uppercase text-[10px] tracking-[0.2em] rounded-full bg-[#C48F83] text-white hover:bg-[#C48F83]/90 hover:scale-[1.01] transition-all"
          >
            Objednat konzultaci
          </button>
        </section>

        {/* Filozofie – text-left, heading centered, max-w-2xl */}
        <section
          id="philosophy"
          className="scroll-mt-24 py-24 sm:py-32 px-4"
        >
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white mb-8 text-center">
              Filozofie
            </h2>
            <div className="text-left">
              <p className="text-[#A1A1AA] leading-relaxed text-base sm:text-lg max-w-2xl">
                Trvalé líčení není o výrazné kresbě — je o jemnosti, symetrii a dlouhodobé spokojenosti.
                Každý tah je promyšlen tak, aby podtrhl vaši přirozenou krásu.
              </p>
              <p className="mt-8 text-[#A1A1AA]/80 text-sm sm:text-base leading-relaxed max-w-2xl">
                Výběr pigmentů, technika i následná péče tvoří jeden celek. Svěřte se do rukou, které toto umění ovládají.
              </p>
            </div>
          </div>
        </section>

        {/* Portfolio – před/po slidery (nový aspect ratio v ComparisonSlider), data z Fotografie → Proměny PMU */}
        <section
          id="portfolio"
          className="scroll-mt-24 py-24 sm:py-32 px-4"
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white text-center mb-16">
              Portfolio
            </h2>
            <div
              ref={pmuCarouselRef}
              className={`mobile-carousel carousel-track md:grid md:grid-cols-1 lg:grid-cols-2 md:overflow-visible gap-8 md:gap-10 md:gap-y-12 -mx-4 px-4 md:mx-0 md:px-0`}
            >
              {displaySliders.map((item, index) => (
                <div
                  key={index}
                  className="mobile-carousel-item md:min-w-0 md:shrink-0 md:flex-none md:w-auto space-y-4"
                >
                  <ComparisonSlider
                    beforeImage={item.beforeImage}
                    afterImage={item.afterImage}
                    altText={item.altText}
                    theme="dark"
                  />
                  {sliders.length === 0 && (
                    <p className="text-center text-[#A1A1AA]/60 text-sm mt-4">
                      Demo – vlastní před/po přidáte v adminu v záložce Fotografie → Proměny (kategorie PMU).
                    </p>
                  )}
                </div>
              ))}
            </div>
            {displaySliders.length >= 1 && (
              <div className="carousel-dots" role="tablist" aria-label="PMU proměny">
                {displaySliders.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-label={`Proměna ${i + 1}`}
                    aria-selected={pmuActiveIndex === i}
                    onClick={() => {
                      const el = pmuCarouselRef.current;
                      if (!el) return;
                      const itemWidth = el.offsetWidth * 0.85 + 16;
                      el.scrollTo({ left: i * itemWidth, behavior: 'smooth' });
                    }}
                    className={`dot ${pmuActiveIndex === i ? 'dot-active' : ''}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Ceník a rezervace – dark card jako na main */}
        <section
          id="cenik"
          className="scroll-mt-24 py-24 sm:py-32 px-4"
        >
          <div className="max-w-xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white text-center mb-12">
              Ceník a rezervace
            </h2>
            <div className="bg-white/5 rounded-2xl p-8 sm:p-10 transition-colors duration-300 hover:bg-white/10">
              <ul className="space-y-0 text-[#A1A1AA]">
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
                        className={`flex justify-between items-baseline py-4 px-3 -mx-3 rounded-lg transition-colors duration-300 hover:bg-white/5 ${!isLast ? 'border-b border-white/5' : ''}`}
                      >
                        <span>
                          {service.name}
                          {service.duration ? (
                            <span className="ml-2 text-[#A1A1AA]/70 text-sm">
                              ({service.duration} min)
                            </span>
                          ) : null}
                        </span>
                        <span className="font-display text-[#C48F83] font-medium">{priceText}</span>
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
                className="mt-8 w-full inline-flex items-center justify-center py-4 font-semibold uppercase text-[10px] tracking-[0.2em] rounded-full text-white transition-all bg-[#C48F83] hover:bg-[#C48F83]/90 hover:scale-[1.01]"
              >
                Rezervovat termín
              </button>
            </div>
          </div>
        </section>

        {/* Rezervační widget – dark mode jako na main */}
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
              services={pmuServices}
              schedule={schedule}
              reservations={reservations}
              widgetOnly
              mode="dark"
            />
          </div>
        </section>
      </main>

      {/* Footer – jako na main */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-[#A1A1AA]/60 text-xs uppercase tracking-widest">
          <Link to="/" className="hover:text-[#C48F83] transition-colors">
            Skin Studio
          </Link>
          <span>·</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}

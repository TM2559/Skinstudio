import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone, Mail, MapPin } from 'lucide-react';
import { query, where, onSnapshot } from 'firebase/firestore';
import { getPublicContentCollectionPathsForRead } from '../firebaseConfig';
import { TRANSFORMATIONS_COLLECTION, PMU_CATEGORY } from '../constants/cosmetics';
import { WEB_CONTENT } from '../constants/content';
import ComparisonSlider from './ComparisonSlider';
import EditorialGallery from './EditorialGallery';
import ReservationApp from './ReservationApp';
import { TaglineWithHeart } from './FooterTagline';
import DeveloperSignature from './DeveloperSignature';
import ServiceSchema from './ServiceSchema';
import BreadcrumbSchema from './BreadcrumbSchema';
import useSEO from '../hooks/useSEO';
import { SEO } from '../constants/seo';

const CATEGORY_PMU = 'PMU';

export default function PMUPage({ services = [], schedule = {}, reservations = [] }) {
  useSEO(SEO.pmu);
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
    const colRefs = getPublicContentCollectionPathsForRead(TRANSFORMATIONS_COLLECTION);
    if (!colRefs.length) return;
    const docsByPathRef = { current: colRefs.map(() => []) };
    const unsubs = colRefs.map((colT, idx) => {
      const qT = query(colT, where('category', '==', PMU_CATEGORY));
      return onSnapshot(qT, (snap) => {
        docsByPathRef.current[idx] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const merged = docsByPathRef.current.flat();
        const seen = new Set();
        const list = merged.filter((item) => {
          const key = [item.imageBeforeUrl, item.imageAfterUrl].filter(Boolean).join('|') || item.id;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setSliders(list);
      });
    });
    return () => unsubs.forEach((u) => u());
  }, []);

  const displaySliders =
    sliders
      .filter((item) => item.imageBeforeUrl?.trim() && item.imageAfterUrl?.trim())
      .map((item) => ({
        beforeImage: item.imageBeforeUrl,
        afterImage: item.imageAfterUrl,
        altText: item.title || 'Před a po',
      }));

  // Scroll to #pmu when landing on this page with hash (e.g. from main nav link)
  useEffect(() => {
    if (window.location.hash === '#pmu') {
      const el = document.getElementById('pmu');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Sync pagination dots with horizontal scroll position (mobile)
  useEffect(() => {
    const el = pmuCarouselRef.current;
    if (!el || displaySliders.length <= 1) return;
    const onScroll = () => {
      const itemWidth = el.offsetWidth * 0.85 + 24; /* 85vw + gap-6 */
      const index = Math.round(el.scrollLeft / itemWidth);
      const clamped = Math.min(Math.max(0, index), displaySliders.length - 1);
      setPmuActiveIndex(clamped);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [displaySliders.length]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div id="pmu" className="min-h-screen bg-[#0F0F0F] text-[#A1A1AA] font-sans antialiased">
      <ServiceSchema
        services={pmuServices}
        catalogName="Permanentní make-up – Skin Studio"
        pagePath="/pmu"
      />
      <BreadcrumbSchema
        items={[
          { name: 'Domů', url: '/' },
          { name: 'Permanentní make-up', url: '/pmu' },
        ]}
      />
      {/* Dark theme header – jako na main/produkci */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F0F]/80 backdrop-blur-md border-b border-white/5"
        aria-label="Navigace"
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <Link
            to="/"
            className="font-display font-bold text-xl tracking-wide text-white hover:text-[#C48F83] transition-colors shrink-0"
            aria-label="Skin Studio – Kosmetika"
          >
            Skin Studio
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83] transition-colors"
            >
              Kosmetika
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
              Kosmetika
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
              <h3 className="text-xl font-display text-white mb-4">Jemnost, která zůstává</h3>
              <p className="mt-4 text-[#A1A1AA] leading-relaxed">
                Permanentní make-up vnímám jako neviditelného pomocníka. Jeho úkolem není přebít vaši tvář, ale tiše podtrhnout to, co je na ní krásné.
              </p>
              <p className="mt-4 text-[#A1A1AA]/80 leading-relaxed">
                Pracuji tak, aby výsledek působil vzdušně a přirozeně. Cílem je, abyste se ráno probudila s pocitem, že jste upravená, ale stále jste to vy.
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
            {displaySliders.length > 0 ? (
              <>
                <div
                  ref={pmuCarouselRef}
                  className="transformations-scroll flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory px-4 -mx-4 md:mx-0 md:px-0 min-h-[320px]"
                >
                  <div id="carousel-track" className="flex gap-6 flex-shrink-0">
                    {displaySliders.map((item, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 w-[85vw] md:w-[400px] snap-center flex flex-col space-y-4"
                      >
                        <ComparisonSlider
                          beforeImage={item.beforeImage}
                          afterImage={item.afterImage}
                          altText={item.altText}
                          theme="dark"
                        />
                        <div className="mobile-carousel-swipe-zone md:hidden pb-2 flex-shrink-0" aria-hidden />
                      </div>
                    ))}
                  </div>
                </div>
                {displaySliders.length >= 1 && (
                  <div className="carousel-dots md:hidden" role="tablist" aria-label="PMU proměny">
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
                          const itemWidth = el.offsetWidth * 0.85 + 24; /* 85vw + gap-6 */
                          el.scrollTo({ left: i * itemWidth, behavior: 'smooth' });
                        }}
                        className={`dot ${pmuActiveIndex === i ? 'dot-active' : ''}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-[#A1A1AA]/60 text-sm py-12">
                Před/po proměny budou zobrazeny po přidání v administraci (Fotografie → Proměny, kategorie PMU).
              </p>
            )}
          </div>
        </section>

        {/* Editorial Lookbook – galerie PMU */}
        <EditorialGallery category={PMU_CATEGORY} theme="dark" />

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
                        <span>{service.name}</span>
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
              schedulePmu={schedule}
              reservations={reservations}
              widgetOnly
              mode="dark"
            />
          </div>
        </section>
      </main>

      {/* Footer – stejná struktura jako kosmetika (Layout), dark theme */}
      <footer id="kontakt" className="mt-auto border-t border-white/5 bg-[#0F0F0F] font-sans font-light text-gray-200">
        <div className="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-white uppercase tracking-wide font-semibold text-sm mb-2">
              {WEB_CONTENT.footer.brandHeading}
            </h3>
            <p className="font-medium mb-2 text-[#A1A1AA]">{WEB_CONTENT.footer.ownerName}</p>
            <p className="text-sm leading-relaxed text-[#A1A1AA]/90">
              <TaglineWithHeart tagline={WEB_CONTENT.footer.tagline} heartWord={WEB_CONTENT.footer.heartReplacementWord} />
            </p>
          </div>
          <div className="md:text-right md:flex md:flex-col md:items-end">
            <h3 className="text-white uppercase tracking-wide font-semibold text-sm mb-4">
              {WEB_CONTENT.footer.contactHeading}
            </h3>
            <address className="not-italic space-y-2 text-sm text-[#A1A1AA]">
              <p className="flex items-center gap-2 md:justify-end">
                <MapPin size={16} className="shrink-0 text-[#C48F83]" aria-hidden />
                {WEB_CONTENT.footer.location}
              </p>
              <p className="flex items-center gap-2 md:justify-end">
                <Mail size={16} className="shrink-0 text-[#C48F83]" aria-hidden />
                <a href={`mailto:${WEB_CONTENT.footer.email}`} className="hover:text-[#C48F83] transition-colors">
                  {WEB_CONTENT.footer.email}
                </a>
              </p>
              <p className="flex items-center gap-2 md:justify-end">
                <Phone size={16} className="shrink-0 text-[#C48F83]" aria-hidden />
                <a href={`tel:${WEB_CONTENT.footer.phone.replace(/\s/g, '')}`} className="hover:text-[#C48F83] transition-colors">
                  {WEB_CONTENT.footer.phone}
                </a>
              </p>
              <p className="flex items-center gap-2 md:justify-end">
                IČO {WEB_CONTENT.footer.ico}
              </p>
              <p className="flex items-center gap-2 md:justify-end text-xs text-[#A1A1AA]/70">
                {WEB_CONTENT.footer.tradeRegisterText}
              </p>
            </address>
          </div>
        </div>
        <div className="border-t border-white/5">
          <div className="container mx-auto px-6 py-4 flex flex-row flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p className="text-xs text-[#A1A1AA]/60">
                {WEB_CONTENT.footer.copyright}
              </p>
              <Link
                to="/zpracovani-osobnich-udaju"
                className="text-xs text-[#A1A1AA]/60 hover:text-[#C48F83] transition-colors"
              >
                {WEB_CONTENT.footer.privacyLinkLabel}
              </Link>
            </div>
            <DeveloperSignature theme="dark" />
          </div>
        </div>
      </footer>
    </div>
  );
}

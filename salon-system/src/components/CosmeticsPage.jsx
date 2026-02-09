import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Phone, Mail, Instagram, ChevronDown, ChevronUp } from 'lucide-react';
import { query, where, onSnapshot } from 'firebase/firestore';
import { getCollectionPath } from '../firebaseConfig';
import { GALLERY_COLLECTION, TRANSFORMATIONS_COLLECTION, COSMETICS_CATEGORY } from '../constants/cosmetics';
import { INSTAGRAM_URL } from '../firebaseConfig';
import ComparisonSlider from './ComparisonSlider';
import LazySection from './LazySection';

const COSMETICS_BG = '#fdfbf7';

/** Remove parenthetical meta-commentary from description text. */
function cleanDescription(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function CosmeticsPage({ services = [] }) {
  const [transformations, setTransformations] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const promenyCarouselRef = useRef(null);
  const [promenyActiveIndex, setPromenyActiveIndex] = useState(0);

  useEffect(() => {
    const hash = window.location.hash?.slice(1);
    if (hash) {
      const el = document.getElementById(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, []);

  useEffect(() => {
    const colT = getCollectionPath(TRANSFORMATIONS_COLLECTION);
    const qT = query(colT, where('category', '==', COSMETICS_CATEGORY));
    const unsubT = onSnapshot(qT, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setTransformations(list);
    });
    return () => unsubT();
  }, []);

  useEffect(() => {
    const colG = getCollectionPath(GALLERY_COLLECTION);
    const qG = query(colG, where('category', '==', COSMETICS_CATEGORY));
    const unsubG = onSnapshot(qG, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setGallery(list);
    });
    return () => unsubG();
  }, []);

  // Sync pagination dot with carousel scroll position (mobile)
  useEffect(() => {
    const el = promenyCarouselRef.current;
    if (!el || transformations.length <= 1) return;
    const onScroll = () => {
      const itemWidth = el.offsetWidth * 0.85 + 16;
      const index = Math.round(el.scrollLeft / itemWidth);
      const clamped = Math.min(Math.max(0, index), transformations.length - 1);
      setPromenyActiveIndex(clamped);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [transformations.length]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COSMETICS_BG }}>
      {/* 1. Hero – Subtitle → Claim → Handwritten → CTA */}
      <section className="pt-14 sm:pt-20 pb-12 sm:pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs sm:text-sm font-sans uppercase tracking-[0.2em] text-stone-600 mb-3">
            SKIN STUDIO LUCIE METELKOVÉ
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-wide text-[var(--skin-charcoal)]">
            Vaše pleť, vaše sebevědomí.
          </h1>
          <div className="flex flex-col items-center mt-4">
            <p className="font-signature text-2xl sm:text-3xl text-stone-600 -rotate-2 mb-8">
              S láskou k detailu, Lucie
            </p>
            <Link
              to="/rezervace"
              className="skin-accent inline-flex items-center justify-center px-8 py-4 font-bold uppercase text-[10px] tracking-[0.05em] shadow-sm"
            >
              Objednat termín
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Philosophy / About ("O studiu") – organic text on beige + portrait */}
      <section
        id="o-nas"
        className="scroll-mt-20 py-28 px-4 sm:px-6"
        style={{ backgroundColor: 'var(--skin-cream-dark)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
            {/* Left: text directly on beige, no card */}
            <div className="order-2 md:order-1">
              <h2 className="font-display text-2xl font-bold mb-6 text-stone-800 md:mb-8">
                Filozofie
              </h2>
              <div className="body-text text-left text-stone-700 space-y-6 leading-relaxed">
                <p>
                  Jmenuji se Lucie Metelková a kosmetika je pro mě víc než jen práce – je to spojení odbornosti, relaxace a preciznosti. Kladu absolutní důraz na čistotu, špičkové postupy a bezpečí vaší pleti.
                </p>
                <p>
                  V mém studiu v <strong className="font-semibold text-stone-800">Uherském Brodě</strong> nenajdete „pásovou výrobu“. Každá pleť je jedinečná, a proto je i každé mé ošetření 100% individuální. Ať už řešíme akné, vrásky, nebo jen toužíte po dokonalém obočí díky laminaci, mým cílem je, abyste odcházela nejen krásnější, ale i dokonale odpočatá.
                </p>
                <p>
                  Zastavte se a dopřejte si svůj „Me Time“ okamžik v prostředí, kde se čas točí jen kolem vás.
                </p>
              </div>
              <div className="flex justify-end mt-8">
                <p
                  className="font-signature text-4xl text-stone-800 -rotate-3 inline-block"
                  aria-label="Lucie Metelková"
                >
                  Lucie
                </p>
              </div>
            </div>
            {/* Right: larger portrait on desktop, rounded + shadow on image only */}
            <div className="order-1 md:order-2 flex justify-center md:justify-end w-full">
              <img
                src="/lucie-portrait.jpg"
                alt="Lucie Metelková – Skin Studio"
                className="w-full max-w-sm md:max-w-md aspect-[3/4] md:aspect-[2/3] object-cover rounded-2xl shadow-2xl"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Transformations ("Proměny") – directly after Philosophy */}
      <section
        id="promeny"
        className="scroll-mt-20 py-24 px-4"
        style={{ backgroundColor: COSMETICS_BG }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-stone-700 text-center mb-12">
            Proměny
          </h2>
          {transformations.length > 0 ? (
            <>
              <LazySection rootMargin="240px">
                <div
                  ref={promenyCarouselRef}
                  className="mobile-carousel carousel-track md:grid md:grid-cols-1 lg:grid-cols-2 md:overflow-visible gap-4 md:gap-10 md:gap-y-12 px-4 pb-2 md:pb-0 -mx-4 md:mx-0"
                >
                  {transformations.map((item) => (
                    <div
                      key={item.id}
                      className="mobile-carousel-item md:min-w-0 md:shrink-0 md:flex-none md:w-auto space-y-3"
                    >
                      <ComparisonSlider
                        beforeImage={item.imageBeforeUrl}
                        afterImage={item.imageAfterUrl}
                        altText={item.title || 'Před a po'}
                        theme="light"
                      />
                      <h3 className="font-display font-semibold text-lg text-stone-700">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-stone-600 text-sm leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {transformations.length >= 1 && (
                  <div className="carousel-dots" role="tablist" aria-label="Proměny">
                    {transformations.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-label={`Proměna ${i + 1}`}
                        aria-selected={promenyActiveIndex === i}
                        onClick={() => {
                          const el = promenyCarouselRef.current;
                          if (!el) return;
                          const itemWidth = el.offsetWidth * 0.85 + 16;
                          el.scrollTo({ left: i * itemWidth, behavior: 'smooth' });
                        }}
                        className={`dot ${promenyActiveIndex === i ? 'dot-active' : ''}`}
                      />
                    ))}
                  </div>
                )}
              </LazySection>
            </>
          ) : (
            <p className="text-center text-stone-500 text-sm py-12">
              Proměny před/po budou zobrazeny, jakmile je v administraci přidáte (Fotografie → Proměny).
            </p>
          )}
        </div>
      </section>

      {/* 4. Services & Pricing ("Ceník" – accordion) */}
      <section
        id="procedury"
        className="scroll-mt-20 py-24 px-4 border-t border-stone-200/80"
        style={{ backgroundColor: '#fcfbf7' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-2 text-center text-stone-800">
            Ceník
          </h2>
          <p className="text-sm text-center mb-12 text-gray-500">
            Vyberte si ošetření a rezervujte termín on-line.
          </p>
          {services.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-500">Načítání procedur a ceníku…</div>
          ) : (
            <ul className="space-y-0">
              {services.map((s) => {
                const hasDescription = !!(s.description && cleanDescription(s.description));
                const isExpanded = expandedServiceId === s.id;
                return (
                  <li
                    key={s.id}
                    className="border-b last:border-b-0"
                    style={{ borderColor: '#E5E5E5' }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedServiceId((id) => (id === s.id ? null : s.id))}
                      className="w-full flex justify-between items-center text-left transition-colors hover:bg-stone-50/80 active:bg-stone-100/80 py-[20px]"
                    >
                      <span className="font-display text-lg sm:text-xl text-stone-800 font-semibold min-w-0 pr-4">
                        {s.name}
                      </span>
                      <div className="flex items-center shrink-0">
                        <span className="font-normal text-stone-700 tabular-nums text-right">
                          {s.price != null ? `${s.price} Kč` : '—'}
                        </span>
                        {hasDescription && (
                          <span className="ml-4 flex items-center justify-center text-stone-400 shrink-0">
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
                              <p className="text-gray-600 leading-relaxed max-w-[65ch] whitespace-pre-wrap">
                                {cleanDescription(s.description)}
                              </p>
                              <Link
                                to={`/rezervace?service=${encodeURIComponent(s.id)}`}
                                className="skin-accent mt-6 inline-flex items-center justify-center gap-2 font-medium text-sm px-6 py-3 uppercase tracking-[0.05em] focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2"
                              >
                                <Calendar size={16} /> Rezervovat termín
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="text-center mt-12">
            <Link
              to="/rezervace"
              className="skin-accent inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-[0.05em] rounded-full"
            >
              <Calendar size={14} /> Rezervovat
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Gallery ("Moje práce" – masonry) */}
      <section
        id="moje-prace"
        className="scroll-mt-20 py-24 px-4 border-t border-stone-200/80"
        style={{ backgroundColor: COSMETICS_BG }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-stone-700 text-center mb-12">
            Moje práce
          </h2>
          {gallery.length > 0 ? (
            <LazySection rootMargin="240px">
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gridAutoRows: 'auto',
                }}
              >
                {gallery.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl overflow-hidden bg-white border border-stone-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/5] min-h-[280px] bg-stone-100">
                    <img
                      src={item.imageUrl}
                      alt={item.caption || 'Galerie'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  {item.caption && (
                    <p className="p-3 text-sm text-stone-600 text-center">
                      {item.caption}
                    </p>
                  )}
                </div>
              ))}
              </div>
            </LazySection>
          ) : (
            <p className="text-center text-stone-500 text-sm py-12">
              Galerie fotek se zobrazí po přidání v administraci (Fotografie → Galerie).
            </p>
          )}
        </div>
      </section>

      {/* 6. Booking CTA */}
      <section className="py-24 px-4 text-center" style={{ backgroundColor: COSMETICS_BG }}>
        <div className="max-w-xl mx-auto">
          <p className="text-stone-600 mb-6">
            Chcete podobný výsledek? Domluvte si konzultaci.
          </p>
          <Link
            to="/rezervace"
            className="skin-accent inline-flex items-center justify-center px-8 py-4 font-bold uppercase text-[10px] tracking-[0.05em] shadow-sm"
          >
            Rezervovat termín
          </Link>
        </div>
      </section>

      {/* 7. Footer – address, phone, Instagram link, copyright (#kontakt for nav) */}
      <footer
        id="kontakt"
        className="scroll-mt-20 py-24 px-4 border-t border-stone-200/80"
        style={{ backgroundColor: '#F9F7F2' }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-8 sm:gap-12 text-center sm:text-left">
            <a
              href="tel:+420724875558"
              className="flex items-center gap-2 font-normal text-[var(--skin-charcoal)] hover:text-[var(--skin-gold-dark)] transition-colors"
            >
              <Phone size={18} className="shrink-0 text-[var(--skin-gold-dark)]" aria-hidden />
              +420 724 875 558
            </a>
            <a
              href="mailto:info@skinstudio.cz"
              className="flex items-center gap-2 font-normal text-[var(--skin-charcoal)] hover:text-[var(--skin-gold-dark)] transition-colors"
            >
              <Mail size={18} className="shrink-0 text-[var(--skin-gold-dark)]" aria-hidden />
              info@skinstudio.cz
            </a>
            <span className="flex items-center gap-2 text-[var(--skin-charcoal)]">
              <MapPin size={18} className="shrink-0 text-[var(--skin-gold-dark)]" aria-hidden />
              Uherský Brod
            </span>
            {INSTAGRAM_URL && (
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-normal text-[var(--skin-charcoal)] hover:text-[var(--skin-gold-dark)] transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} className="shrink-0 text-[var(--skin-gold-dark)]" aria-hidden />
                Instagram
              </a>
            )}
          </div>
          <p className="text-center text-sm text-stone-400 mt-12 pt-8 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            © 2026 Skin Studio Lucie Metelková
          </p>
        </div>
      </footer>
    </div>
  );
}

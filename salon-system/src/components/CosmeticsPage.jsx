import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { query, where, onSnapshot } from 'firebase/firestore';
import { getCollectionPath } from '../firebaseConfig';
import { TRANSFORMATIONS_COLLECTION, COSMETICS_CATEGORY } from '../constants/cosmetics';
import { WEB_CONTENT } from '../constants/content';
import { filterCosmeticsServices } from '../utils/helpers';
import ComparisonSlider from './ComparisonSlider';
import LazySection from './LazySection';
import ServiceListAccordion from './ServiceListAccordion';
import SocialProofSection from './SocialProofSection';
import { GOOGLE_REVIEW_URL } from '../firebaseConfig';

const COSMETICS_BG = '#F9F8F6';

export default function CosmeticsPage({ services = [] }) {
  const cosmeticServices = filterCosmeticsServices(services);
  const [transformations, setTransformations] = useState([]);
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

  // Sync pagination dot with carousel scroll position (mobile)
  useEffect(() => {
    const el = promenyCarouselRef.current;
    if (!el || transformations.length <= 1) return;
    const onScroll = () => {
      const itemWidth = el.offsetWidth * 0.85 + 24; /* 85vw + gap-6 */
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
      {/* 1. Hero – mobile: text first, compact image strip; desktop: split, viewport height */}
      <section className="grid grid-cols-1 md:grid-cols-2 grid-rows-[auto_400px] md:grid-rows-none md:h-screen md:max-h-[1080px] w-full overflow-hidden min-h-0">
        <div className="flex flex-col justify-center items-start px-8 md:px-24 h-full min-h-0 bg-[#F9F8F6] order-1 md:order-1 py-8 md:py-0">
          <p className="text-xs sm:text-sm font-sans uppercase tracking-[0.2em] text-stone-600 mb-3">
            {WEB_CONTENT.hero.subtitle}
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl leading-tight tracking-wide text-[var(--skin-charcoal)]">
            {WEB_CONTENT.hero.title}
          </h1>
          <p className="mt-4 font-signature text-2xl sm:text-3xl text-stone-600 -rotate-2">
            {WEB_CONTENT.hero.signature}
          </p>
          <p className="mt-6 text-gray-600 max-w-prose" style={{ lineHeight: 1.6 }}>
            {WEB_CONTENT.hero.body}
          </p>
          <Link
            to="/rezervace"
            className="mt-8 inline-flex items-center justify-center bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 w-fit shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)]"
          >
            {WEB_CONTENT.hero.cta}
          </Link>
        </div>
        <div className="relative w-full h-[400px] md:h-full order-2 md:order-2 min-h-0">
          <img
            src="/lucie-portrait.jpg"
            alt={`${WEB_CONTENT.footer.ownerName} – ${WEB_CONTENT.header.brandName}`}
            className="w-full h-full object-cover object-[50%_50%]"
            loading="eager"
            decoding="async"
          />
        </div>
      </section>

      {/* 2. Filozofie – text-only, centered, no duplicate portrait */}
      <section
        id="o-nas"
        className="scroll-mt-20 py-24 px-4 sm:px-6"
        style={{ backgroundColor: 'var(--skin-cream-dark)' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-6 text-stone-800 md:mb-8">
            {WEB_CONTENT.filozofie.heading}
          </h2>
          <div className="body-text text-stone-700 space-y-6 leading-relaxed">
            <p>{WEB_CONTENT.filozofie.paragraphs[0]}</p>
            <p>
              {WEB_CONTENT.filozofie.paragraphs[1].split(WEB_CONTENT.filozofie.paragraph2Bold)[0]}
              <strong className="font-semibold text-stone-800">{WEB_CONTENT.filozofie.paragraph2Bold}</strong>
              {WEB_CONTENT.filozofie.paragraphs[1].split(WEB_CONTENT.filozofie.paragraph2Bold)[1]}
            </p>
            <p>{WEB_CONTENT.filozofie.paragraphs[2]}</p>
          </div>
          <p
            className="font-signature text-4xl text-stone-800 -rotate-3 inline-block mt-8"
            aria-label={WEB_CONTENT.footer.ownerName}
          >
            {WEB_CONTENT.filozofie.signatureName}
          </p>
        </div>
      </section>

      {/* PMU strip – pure typography (after Filozofie, before Proměny) */}
      <section
        className="py-16 bg-[#faf9f6] border-y border-stone-100 text-center"
        aria-labelledby="pmu-teaser-heading"
      >
        <div className="max-w-4xl mx-auto px-6">
          <h3 id="pmu-teaser-heading" className="text-3xl md:text-4xl font-serif text-stone-900 mb-4">
            {WEB_CONTENT.pmu.headline}{' '}
            <span className="italic font-serif text-stone-400">{WEB_CONTENT.pmu.headlineItalic}</span>
          </h3>
          <p className="text-stone-600 max-w-2xl mx-auto mb-8 font-light">
            {WEB_CONTENT.pmu.body}
          </p>
          <Link
            to="/pmu#pmu"
            className="inline-block px-8 py-4 border border-stone-800 text-xs uppercase tracking-[0.2em] text-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 mt-8"
          >
            {WEB_CONTENT.pmu.cta}
          </Link>
        </div>
      </section>

      {/* 3. Transformations ("Proměny") */}
      <section
        id="promeny"
        className="scroll-mt-20 py-24 px-4"
        style={{ backgroundColor: COSMETICS_BG }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-stone-700 text-center mb-12">
            {WEB_CONTENT.promeny.heading}
          </h2>
          {transformations.length > 0 ? (
            <>
              <LazySection rootMargin="240px">
                <div
                  ref={promenyCarouselRef}
                  className="transformations-scroll flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory px-4 -mx-4 md:mx-0 md:px-0 min-h-[320px]"
                >
                  <div id="carousel-track" className="flex gap-6 flex-shrink-0">
                    {transformations.map((item) => (
                      <div
                        key={item.id}
                        className="w-[85vw] md:w-[400px] flex-shrink-0 snap-center flex flex-col"
                      >
                      <div className="order-2 md:order-1 space-y-2">
                        <h3 className="font-display font-semibold text-lg text-stone-800">
                          {item.title || WEB_CONTENT.promeny.defaultTitle}
                        </h3>
                        {item.description && (
                          <p className="text-gray-800 text-sm leading-relaxed max-w-prose">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="order-1 md:order-2">
                        <ComparisonSlider
                          beforeImage={item.imageBeforeUrl}
                          afterImage={item.imageAfterUrl}
                          altText={item.title || WEB_CONTENT.promeny.defaultTitle}
                          theme="light"
                        />
                      </div>
                      <div className="order-3 mobile-carousel-swipe-zone md:hidden pb-2" aria-hidden />
                      </div>
                    ))}
                  </div>
                </div>
                {transformations.length >= 1 && (
                  <div className="carousel-dots md:hidden" role="tablist" aria-label={WEB_CONTENT.promeny.carouselAriaLabel}>
                    {transformations.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-label={`${WEB_CONTENT.promeny.transformationAriaLabel} ${i + 1}`}
                        aria-selected={promenyActiveIndex === i}
                        onClick={() => {
                          const el = promenyCarouselRef.current;
                          if (!el) return;
                          const itemWidth = el.offsetWidth * 0.85 + 24; /* 85vw + gap-6 */
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
              {WEB_CONTENT.promeny.emptyState}
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
            {WEB_CONTENT.cenik.heading}
          </h2>
          <p className="text-sm text-center mb-12 text-gray-500">
            {WEB_CONTENT.cenik.subtext}
          </p>
          <ServiceListAccordion
            services={cosmeticServices}
            variant="light"
            loadingText={WEB_CONTENT.cenik.loading}
            ctaReservovat={WEB_CONTENT.cenik.ctaReservovat}
            ctaReservovatShort={WEB_CONTENT.cenik.ctaRezervovatShort}
            getReserveHref={(s) => `/rezervace?service=${encodeURIComponent(s.id)}`}
            footerHref="/rezervace"
          />
        </div>
      </section>

      {/* 5. Recenze a Google – Social Proof */}
      <section id="recenze" className="scroll-mt-20">
        <SocialProofSection qrImageSrc="/Skinstudio_ggl_qr.png" googleReviewUrl={GOOGLE_REVIEW_URL} />
      </section>

    </div>
  );
}

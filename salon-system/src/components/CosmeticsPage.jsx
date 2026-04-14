import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { query, where, onSnapshot } from 'firebase/firestore';
import { getCollectionPath, isFirebaseRuntimeConfigured } from '../firebaseConfig';
import { TRANSFORMATIONS_COLLECTION, COSMETICS_CATEGORY } from '../constants/cosmetics';
import { WEB_CONTENT } from '../constants/content';
import { filterCosmeticsServices } from '../utils/helpers';
import ComparisonSlider from './ComparisonSlider';
import EditorialGallery from './EditorialGallery';
import LazySection from './LazySection';
import ServiceListAccordion from './ServiceListAccordion';
import SocialProofSection from './SocialProofSection';
import PMUSpotlightSection from './PMUSpotlightSection';
import { GOOGLE_REVIEW_URL } from '../firebaseConfig';
import useSEO from '../hooks/useSEO';
import { SEO } from '../constants/seo';
import ServiceSchema from './ServiceSchema';
import BreadcrumbSchema from './BreadcrumbSchema';

const COSMETICS_BG = '#F9F8F6';

export default function CosmeticsPage({ services = [] }) {
  const { pathname } = useLocation();
  const seo = pathname === '/kosmetika' ? SEO.kosmetika : SEO.home;
  useSEO(seo);
  const cosmeticServices = filterCosmeticsServices(services);
  const [transformations, setTransformations] = useState([]);
  const promenyCarouselRef = useRef(null);
  const [promenyActiveIndex, setPromenyActiveIndex] = useState(0);

  const transformationsWithImages = useMemo(
    () =>
      transformations.filter(
        (item) => item.imageBeforeUrl?.trim() && item.imageAfterUrl?.trim()
      ),
    [transformations]
  );

  useEffect(() => {
    const hash = window.location.hash?.slice(1);
    if (hash) {
      const el = document.getElementById(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseRuntimeConfigured) return;
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
    if (!el || transformationsWithImages.length <= 1) return;
    const onScroll = () => {
      const itemWidth = el.offsetWidth * 0.85 + 24; /* 85vw + gap-6 */
      const index = Math.round(el.scrollLeft / itemWidth);
      const clamped = Math.min(Math.max(0, index), transformationsWithImages.length - 1);
      setPromenyActiveIndex(clamped);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [transformationsWithImages.length]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COSMETICS_BG }}>
      {pathname === '/kosmetika' && (
        <BreadcrumbSchema
          items={[
            { name: 'Domů', url: '/' },
            { name: 'Kosmetika', url: '/kosmetika' },
          ]}
        />
      )}
      {/* 1. Hero – mobile: text first, compact image strip; desktop: split, viewport height */}
      <section className="grid grid-cols-1 md:grid-cols-2 grid-rows-[auto_400px] md:grid-rows-none md:h-screen md:max-h-[1080px] w-full max-w-[1920px] mx-auto overflow-hidden min-h-0">
        <div className="flex flex-col justify-center items-start px-8 md:px-24 h-full min-h-0 bg-[#F9F8F6] order-1 md:order-1 py-8 md:py-0 max-w-xl md:max-w-2xl md:mx-auto">
          <p className="text-xs sm:text-sm font-sans uppercase tracking-[0.2em] text-stone-600 mb-3">
            {WEB_CONTENT.hero.subtitle}
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl leading-tight tracking-wide text-[var(--skin-charcoal)] break-words">
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
            alt={WEB_CONTENT.imageAlts.portrait}
            className="w-full h-full object-cover object-[50%_48%]"
            loading="eager"
            decoding="async"
            fetchPriority="high"
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

      {/* PMU Spotlight – two-column, image + text, fade-in-up */}
      <PMUSpotlightSection />

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
          {transformationsWithImages.length > 0 ? (
            <>
              <LazySection rootMargin="240px">
                <div
                  ref={promenyCarouselRef}
                  className="transformations-scroll flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory px-4 -mx-4 md:mx-0 md:px-0 min-h-[320px]"
                >
                  <div id="carousel-track" className="flex gap-6 flex-shrink-0">
                    {transformationsWithImages.map((item) => (
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
                {transformationsWithImages.length >= 1 && (
                  <div className="carousel-dots md:hidden" role="tablist" aria-label={WEB_CONTENT.promeny.carouselAriaLabel}>
                    {transformationsWithImages.map((_, i) => (
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

      {/* 3b. Editorial Lookbook – galerie */}
      <EditorialGallery category={COSMETICS_CATEGORY} theme="light" />

      {/* 4. Services & Pricing ("Ceník" – accordion) */}
      <section
        id="cenik"
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

      <ServiceSchema
        services={cosmeticServices}
        catalogName="Kosmetické služby – Skin Studio"
        pagePath={pathname === '/kosmetika' ? '/kosmetika' : '/'}
      />
    </div>
  );
}

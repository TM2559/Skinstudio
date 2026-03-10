import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Heart, MapPin, Phone, Mail, Instagram, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import InstagramSection from './InstagramSection';
import SocialProofSection from './SocialProofSection';
import { INSTAGRAM_URL, GOOGLE_REVIEW_URL } from '../firebaseConfig';
import ServiceDescriptionMarkdown from './ServiceDescriptionMarkdown';
import { WEB_CONTENT } from '../constants/content';

function cleanDescription(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function LandingPage({ services = [] }) {
  const [expandedServiceId, setExpandedServiceId] = useState(null);

  useEffect(() => {
    const hash = window.location.hash?.slice(1);
    if (hash) {
      const el = document.getElementById(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, []);

  return (
    <>
      {/* Hero – Subtitle → Claim → Handwritten → CTA */}
      <section
        className="relative border-b overflow-hidden"
        style={{ backgroundColor: 'var(--skin-cream)', borderColor: 'var(--skin-beige-muted)' }}
      >
        <div className="max-w-4xl mx-auto px-4 pt-14 sm:pt-20 pb-14 sm:pb-20 text-center">
          <p className="text-xs sm:text-sm font-sans uppercase tracking-[0.2em] text-stone-600 mb-3">
            {WEB_CONTENT.hero.subtitle}
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl tracking-wide text-[var(--skin-charcoal)]">
            {WEB_CONTENT.hero.seoTitle}
          </h1>
          <div className="flex flex-col items-center mt-4">
            <p className="font-signature text-2xl sm:text-3xl text-stone-600 -rotate-2 mb-8" aria-hidden>
              {WEB_CONTENT.hero.signature}
            </p>
          </div>
          <p className="body-text text-sm sm:text-base max-w-xl mx-auto mt-4 mb-8 text-[#3d3730]">
            Odborná péče o pleť s <strong className="font-semibold">individuálním přístupem</strong> v <strong className="font-semibold">Uherském Brodě</strong>. Svěřte svou pleť do
            rukou profesionálky v příjemném a klidném prostředí.
          </p>
          <Link
            to="/rezervace"
            className="inline-flex items-center justify-center bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)]"
          >
            Objednat termín
          </Link>
        </div>
      </section>

      {/* O studiu / O Lucii */}
      <section
        id="o-nas"
        className="scroll-mt-20 py-20 sm:py-24"
        style={{ backgroundColor: 'var(--skin-cream-dark)' }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-display text-2xl font-bold mb-10 text-center text-[var(--skin-charcoal)]">
            {WEB_CONTENT.landing.sectionAbout}
          </h2>
          <div
            className="rounded-2xl p-8 sm:p-10 shadow-sm"
            style={{ backgroundColor: 'var(--skin-white)', border: '1px solid var(--skin-beige-muted)' }}
          >
            <div className="body-text text-left mb-8 text-[#2f2f2f] space-y-6" style={{ lineHeight: 1.7 }}>
              <p>
                Jmenuji se Lucie Metelková a kosmetika je pro mě víc než jen práce – je to spojení odbornosti, relaxace a preciznosti. Kladu absolutní důraz na čistotu, špičkové postupy a zdraví vaší pleti.
              </p>
              <p>
                V mém studiu v <strong className="font-semibold">Uherském Brodě</strong> nenajdete „pásovou výrobu“. Každá pleť je jedinečná, a proto je i každé mé ošetření 100% individuální. Ať už řešíme akné, vrásky, nebo jen toužíte po dokonalém obočí díky laminaci, mým cílem je, abyste odcházela nejen krásnější, ale i dokonale odpočatá.
              </p>
              <p>
                Zastavte se a dopřejte si svůj „Me Time“ okamžik v prostředí, kde se čas točí jen kolem vás.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 sm:gap-8 justify-start items-center border-t pt-8" style={{ borderColor: '#E5E5E5' }}>
              {[
                'Individuální přístup',
                'Kvalitní kosmetika',
                'Příjemné prostředí',
                'Odborná péče',
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 text-sm text-[#3d3730]"
                >
                  <Heart size={14} className="opacity-70 shrink-0" style={{ color: 'var(--skin-gold)' }} /> {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Procedury a ceník – Service Menu */}
      <section
        id="procedury"
        className="scroll-mt-20 py-20 sm:py-24 border-t border-stone-200"
        style={{ backgroundColor: '#fcfbf7' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-2 text-center text-stone-800">
            {WEB_CONTENT.landing.sectionServices}
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
                          {s.price != null ? (s.isStartingPrice ? `od ${s.price} Kč` : `${s.price} Kč`) : '—'}
                        </span>
                        {hasDescription && (
                          <span className="ml-4 flex items-center justify-center text-stone-400 shrink-0">
                            {isExpanded ? (
                              <ChevronUp size={20} aria-hidden />
                            ) : (
                              <ChevronDown size={20} aria-hidden />
                            )}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Expandable description with smooth transition */}
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
                              <ServiceDescriptionMarkdown text={s.description} />
                              <Link
                                to={`/rezervace?service=${encodeURIComponent(s.id)}`}
                                className="mt-6 inline-flex items-center justify-center gap-2 bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)] focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2"
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
          <div className="text-center mt-[48px]">
            <Link
              to="/rezervace"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)]"
            >
              <Calendar size={14} /> Rezervovat
            </Link>
          </div>
        </div>
      </section>

      {/* Recenze a Google – Social Proof */}
      <section id="recenze" className="scroll-mt-20">
        <SocialProofSection
          qrImageSrc="/Skinstudio_ggl_qr.png"
          googleReviewUrl={GOOGLE_REVIEW_URL}
          sectionTitle={WEB_CONTENT.landing.sectionReviews}
        />
      </section>

      {/* Footer – Kontakt + Sociální sítě */}
      <footer
        id="kontakt"
        className="scroll-mt-20 py-20 sm:py-24"
        style={{ backgroundColor: '#F9F7F2' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            {/* Left: Contact */}
            <div className="text-left">
              <h2 className="font-display text-2xl font-bold mb-6 text-[var(--skin-charcoal)]">
                {WEB_CONTENT.landing.sectionContact}
              </h2>
              <p className="text-sm text-[#6b6560] mb-6">Domluvte si termín návštěvy. Těším se na vás.</p>
              <ul className="space-y-4">
                <li>
                  <a
                    href="tel:+420724875558"
                    className="flex items-center gap-4 font-normal text-[var(--skin-charcoal)] hover:text-[var(--skin-gold-dark)] transition-colors"
                  >
                    <Phone size={20} className="shrink-0 text-[var(--skin-gold-dark)]" aria-hidden />
                    +420 724 875 558
                  </a>
                </li>
                <li className="text-[var(--skin-charcoal)]">IČO {WEB_CONTENT.footer.ico}</li>
                <li className="text-xs text-[#6b6560]">{WEB_CONTENT.footer.tradeRegisterText}</li>
                <li>
                  <a
                    href="mailto:info@skinstudio.cz"
                    className="flex items-center gap-4 font-normal text-[var(--skin-charcoal)] hover:text-[var(--skin-gold-dark)] transition-colors"
                  >
                    <Mail size={20} className="shrink-0 text-[var(--skin-gold-dark)]" aria-hidden />
                    info@skinstudio.cz
                  </a>
                </li>
                <li>
                  <div className="flex items-center gap-4 text-[var(--skin-charcoal)]">
                    <MapPin size={20} className="shrink-0 text-[var(--skin-gold-dark)]" aria-hidden />
                    <span className="text-sm">Uherský Brod</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Right: Socials & CTA */}
            <div className="text-left">
              <h2 className="font-display text-2xl font-bold mb-6 text-[var(--skin-charcoal)]">
                {WEB_CONTENT.kontakt.followHeading}
              </h2>
              {INSTAGRAM_URL && (
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-normal text-[var(--skin-charcoal)] hover:text-[var(--skin-gold-dark)] transition-colors mb-6"
                >
                  <Instagram size={20} className="shrink-0 text-[var(--skin-gold-dark)]" aria-hidden />
                  <span>Instagram @{INSTAGRAM_URL.replace(/\/$/, '').split('/').pop()}</span>
                  <ArrowRight size={18} className="shrink-0" />
                </a>
              )}
              <Link
                to="/rezervace"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 mt-2 shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)]"
              >
                <Calendar size={14} /> Objednat termín
              </Link>
            </div>
          </div>

          <InstagramSection embedOnly />

          <p className="text-center text-sm text-stone-400 mt-16 pt-8 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            © 2024 Skin Studio Lucie Metelková
            {' · '}
            <Link to="/zpracovani-osobnich-udaju" className="hover:text-stone-600 transition-colors">
              {WEB_CONTENT.footer.privacyLinkLabel}
            </Link>
          </p>
        </div>
      </footer>
    </>
  );
}

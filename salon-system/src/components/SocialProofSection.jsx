import React, { useState } from 'react';
import { Star, ExternalLink, Heart } from 'lucide-react';
import { GOOGLE_REVIEW_URL as CONFIG_REVIEW_URL } from '../firebaseConfig';

const MOCK_REVIEWS = [
  {
    id: 1,
    name: 'Martina K.',
    roleOrDate: 'Klientka, leden 2025',
    rating: 5,
    text: 'Skvělá péče o pleť, profesionální přístup a příjemné prostředí. Lucie mi pomohla s problematickou pletí a výsledek předčil očekávání. Určitě doporučuji.',
  },
  {
    id: 2,
    name: 'Jana V.',
    roleOrDate: 'Pravidelná zákaznice',
    rating: 5,
    text: 'Nejlepší kosmetika v okolí. Individuální přístup, čistota na prvním místě a vždy odcházím odpočatá a spokojená. Děkuji za každé ošetření.',
  },
  {
    id: 3,
    name: 'Petra S.',
    roleOrDate: 'První návštěva, únor 2025',
    rating: 5,
    text: 'Perfektní laminace obočí a milé přijetí. Studio je útulné, Lucie je velmi vstřícná a odborně mi vše vysvětlila. Už mám objednaný další termín.',
  },
  {
    id: 4,
    name: 'Veronika T.',
    roleOrDate: 'Druhá návštěva, březen 2025',
    rating: 5,
    text: 'Cítila jsem se od začátku v dobrých rukou. Péče byla detailní, příjemná a výsledky jsou vidět. Oceňuji, že mi Lucie doporučila i domácí rutinu. Určitě se vrátím.',
  },
];

function ReviewCard({ name, roleOrDate, rating, text }) {
  const [expanded, setExpanded] = useState(false);
  const shouldShowToggle = typeof text === 'string' && text.length > 220;

  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className="w-5 h-5 shrink-0"
            fill={i < rating ? '#EAB308' : 'transparent'}
            stroke={i < rating ? '#EAB308' : '#d1d5db'}
            strokeWidth={1.5}
          />
        ))}
      </div>
      <p className={`text-gray-600 text-sm ${expanded ? '' : 'line-clamp-3'} mb-3 flex-grow`}>
        {text}
      </p>

      {shouldShowToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-sm underline decoration-gray-400 underline-offset-4 text-slate-500 hover:text-black transition-colors self-start"
          aria-expanded={expanded}
        >
          {expanded ? 'Zobrazit méně' : 'Zobrazit více'}
        </button>
      )}

      <div>
        <p className="font-semibold text-gray-900">{name}</p>
        <p className="text-sm text-gray-500">{roleOrDate}</p>
      </div>
    </article>
  );
}

/** Google "G" logo – minimal multicolor SVG for trust/branding */
function GoogleGIcon({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const SKIN_STUDIO_GOOGLE_REVIEW_URL = CONFIG_REVIEW_URL || 'https://g.page/r/CWkt9xHMgMjqEAE/review';

function ActionCard({ qrImageSrc = '/Skinstudio_ggl_qr.png', googleReviewUrl = SKIN_STUDIO_GOOGLE_REVIEW_URL }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 mb-4">
        <GoogleGIcon className="w-6 h-6 shrink-0" />
        <h3 className="font-bold text-gray-900 text-lg">Byla jste s péčí spokojená?</h3>
      </div>
      {/* Desktop only: QR code (clickable) */}
      <div className="hidden md:flex flex-1 flex-col justify-center min-h-0">
        <div className="flex justify-center">
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer w-fit rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Přejít na Google Recenze"
          >
            <div className="bg-white border border-gray-100 rounded-xl p-4 inline-block shadow-sm w-fit hover:border-gray-200 transition-colors">
              <img
                src={qrImageSrc}
                alt="QR kód pro Google Recenze – Skin Studio kosmetika Uherský Brod"
                className="w-40 h-40 object-contain pointer-events-none"
                width={160}
                height={160}
                loading="lazy"
              />
            </div>
          </a>
        </div>
      </div>
      {/* Body + signature: visible on all screen sizes, centered */}
      <div className="flex flex-col items-center text-center md:mt-3">
        <p className="text-sm text-gray-600 mb-2">
          Budu moc ráda za vaše hodnocení. Vaše zpětná vazba mi pomáhá se zlepšovat.
        </p>
        <p className="font-signature text-xl text-gray-700 flex items-center justify-center gap-2 mb-4 md:mb-0" aria-hidden>
          Lucie
          <Heart className="w-4 h-4 shrink-0 stroke-[#E57590] fill-none" strokeWidth={1.5} aria-hidden />
        </p>
        {/* Desktop: text link */}
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-block mt-4 text-sm underline decoration-gray-400 underline-offset-4 text-slate-500 hover:text-black transition-colors"
        >
          Napsat recenzi online
        </a>
      </div>
      {/* Mobile only: full-width CTA button */}
      <div className="md:hidden mt-4">
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-black text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          Napsat recenzi na Google
          <ExternalLink className="w-4 h-4 shrink-0" />
        </a>
      </div>
    </div>
  );
}

export default function SocialProofSection({
  qrImageSrc = '/Skinstudio_ggl_qr.png',
  googleReviewUrl,
  reviews,
  sectionTitle = 'Recenze klientek ze Skin Studia',
}) {
  const reviewUrl = googleReviewUrl && googleReviewUrl.trim() ? googleReviewUrl.trim() : SKIN_STUDIO_GOOGLE_REVIEW_URL;

  const parseReviewsFromEnv = () => {
    const raw = import.meta.env.VITE_GOOGLE_REVIEWS_JSON;
    if (!raw || typeof raw !== 'string') return null;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      // Basic shape validation
      return parsed.filter(
        (r) =>
          r &&
          (typeof r.id === 'string' || typeof r.id === 'number') &&
          typeof r.name === 'string' &&
          typeof r.roleOrDate === 'string' &&
          typeof r.rating === 'number' &&
          typeof r.text === 'string'
      );
    } catch {
      return null;
    }
  };

  const envReviews = parseReviewsFromEnv();
  const resolvedReviews = Array.isArray(reviews) && reviews.length > 0 ? reviews : envReviews && envReviews.length > 0 ? envReviews : MOCK_REVIEWS;
  const ensuredFourReviews = [
    ...resolvedReviews,
    ...MOCK_REVIEWS,
  ]
    .slice(0, 4);

  return (
    <section className="bg-gray-50 py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-gray-900 mb-8 text-center">
          {sectionTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 md:gap-8 items-stretch">
          {/* Left: review cards — stretch to match row height */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-w-0 auto-rows-fr h-full min-h-0">
            {ensuredFourReviews.map((r) => (
              <ReviewCard
                key={r.id}
                name={r.name}
                roleOrDate={r.roleOrDate}
                rating={r.rating}
                text={r.text}
              />
            ))}
          </div>
          {/* Right: action card (fixed width on desktop); equal height, content centered */}
          <div className="w-full md:w-[320px] md:shrink-0 h-full min-h-0 flex">
            <ActionCard qrImageSrc={qrImageSrc} googleReviewUrl={reviewUrl} />
          </div>
        </div>
      </div>
    </section>
  );
}

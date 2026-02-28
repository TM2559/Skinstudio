import { useEffect, useRef } from 'react';

const BASE_URL = 'https://www.skinstudio.cz';

/**
 * Injects a JSON-LD <script> with Schema.org Service/OfferCatalog
 * structured data for each visible service (cosmetics or PMU).
 * Helps Google show rich results for service pages.
 *
 * @param {{ services: Array, catalogName?: string, pagePath?: string }}
 *   catalogName – e.g. "Kosmetické služby – Skin Studio" or "Permanentní make-up – Skin Studio"
 *   pagePath – e.g. "/kosmetika" or "/pmu" (used for service URLs)
 */
export default function ServiceSchema({ services = [], catalogName = 'Kosmetické služby – Skin Studio', pagePath = '/kosmetika' }) {
  const scriptRef = useRef(null);

  useEffect(() => {
    if (services.length === 0) return;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'OfferCatalog',
      name: catalogName,
      url: `${BASE_URL}${pagePath}`,
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.name,
          provider: {
            '@type': 'BeautySalon',
            name: 'Skin Studio | Lucie Metelková',
            url: 'https://www.skinstudio.cz',
          },
          ...(s.description ? { description: s.description.replace(/[*#_`]/g, '').slice(0, 200) } : {}),
        },
        priceCurrency: 'CZK',
        ...(s.price != null && s.price > 0 ? { price: String(s.price) } : {}),
        url: `${BASE_URL}/rezervace?service=${encodeURIComponent(s.id)}`,
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
    };
  }, [services, catalogName, pagePath]);

  return null;
}

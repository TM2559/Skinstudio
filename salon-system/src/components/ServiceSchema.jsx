import { useEffect, useRef } from 'react';

/**
 * Injects a JSON-LD <script> with Schema.org Service/OfferCatalog
 * structured data for each visible cosmetics service.
 * Helps Google show rich results for service pages.
 */
export default function ServiceSchema({ services = [] }) {
  const scriptRef = useRef(null);

  useEffect(() => {
    if (services.length === 0) return;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'OfferCatalog',
      name: 'Kosmetické služby – Skin Studio',
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
        url: `https://www.skinstudio.cz/rezervace?service=${encodeURIComponent(s.id)}`,
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
  }, [services]);

  return null;
}

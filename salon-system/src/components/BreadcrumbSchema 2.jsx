import { useEffect, useRef } from 'react';

const BASE_URL = 'https://www.skinstudio.cz';

/**
 * Injects BreadcrumbList JSON-LD for the current page.
 * Helps search engines show breadcrumb trail in results.
 *
 * @param {{ items: Array<{ name: string, url?: string }> }}
 *   items – e.g. [{ name: 'Domů', url: '/' }, { name: 'Kosmetika' }]
 *   url can be path (e.g. '/pmu') or full URL; current page item can omit url.
 */
export default function BreadcrumbSchema({ items = [] }) {
  const scriptRef = useRef(null);

  useEffect(() => {
    if (items.length === 0) return;

    const itemListElement = items.map((item, index) => {
      const url = item.url
        ? (item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url.startsWith('/') ? item.url : `/${item.url}`}`)
        : null;
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        ...(url ? { item: url } : {}),
      };
    });

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement,
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current?.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
    };
  }, [items]);

  return null;
}

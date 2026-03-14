import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://www.skinstudio.cz';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-hero.jpg`;

/**
 * Sets per-page <title>, <meta description>, <link canonical>,
 * Open Graph and Twitter Card tags. Cleans up on unmount by
 * restoring the original static values from index.html.
 *
 * @param {{ title: string, description: string, ogTitle?: string, ogDescription?: string, ogImage?: string, ogType?: string }} opts
 */
export default function useSEO({ title, description, ogTitle, ogDescription, ogImage, ogType }) {
  const { pathname } = useLocation();
  const canonicalUrl = `${BASE_URL}${pathname === '/' ? '/' : pathname}`;

  useEffect(() => {
    if (!title) return;
    const prev = document.title;
    document.title = title;
    return () => { document.title = prev; };
  }, [title]);

  useEffect(() => {
    if (!description) return;
    setMeta('description', description);
  }, [description]);

  useEffect(() => {
    if (!title) return;
    setLink('canonical', canonicalUrl);
  }, [title, canonicalUrl]);

  useEffect(() => {
    if (!title) return;
    setMeta('og:title', ogTitle || title, true);
    setMeta('og:description', ogDescription || description, true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:image', ogImage || DEFAULT_OG_IMAGE, true);
    setMeta('og:type', ogType || 'website', true);

    setMeta('twitter:card', 'summary_large_image', 'name');
    setMeta('twitter:title', ogTitle || title, 'name');
    setMeta('twitter:description', ogDescription || description, 'name');
    setMeta('twitter:image', ogImage || DEFAULT_OG_IMAGE, 'name');
  }, [title, description, ogTitle, ogDescription, ogImage, ogType, canonicalUrl]);
}

function setMeta(name, content, property) {
  if (!content) return;
  const attr = property === true ? 'property' : property === 'name' ? 'name' : 'name';
  const selector = property === true
    ? `meta[property="${name}"]`
    : `meta[name="${name}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

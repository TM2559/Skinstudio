import React, { useState, useEffect, useRef, useMemo } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { Instagram } from 'lucide-react';
import { INSTAGRAM_URL, getDocPath, isFirebaseRuntimeConfigured } from '../firebaseConfig';
import { WEB_CONTENT } from '../constants/content';

const INSTAGRAM_HANDLE = '@skin_studio_lucie_metelkova';
const CONFIG_DOC = 'instagramShowcase';
const STATIC_CONFIG_PATH = '/instagram-showcase/config.json';

/** Living Mosaic: swap interval and fade duration */
const SWAP_INTERVAL_MS = 3000;
const FADE_DURATION_MS = 700;

/** Build pool of unique images only — never duplicate the same URL. */
function buildPool(imageList) {
  if (!imageList || imageList.length === 0) return [];
  const seen = new Set();
  return imageList.filter((url) => {
    const key = url?.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function InstagramShowcase() {
  const [imageList, setImageList] = useState(null);
  const [displayedIndices, setDisplayedIndices] = useState([0, 1, 2, 3]);
  const [fadingSlot, setFadingSlot] = useState(null);
  const poolRef = useRef(buildPool(null));
  const displayedIndicesRef = useRef([0, 1, 2, 3]);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const pool = useMemo(() => buildPool(imageList), [imageList]);
  const visibleCount = Math.min(4, pool.length);

  useEffect(() => {
    displayedIndicesRef.current = displayedIndices;
  }, [displayedIndices]);

  useEffect(() => {
    poolRef.current = pool;
  }, [pool]);

  useEffect(() => {
    if (!isFirebaseRuntimeConfigured) return;
    const docRef = getDocPath('config', CONFIG_DOC);
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        const data = snap.data();
        const urls = Array.isArray(data?.urls) ? data.urls : [];
        if (urls.length > 0) setImageList(urls);
        else setImageList(null);
      },
      () => setImageList(null)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (imageList !== null) return;
    fetch(STATIC_CONFIG_PATH)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((arr) => {
        if (Array.isArray(arr) && arr.length > 0) {
          setImageList(arr.map((filename) => `/instagram-showcase/${filename.trim()}`));
        } else setImageList([]);
      })
      .catch(() => setImageList([]));
  }, [imageList]);

  useEffect(() => {
    const count = Math.min(4, pool.length);
    setDisplayedIndices(Array.from({ length: count }, (_, i) => i));
  }, [pool.length]);

  useEffect(() => {
    const count = Math.min(4, pool.length);
    if (pool.length <= count) return;

    intervalRef.current = setInterval(() => {
      const poolArr = poolRef.current;
      const current = displayedIndicesRef.current;
      const slot = Math.floor(Math.random() * current.length);
      const displayedSet = new Set(current);
      const candidates = poolArr
        .map((_, i) => i)
        .filter((i) => !displayedSet.has(i));
      if (candidates.length === 0) return;
      const newIdx = candidates[Math.floor(Math.random() * candidates.length)];

      setFadingSlot(slot);
      timeoutRef.current = setTimeout(() => {
        setDisplayedIndices((prev) => {
          const next = [...prev];
          next[slot] = newIdx;
          return next;
        });
        setFadingSlot(null);
      }, FADE_DURATION_MS);
    }, SWAP_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pool.length]);

  if (!INSTAGRAM_URL) return null;

  const hasImages = pool.length > 0;

  return (
    <section
      className="py-24"
      style={{ backgroundColor: 'var(--skin-cream)' }}
      id="instagram"
    >
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-stone-800 mb-2">
            {WEB_CONTENT.landing.sectionInstagram}
          </h2>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-sans tracking-widest uppercase text-stone-600 hover:text-[var(--skin-gold-dark)] transition-colors"
          >
            {INSTAGRAM_HANDLE}
          </a>
        </header>

        {hasImages ? (
          <div className={`grid gap-4 ${
            visibleCount <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'
          }`}>
            {Array.from({ length: visibleCount }, (_, i) => i).map((slotIndex) => {
              const idx = displayedIndices[slotIndex] ?? 0;
              const src = pool[idx] ?? pool[0];
              const isFading = fadingSlot === slotIndex;
              return (
                <div
                  key={slotIndex}
                  className="relative aspect-square rounded-2xl overflow-hidden"
                >
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block absolute inset-0 cursor-pointer"
                    aria-label={`Instagram – příspěvek ${slotIndex + 1}`}
                  >
                    <img
                      src={src}
                      alt={WEB_CONTENT.imageAlts.instagramGallery}
                      loading="lazy"
                      decoding="async"
                      className={`gallery-item absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-110 ${
                        isFading ? 'opacity-0' : 'opacity-100'
                      }`}
                    />
                    <div
                      className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center z-20 pointer-events-none"
                      aria-hidden
                    >
                      <Instagram
                        size={40}
                        className="text-white"
                        strokeWidth={1.5}
                      />
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-stone-500 text-sm py-8">
            Fotky budou zobrazeny po přidání v administraci (záložka Instagram).
          </p>
        )}
      </div>
    </section>
  );
}

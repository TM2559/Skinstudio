import React, { useState, useEffect, useRef, useMemo } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { Instagram } from 'lucide-react';
import { INSTAGRAM_URL, getDocPath } from '../firebaseConfig';

const INSTAGRAM_HANDLE = '@skin_studio_lucie_metelkova';
const CONFIG_DOC = 'instagramShowcase';
const STATIC_CONFIG_PATH = '/instagram-showcase/config.json';

/** Living Mosaic: swap interval and fade duration */
const SWAP_INTERVAL_MS = 3000;
const FADE_DURATION_MS = 700;

/** Image pool for the living mosaic (8–12 images). Reused for variety. */
const galleryImages = [
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop',
];

/** Fallback when no config – first 4 of pool */
const PLACEHOLDER_IMAGES = galleryImages.slice(0, 4);

/** Build pool: use imageList if available (pad to 8+ with galleryImages), else galleryImages */
function buildPool(imageList) {
  if (imageList && imageList.length > 0) {
    const fromConfig = [...imageList];
    while (fromConfig.length < 8) {
      fromConfig.push(galleryImages[fromConfig.length % galleryImages.length]);
    }
    return fromConfig.slice(0, 12);
  }
  return galleryImages;
}

export default function InstagramShowcase() {
  const [imageList, setImageList] = useState(null);
  /** Indices into pool for each of the 4 visible slots; initial: first 4 */
  const [displayedIndices, setDisplayedIndices] = useState([0, 1, 2, 3]);
  /** Which slot is currently fading out (0–3 or null) */
  const [fadingSlot, setFadingSlot] = useState(null);
  const poolRef = useRef(buildPool(null));
  const displayedIndicesRef = useRef([0, 1, 2, 3]);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const pool = useMemo(() => buildPool(imageList), [imageList]);
  displayedIndicesRef.current = displayedIndices;
  poolRef.current = pool;

  useEffect(() => {
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
    const len = pool.length;
    setDisplayedIndices((prev) => {
      const next = prev.map((idx) => (idx < len ? idx : 0));
      return next.every((n, i) => n === prev[i]) ? prev : next;
    });
  }, [pool.length]);

  useEffect(() => {
    if (pool.length < 2) return;

    intervalRef.current = setInterval(() => {
      const poolArr = poolRef.current;
      const current = displayedIndicesRef.current;
      const slot = Math.floor(Math.random() * 4);
      const displayedSet = new Set(current);
      const otherIndices = poolArr
        .map((_, i) => i)
        .filter((i) => !displayedSet.has(i));
      const candidates = otherIndices.length > 0 ? otherIndices : [...Array(poolArr.length).keys()];
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

  return (
    <section
      className="py-24"
      style={{ backgroundColor: 'var(--skin-cream)' }}
      id="instagram"
    >
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-10">
          <h2 className="font-display text-3xl text-stone-800 mb-2">
            Sledujte nás na Instagramu
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((slotIndex) => {
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
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className={`gallery-item absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-110 ${
                      isFading ? 'opacity-0' : 'opacity-100'
                    }`}
                    onError={(e) => {
                      e.target.src = galleryImages[0];
                    }}
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
      </div>
    </section>
  );
}

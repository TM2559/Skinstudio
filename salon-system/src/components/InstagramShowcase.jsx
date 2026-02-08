import React, { useState, useEffect, useMemo } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { Instagram } from 'lucide-react';
import { INSTAGRAM_URL, getDocPath } from '../firebaseConfig';

const INSTAGRAM_HANDLE = '@skin_studio_lucie_metelkova';
const CONFIG_DOC = 'instagramShowcase';
const STATIC_CONFIG_PATH = '/instagram-showcase/config.json';

/** Crossfade: délka prolínání (1–2 s) a intervaly pro každý slot (ms) */
const CROSSFADE_DURATION_MS = 2000;
const SLOT_INTERVALS_MS = [4000, 5500, 4800, 6000];

/** Placeholder sady pro každý ze 4 slotů (nature/skincare) */
const SLOT_PLACEHOLDERS = [
  [
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=600&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=600&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&h=600&fit=crop',
  ],
];

/** Fallback flat list když nemáme sloty */
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop',
];

/** Rozdělí plochý seznam URL do 4 slotů (round-robin) pro crossfade */
function flatUrlsToSlots(urls) {
  const slots = [[], [], [], []];
  urls.forEach((url, i) => slots[i % 4].push(url));
  return slots;
}

export default function InstagramShowcase() {
  const [imageList, setImageList] = useState(null);
  const [activeIndices, setActiveIndices] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const docRef = getDocPath('config', CONFIG_DOC);

    const unsub = onSnapshot(
      docRef,
      (snap) => {
        const data = snap.data();
        const urls = Array.isArray(data?.urls) ? data.urls : [];
        if (urls.length > 0) {
          setImageList(urls);
          return;
        }
        setImageList(null);
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
        } else {
          setImageList(PLACEHOLDER_IMAGES);
        }
      })
      .catch(() => setImageList(PLACEHOLDER_IMAGES));
  }, [imageList]);

  const slotImages = useMemo(() => {
    if (!imageList || imageList.length === 0) return SLOT_PLACEHOLDERS;
    const slots = flatUrlsToSlots(imageList);
    return slots.map((slot, i) =>
      slot.length > 0 ? slot : [PLACEHOLDER_IMAGES[i % 4]]
    );
  }, [imageList]);

  useEffect(() => {
    setActiveIndices((prev) =>
      prev.map((idx, slotIndex) => {
        const count = slotImages[slotIndex]?.length ?? 1;
        return count > 0 ? Math.min(idx, count - 1) : 0;
      })
    );
  }, [slotImages]);

  useEffect(() => {
    const timers = SLOT_INTERVALS_MS.map((intervalMs, slotIndex) => {
      return setInterval(() => {
        setActiveIndices((prev) => {
          const next = [...prev];
          const count = slotImages[slotIndex]?.length ?? 1;
          next[slotIndex] = count > 0 ? (prev[slotIndex] + 1) % count : 0;
          return next;
        });
      }, intervalMs);
    });
    return () => timers.forEach(clearInterval);
  }, [slotImages]);

  if (!INSTAGRAM_URL) return null;

  const durationClass = 'duration-[2000ms]';

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
          {slotImages.map((urls, slotIndex) => {
            const list = urls.length > 0 ? urls : [PLACEHOLDER_IMAGES[slotIndex % 4]];
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
                  <div className="absolute inset-0 overflow-hidden">
                    {list.map((src, imgIndex) => (
                      <img
                        key={typeof src === 'string' ? src : imgIndex}
                        src={src}
                        alt=""
                        className={`absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 transition-opacity ease-in-out ${durationClass} ${
                          activeIndices[slotIndex] === imgIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                        onError={(e) => {
                          e.target.src = PLACEHOLDER_IMAGES[imgIndex % PLACEHOLDER_IMAGES.length];
                        }}
                      />
                    ))}
                  </div>
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

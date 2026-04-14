import { useState, useEffect, useRef } from 'react';
import { query, where, onSnapshot } from 'firebase/firestore';
import { getCollectionPath, isFirebaseRuntimeConfigured } from '../firebaseConfig';
import { GALLERY_COLLECTION } from '../constants/cosmetics';

const MAX_ITEMS = 6;

function mergeByImageUrl(docsByPath) {
  const seen = new Set();
  const out = [];
  for (const docs of docsByPath) {
    for (const i of docs) {
      const url = i.imageUrl?.trim();
      if (url && !seen.has(url)) {
        seen.add(url);
        out.push(i);
      }
    }
  }
  return out.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? a.createdAt ?? 0;
    const tb = b.createdAt?.toMillis?.() ?? b.createdAt ?? 0;
    return tb - ta;
  });
}

export default function EditorialGallery({ category, theme = 'light' }) {
  const [items, setItems] = useState([]);
  const docsByPathRef = useRef([]);

  useEffect(() => {
    if (!isFirebaseRuntimeConfigured) return;
    const col = getCollectionPath(GALLERY_COLLECTION);
    const q = query(col, where('category', '==', category));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? a.createdAt ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? b.createdAt ?? 0;
        return tb - ta;
      });
      docsByPathRef.current = [list];
      setItems(mergeByImageUrl(docsByPathRef.current).slice(0, MAX_ITEMS));
    });
    return () => unsub();
  }, [category]);

  if (items.length === 0) return null;

  const dark = theme === 'dark';

  return (
    <section className={`py-24 ${dark ? 'bg-[#0F0F0F]' : ''}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h2
          className={`font-display text-3xl font-semibold mb-16 text-center ${
            dark ? 'text-white' : 'text-stone-800'
          }`}
        >
          Galerie
        </h2>

        {/* Mobile: horizontal swipe carousel */}
        <div className="md:hidden flex overflow-x-auto gap-4 pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
          {items.map((item) => (
            <div key={item.id} className="w-[85vw] flex-shrink-0 snap-center">
              <div
                className={`overflow-hidden rounded-2xl relative group ${
                  dark ? 'bg-white/5' : 'bg-stone-100'
                }`}
              >
                <div className="aspect-[4/5]">
                  <img
                    src={item.imageUrl}
                    alt={item.caption || ''}
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              </div>
              {item.caption && (
                <p
                  className={`mt-3 text-[10px] uppercase tracking-widest font-semibold ${
                    dark ? 'text-[#A1A1AA]' : 'text-stone-500'
                  }`}
                >
                  {item.caption}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Desktop: asymmetric editorial grid */}
        <div className="hidden md:grid grid-cols-3 gap-6">
          {items.map((item, index) => {
            const isHero = index === 0;
            return (
              <div
                key={item.id}
                className={isHero ? 'col-span-2 row-span-2' : 'col-span-1'}
              >
                <div
                  className={`overflow-hidden rounded-2xl relative group ${
                    dark ? 'bg-white/5' : 'bg-stone-100'
                  } ${isHero ? 'h-full' : ''}`}
                >
                  <div className={isHero ? 'h-full' : 'aspect-[4/5]'}>
                    <img
                      src={item.imageUrl}
                      alt={item.caption || ''}
                      className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </div>
                {item.caption && (
                  <p
                    className={`mt-3 text-[10px] uppercase tracking-widest font-semibold ${
                      dark ? 'text-[#A1A1AA]' : 'text-stone-500'
                    }`}
                  >
                    {item.caption}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

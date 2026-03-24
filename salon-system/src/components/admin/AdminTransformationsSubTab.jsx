import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Upload, Trash2, ImageIcon } from 'lucide-react';
import { storage, getPublicContentCollectionPath, getPublicContentCollectionPathString, getPublicContentCollectionPathsForRead, getPublicContentDocPathBySourceIndex } from '../../firebaseConfig';
import { COSMETICS_CATEGORY, PMU_CATEGORY, TRANSFORMATIONS_COLLECTION, STORAGE_TRANSFORMATIONS_PREFIX } from '../../constants/cosmetics';
import { slugify } from '../../utils/helpers';
import CategoryToggle from './CategoryToggle';

function mergeTransformationDocs(docsByPath) {
  const seen = new Set();
  const out = [];
  docsByPath.forEach((docs, pathIndex) => {
    for (const item of docs) {
      const key = [item.imageBeforeUrl, item.imageAfterUrl, item.createdAt].filter(Boolean).join('|') || item.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        out.push({ ...item, _sourcePathIndex: pathIndex });
      }
    }
  });
  return out.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

// Client-side image optimization before upload to Storage.
// Keeps quality high, but limits max dimension so loading is much faster.
export async function createOptimizedImageFile(file, maxSize = 1600, quality = 0.85) {
  if (!file) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('Nepodařilo se načíst obrázek.'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const optimizedFile = new File(
                [blob],
                file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '.jpg'),
                { type: 'image/jpeg' }
              );
              resolve(optimizedFile);
            },
            'image/jpeg',
            quality
          );
        } catch (e) {
          resolve(file);
        }
      };
      img.onerror = () => reject(new Error('Nepodařilo se načíst obrázek pro zmenšení.'));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminTransformationsSubTab() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState(COSMETICS_CATEGORY);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageBeforeFile, setImageBeforeFile] = useState(null);
  const [imageAfterFile, setImageAfterFile] = useState(null);
  const [itemsCosmetics, setItemsCosmetics] = useState([]);
  const [itemsPmu, setItemsPmu] = useState([]);

  const colRef = getPublicContentCollectionPath(TRANSFORMATIONS_COLLECTION);
  const colRefs = getPublicContentCollectionPathsForRead(TRANSFORMATIONS_COLLECTION);
  const docsByPathRef = useRef(colRefs.map(() => []));

  useEffect(() => {
    if (!colRefs.length) {
      setLoading(false);
      return;
    }
    const unsubs = colRefs.map((colRef, idx) =>
      onSnapshot(
        colRef,
        (snap) => {
          docsByPathRef.current[idx] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const all = mergeTransformationDocs(docsByPathRef.current);
          setItemsCosmetics(all.filter((item) => (item.category || COSMETICS_CATEGORY) === COSMETICS_CATEGORY));
          setItemsPmu(all.filter((item) => item.category === PMU_CATEGORY));
          setLoading(false);
        },
        (err) => {
          console.error(err);
          const hasAny = docsByPathRef.current.some((arr) => arr.length > 0);
          if (!hasAny) setError('Nepodařilo se načíst proměny.');
          setLoading(false);
        }
      )
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  const items = useMemo(() => {
    const merged = [...itemsCosmetics, ...itemsPmu];
    merged.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return merged;
  }, [itemsCosmetics, itemsPmu]);

  const canSave = imageBeforeFile && imageAfterFile && (title || '').trim().length > 0;

  const handleAdd = async () => {
    if (!imageBeforeFile || !imageAfterFile) {
      setError('Pro uložení musíte nahrát oba obrázky: Před i Po.');
      return;
    }
    const trimmedTitle = (title || '').trim();
    if (!trimmedTitle) {
      setError('Vyplňte název (např. Akné).');
      return;
    }
    setUploading(true);
    setError('');
    try {
      // Optimalizace obrázků před nahráním – max ~1600px delší strana, JPEG s kvalitním kompresním poměrem.
      const optimizedBefore = await createOptimizedImageFile(imageBeforeFile);
      const optimizedAfter = await createOptimizedImageFile(imageAfterFile);

      const ts = Date.now();
      const categorySlug = category === PMU_CATEGORY ? 'pmu' : 'cosmetics';
      const titleSlug = slugify(trimmedTitle);
      const pathBefore = `${STORAGE_TRANSFORMATIONS_PREFIX}/${ts}-${categorySlug}-${titleSlug}-before-uhersky-brod-skin-studio.jpg`;
      const pathAfter = `${STORAGE_TRANSFORMATIONS_PREFIX}/${ts}-${categorySlug}-${titleSlug}-after-uhersky-brod-skin-studio.jpg`;
      const refBefore = ref(storage, pathBefore);
      const refAfter = ref(storage, pathAfter);
      await uploadBytes(refBefore, optimizedBefore || imageBeforeFile);
      await uploadBytes(refAfter, optimizedAfter || imageAfterFile);
      const imageBeforeUrl = await getDownloadURL(refBefore);
      const imageAfterUrl = await getDownloadURL(refAfter);
      await addDoc(colRef, {
        imageBeforeUrl,
        imageAfterUrl,
        title: trimmedTitle,
        description: (description || '').trim(),
        category: category || COSMETICS_CATEGORY,
        createdAt: new Date().toISOString(),
      });
      setTitle('');
      setDescription('');
      setImageBeforeFile(null);
      setImageAfterFile(null);
      const beforeInput = document.getElementById('transformation-before-input');
      const afterInput = document.getElementById('transformation-after-input');
      if (beforeInput) beforeInput.value = '';
      if (afterInput) afterInput.value = '';
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Nahrání se nezdařilo. Zkontrolujte Storage a pravidla.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (item) => {
    if (!confirm('Tuto proměnu (před/po) odebrat?')) return;
    const docRef = getPublicContentDocPathBySourceIndex(TRANSFORMATIONS_COLLECTION, item.id, item._sourcePathIndex ?? 0);
    try {
      await deleteDoc(docRef);
    } catch (e) {
      console.error(e);
      setError('Nepodařilo se smazat.');
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-stone-500">
        Načítám proměny…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-500 mb-4">
        Před/po dvojice pro sekci „Proměny“. Vyberte, zda jde na stránku <strong>Kosmetika</strong> nebo <strong>PMU</strong>. <strong>Oba obrázky jsou povinné.</strong>
      </p>
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Kde se zobrazí</span>
          <CategoryToggle value={category} onChange={setCategory} disabled={uploading} />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-stone-500">Upload Před</span>
            <label className="flex flex-col items-center justify-center min-h-[120px] px-4 py-4 rounded-lg border-2 border-dashed border-stone-300 bg-white cursor-pointer hover:border-stone-400 hover:bg-stone-50/50 transition-colors">
              <Upload size={24} className="text-stone-400 mb-1" />
              <span className="text-sm font-medium text-stone-600">
                {imageBeforeFile ? imageBeforeFile.name : 'Vybrat obrázek Před'}
              </span>
              <input
                id="transformation-before-input"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => setImageBeforeFile(e.target.files?.[0] || null)}
              />
            </label>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-stone-500">Upload Po</span>
            <label className="flex flex-col items-center justify-center min-h-[120px] px-4 py-4 rounded-lg border-2 border-dashed border-stone-300 bg-white cursor-pointer hover:border-stone-400 hover:bg-stone-50/50 transition-colors">
              <Upload size={24} className="text-stone-400 mb-1" />
              <span className="text-sm font-medium text-stone-600">
                {imageAfterFile ? imageAfterFile.name : 'Vybrat obrázek Po'}
              </span>
              <input
                id="transformation-after-input"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => setImageAfterFile(e.target.files?.[0] || null)}
              />
            </label>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Název (povinné) <span className="text-red-500">*</span></span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="např. Akné"
            className="w-full max-w-md px-3 py-2 border border-stone-200 rounded-lg text-stone-800"
            disabled={uploading}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Popis (volitelné)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Krátký popis výsledku"
            rows={2}
            className="w-full max-w-md px-3 py-2 border border-stone-200 rounded-lg text-stone-800"
            disabled={uploading}
          />
        </label>

        <button
          type="button"
          onClick={handleAdd}
          disabled={uploading || !canSave}
          className="skin-accent px-6 py-3 rounded-xl text-sm font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Nahrávám…' : 'Přidat proměnu'}
        </button>
        {!canSave && (imageBeforeFile || imageAfterFile || title) && (
          <p className="text-xs text-amber-700">
            Pro uložení jsou potřeba oba obrázky (Před i Po) a vyplněný název.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-stone-200 bg-white"
          >
            <div className="flex gap-2 flex-1 min-w-0">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                <img src={item.imageBeforeUrl} alt="Před" className="w-full h-full object-cover" />
              </div>
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                <img src={item.imageAfterUrl} alt="Po" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-800">{item.title || '—'}</p>
                {item.description && (
                  <p className="text-sm text-stone-600 truncate" title={item.description}>{item.description}</p>
                )}
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    item.category === PMU_CATEGORY ? 'bg-[#B37E76]/90 text-white' : 'bg-stone-600/90 text-white'
                  }`}
                >
                  {item.category === PMU_CATEGORY ? 'PMU' : 'Kosmetika'}
                </span>
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                aria-label="Odebrat"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && !uploading && (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-stone-200 text-stone-400">
          <ImageIcon size={40} className="mb-2" />
          <p className="text-sm">Zatím žádné před/po proměny. Vyberte oba obrázky a vyplňte název.</p>
          <p className="mt-3 text-xs text-stone-400 max-w-md text-center">
            Proměny se vždy ukládají do kořenové kolekce (nezávisle na prostředí). Ve Firebase Console → Firestore hledejte:{' '}
            <code className="bg-stone-200 px-1 rounded break-all">{getPublicContentCollectionPathString(TRANSFORMATIONS_COLLECTION) || TRANSFORMATIONS_COLLECTION}</code>
          </p>
        </div>
      )}
    </div>
  );
}

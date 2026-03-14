import React, { useState, useEffect, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { storage, getPublicContentCollectionPath, getPublicContentCollectionPathString, getPublicContentCollectionPathsForRead, getPublicContentDocPathBySourceIndex } from '../../firebaseConfig';
import { COSMETICS_CATEGORY, PMU_CATEGORY, GALLERY_COLLECTION, STORAGE_GALLERY_PREFIX } from '../../constants/cosmetics';
import { slugify } from '../../utils/helpers';
import CategoryToggle from './CategoryToggle';

function mergeGalleryDocs(docsByPath) {
  const seen = new Set();
  const out = [];
  docsByPath.forEach((docs, pathIndex) => {
    for (const item of docs) {
      const key = item.imageUrl?.trim() || item.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        out.push({ ...item, _sourcePathIndex: pathIndex });
      }
    }
  });
  return out.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

// Client-side image optimization before upload to Storage (same logic as Proměny).
async function createOptimizedImageFile(file, maxSize = 1600, quality = 0.85) {
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

export default function AdminGallerySubTab() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState(COSMETICS_CATEGORY);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const colRefs = getPublicContentCollectionPathsForRead(GALLERY_COLLECTION);
  const [itemsCosmetics, setItemsCosmetics] = useState([]);
  const [itemsPmu, setItemsPmu] = useState([]);
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
          const all = mergeGalleryDocs(docsByPathRef.current);
          setItemsCosmetics(all.filter((item) => (item.category || COSMETICS_CATEGORY) === COSMETICS_CATEGORY));
          setItemsPmu(all.filter((item) => item.category === PMU_CATEGORY));
          setLoading(false);
        },
        (err) => {
          console.error(err);
          const hasAny = docsByPathRef.current.some((arr) => arr.length > 0);
          if (!hasAny) setError('Nepodařilo se načíst galerii.');
          setLoading(false);
        }
      )
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  const items = React.useMemo(() => {
    const merged = [...itemsCosmetics, ...itemsPmu];
    merged.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return merged;
  }, [itemsCosmetics, itemsPmu]);

  const handleSingleUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file?.type?.startsWith('image/')) return;
    setSelectedFile(file);
  };

  const handleAdd = async () => {
    if (!selectedFile) {
      setError('Vyberte obrázek.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const optimized = await createOptimizedImageFile(selectedFile);
      const ts = Date.now();
      const categorySlug = category === PMU_CATEGORY ? 'pmu' : 'cosmetics';
      const parts = [categorySlug];
      if ((caption || '').trim()) parts.push(slugify(caption.trim()));
      parts.push('uhersky-brod', 'skin-studio');
      const slugPart = parts.join('-');
      const path = `${STORAGE_GALLERY_PREFIX}/${ts}-${slugPart}.jpg`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, optimized || selectedFile);
      const imageUrl = await getDownloadURL(storageRef);
      await addDoc(colRef, {
        imageUrl,
        caption: (caption || '').trim(),
        category: category || COSMETICS_CATEGORY,
        createdAt: new Date().toISOString(),
      });
      setCaption('');
      setSelectedFile(null);
      if (document.getElementById('gallery-file-input')) document.getElementById('gallery-file-input').value = '';
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Nahrání se nezdařilo. Zkontrolujte Storage a pravidla.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (item) => {
    if (!confirm('Obrázek odebrat z galerie?')) return;
    const docRef = getPublicContentDocPathBySourceIndex(GALLERY_COLLECTION, item.id, item._sourcePathIndex ?? 0);
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
        Načítám galerii…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-500 mb-4">
        Jednoduché fotografie do sekce „Moje práce“. Vyberte, zda jde na stránku <strong>Kosmetika</strong> nebo <strong>PMU</strong>.
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
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Obrázek</span>
          <label className="skin-accent px-4 py-3 rounded-lg text-sm font-bold uppercase flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 w-fit">
            <Upload size={18} />
            {selectedFile ? selectedFile.name : 'Vybrat soubor'}
            <input
              id="gallery-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={handleSingleUpload}
            />
          </label>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Popisek (volitelné)</span>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="např. Ošetření pleti"
            className="w-full max-w-md px-3 py-2 border border-stone-200 rounded-lg text-stone-800"
            disabled={uploading}
          />
        </label>
        <button
          type="button"
          onClick={handleAdd}
          disabled={uploading || !selectedFile}
          className="skin-accent px-6 py-3 rounded-xl text-sm font-bold uppercase disabled:opacity-50"
        >
          {uploading ? 'Nahrávám…' : 'Přidat do galerie'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative group rounded-xl border border-stone-200 bg-white overflow-hidden"
          >
            <div className="aspect-square bg-stone-100">
              <img
                src={item.imageUrl}
                alt={item.caption || ''}
                className="w-full h-full object-cover"
              />
            </div>
            {item.caption && (
              <p className="p-2 text-xs text-stone-600 truncate" title={item.caption}>
                {item.caption}
              </p>
            )}
            <span
              className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                item.category === PMU_CATEGORY
                  ? 'bg-[#B37E76]/90 text-white'
                  : 'bg-stone-600/90 text-white'
              }`}
            >
              {item.category === PMU_CATEGORY ? 'PMU' : 'Kosmetika'}
            </span>
            <button
              type="button"
              onClick={() => handleRemove(item)}
              className="absolute top-2 right-2 p-2 rounded-full bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Odebrat"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && !uploading && (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-stone-200 text-stone-400">
          <ImageIcon size={40} className="mb-2" />
          <p className="text-sm">Zatím žádné fotografie. Nahrajte první obrázek výše.</p>
          <p className="mt-3 text-xs text-stone-400 max-w-md text-center">
            Galerie se vždy ukládá do kořenové kolekce (nezávisle na prostředí). Ve Firebase Console → Firestore hledejte:{' '}
            <code className="bg-stone-200 px-1 rounded break-all">{getPublicContentCollectionPathString(GALLERY_COLLECTION) || GALLERY_COLLECTION}</code>
          </p>
        </div>
      )}
    </div>
  );
}

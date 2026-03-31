import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDoc, setDoc } from 'firebase/firestore';
import { Instagram, Upload, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { storage, getDocPath } from '../../firebaseConfig';

const CONFIG_DOC = 'instagramShowcase';
const STORAGE_PREFIX = 'instagram-showcase';

export default function AdminInstagramTab() {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const docRef = getDocPath('config', CONFIG_DOC);

  const load = async () => {
    try {
      const snap = await getDoc(docRef);
      const data = snap.data();
      setUrls(Array.isArray(data?.urls) ? data.urls : []);
    } catch (e) {
      console.error(e);
      setError('Nepodařilo se načíst galerii.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (newUrls) => {
    setError('');
    try {
      await setDoc(docRef, { urls: newUrls });
      setUrls(newUrls);
    } catch (e) {
      console.error(e);
      setError('Nepodařilo se uložit.');
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    const imageFiles = [...files].filter((f) => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    setUploading(true);
    setError('');
    try {
      let newUrls = [...urls];
      for (const file of imageFiles) {
        const path = `${STORAGE_PREFIX}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        newUrls = [...newUrls, downloadUrl];
      }
      await save(newUrls);
    } catch (err) {
      console.error(err);
      const code = err?.code || '';
      const msg = err?.message || String(err);
      setError(`Nahrání se nezdařilo. ${code ? `(${code}) ` : ''}${msg}. Zkontrolujte, že je Storage zapnuté a pravidla nasazená.`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = (index) => {
    if (!confirm('Obrázek odebrat z galerie?')) return;
    const newUrls = urls.filter((_, i) => i !== index);
    save(newUrls);
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= urls.length) return;
    const next = [...urls];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    save(next);
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
      <section>
        <h2 className="font-display text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800">
          <Instagram size={18} className="text-stone-400" /> Galerie Instagram (úvodní stránka)
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          Fotky zobrazené v sekci „Sledujte nás na Instagramu“. Pořadí můžete měnit šipkami nebo přidávat nové.
        </p>
        <p className="text-xs text-stone-400 mb-4">
          Na telefonu otevřete admin, záložku Instagram a tlačítkem níže vyberte fotky přímo z galerie (můžete vybrat i více najednou).
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-4 items-center mb-6">
          <label className="skin-accent px-6 py-3 min-h-[48px] rounded-xl text-sm font-bold uppercase flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 touch-manipulation active:scale-[0.98]">
            <Upload size={20} />
            {uploading ? 'Nahrávám…' : 'Přidat fotku z galerie'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {urls.map((url, index) => (
            <div
              key={url}
              className="relative group bg-stone-100 rounded-xl overflow-hidden border border-stone-200"
            >
              <div className="aspect-square bg-stone-200">
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>
              {/* Na mobilu tlačítka pod obrázkem, na desktopu overlay při hoveru – jen šipky a smazat */}
              <div className="flex sm:absolute sm:inset-0 sm:bg-black/40 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity items-center justify-center gap-2 p-2 bg-stone-800/90 sm:bg-transparent">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="p-2 rounded-full bg-white/90 text-stone-700 disabled:opacity-30 touch-manipulation"
                  aria-label="Posunout nahoru"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === urls.length - 1}
                  className="p-2 rounded-full bg-white/90 text-stone-700 disabled:opacity-30 touch-manipulation"
                  aria-label="Posunout dolů"
                >
                  <ChevronDown size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 touch-manipulation"
                  aria-label="Odebrat"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {urls.length === 0 && !uploading && (
          <p className="text-sm text-stone-400 italic py-4">
            Zatím žádné fotky. Klikněte na „Přidat fotku“ a nahrajte obrázky (doporučený formát čtverec 1:1).
          </p>
        )}
      </section>
    </div>
  );
}

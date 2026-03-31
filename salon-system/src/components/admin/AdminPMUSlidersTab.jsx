import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDoc, setDoc } from 'firebase/firestore';
import { Sliders, Upload, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { storage, getDocPath } from '../../firebaseConfig';

const CONFIG_DOC = 'pmuSliders';
const STORAGE_PREFIX = 'pmu-sliders';

const defaultSliders = () => [];

export default function AdminPMUSlidersTab() {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [altText, setAltText] = useState('');

  const docRef = getDocPath('config', CONFIG_DOC);

  const load = async () => {
    try {
      const snap = await getDoc(docRef);
      const data = snap.data();
      setSliders(Array.isArray(data?.sliders) ? data.sliders : defaultSliders());
    } catch (e) {
      console.error(e);
      setError('Nepodařilo se načíst slidery.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (newSliders) => {
    setError('');
    try {
      await setDoc(docRef, { sliders: newSliders });
      setSliders(newSliders);
    } catch (e) {
      console.error(e);
      setError('Nepodařilo se uložit.');
    }
  };

  const handleAdd = async () => {
    if (!beforeFile || !afterFile) {
      setError('Vyberte oba obrázky (Před a Po).');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const ts = Date.now();
      const safe = (f) => f.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const pathBefore = `${STORAGE_PREFIX}/${ts}-before-${safe(beforeFile)}`;
      const pathAfter = `${STORAGE_PREFIX}/${ts}-after-${safe(afterFile)}`;
      const refBefore = ref(storage, pathBefore);
      const refAfter = ref(storage, pathAfter);
      await uploadBytes(refBefore, beforeFile);
      await uploadBytes(refAfter, afterFile);
      const beforeImage = await getDownloadURL(refBefore);
      const afterImage = await getDownloadURL(refAfter);
      const newItem = {
        beforeImage,
        afterImage,
        altText: (altText || 'Před a po').trim(),
      };
      const newSliders = [...sliders, newItem];
      await save(newSliders);
      setBeforeFile(null);
      setAfterFile(null);
      setAltText('');
    } catch (err) {
      console.error(err);
      const code = err?.code || '';
      const msg = err?.message || String(err);
      setError(`Nahrání se nezdařilo. ${code ? `(${code}) ` : ''}${msg}. Zkontrolujte, že je Storage zapnuté a pravidla nasazená.`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index) => {
    if (!confirm('Tento před/po slider odebrat?')) return;
    const newSliders = sliders.filter((_, i) => i !== index);
    save(newSliders);
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= sliders.length) return;
    const next = [...sliders];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    save(next);
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-stone-500">
        Načítám před/po slidery…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800">
          <Sliders size={18} className="text-stone-400" /> PMU Před / Po (stránka PMU)
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          Přidejte dvojice obrázků „Před“ a „Po“. Zobrazí se na stránce PMU jako posuvný slider. Pořadí můžete měnit šipkami.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-stone-500">Obrázek Před</span>
              <label className="skin-accent px-4 py-3 rounded-lg text-sm font-bold uppercase flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50">
                <Upload size={18} />
                {beforeFile ? beforeFile.name : 'Vybrat soubor'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => setBeforeFile(e.target.files?.[0] || null)}
                />
              </label>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-stone-500">Obrázek Po</span>
              <label className="skin-accent px-4 py-3 rounded-lg text-sm font-bold uppercase flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50">
                <Upload size={18} />
                {afterFile ? afterFile.name : 'Vybrat soubor'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => setAfterFile(e.target.files?.[0] || null)}
                />
              </label>
            </label>
          </div>
          <div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-stone-500">Popis (pro čtečky obrazovky)</span>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="např. PMU obočí – před a po"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-800"
                disabled={uploading}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={uploading || !beforeFile || !afterFile}
            className="skin-accent px-6 py-3 rounded-xl text-sm font-bold uppercase disabled:opacity-50"
          >
            {uploading ? 'Nahrávám…' : 'Přidat před/po slider'}
          </button>
        </div>

        <div className="space-y-4">
          {sliders.map((item, index) => (
            <div
              key={`${item.beforeImage}-${index}`}
              className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-stone-200 bg-white"
            >
              <div className="flex gap-2 flex-1 min-w-0">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                  <img src={item.beforeImage} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                  <img src={item.afterImage} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0 flex-1 flex items-center">
                  <p className="text-sm text-stone-600 truncate" title={item.altText}>
                    {item.altText || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="p-2 rounded-full bg-stone-100 text-stone-600 disabled:opacity-30"
                  aria-label="Posunout nahoru"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === sliders.length - 1}
                  className="p-2 rounded-full bg-stone-100 text-stone-600 disabled:opacity-30"
                  aria-label="Posunout dolů"
                >
                  <ChevronDown size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                  aria-label="Odebrat"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {sliders.length === 0 && !uploading && (
          <p className="text-sm text-stone-400 italic py-4">
            Zatím žádné před/po slidery. Vyberte oba obrázky a klikněte na „Přidat před/po slider“.
          </p>
        )}
      </section>
    </div>
  );
}

import React, { useState } from 'react';
import { Package, Edit2, Trash2 } from 'lucide-react';
import { addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getCollectionPath, getDocPath } from '../../firebaseConfig';

const AdminAddonsTab = ({ addons, onAddonsChange }) => {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    default_price: '',
    is_active: true,
    price_behavior: 'ADD',
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      default_price: '',
      is_active: true,
      price_behavior: 'ADD',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) return;
    const data = {
      name: form.name.trim(),
      default_price: parseInt(form.default_price, 10) || 0,
      is_active: !!form.is_active,
      price_behavior: form.price_behavior === 'REPLACE' ? 'REPLACE' : 'ADD',
    };
    try {
      if (editingId) {
        await updateDoc(getDocPath('addons', editingId), data);
      } else {
        await addDoc(getCollectionPath('addons'), data);
      }
      resetForm();
      if (onAddonsChange) onAddonsChange();
    } catch (err) {
      console.error(err);
      alert('Chyba při ukládání.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Opravdu smazat tento add-on? Služby, které ho nabízejí, ho už nebudou mít v konfiguraci.')) return;
    try {
      await deleteDoc(getDocPath('addons', id));
      if (editingId === id) resetForm();
      if (onAddonsChange) onAddonsChange();
    } catch (err) {
      console.error(err);
      alert('Chyba při mazání.');
    }
  };

  const startEdit = (addon) => {
    setEditingId(addon.id);
    setForm({
      name: addon.name || '',
      default_price: addon.default_price ?? '',
      is_active: addon.is_active !== false,
      price_behavior: addon.price_behavior === 'REPLACE' ? 'REPLACE' : 'ADD',
    });
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800">
        <Package size={18} className="text-stone-400" /> Správa add-onů
      </h2>
      <p className="text-xs text-stone-500 mb-6">
        Add-ony jsou doplňkové služby (např. barvení obočí, maska). Cenu a doporučení pro konkrétní hlavní službu nastavíte v záložce „Služby“ u dané procedury.
      </p>

      <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4 shadow-sm mb-6">
        <h3 className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">
          {editingId ? 'Upravit add-on' : 'Nový add-on'}
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <input
            type="text"
            placeholder="Název (např. Barvení obočí)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-3 border border-stone-200 rounded-lg text-sm"
          />
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pt-3">Typ ceny</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="price_behavior"
                  checked={form.price_behavior === 'ADD'}
                  onChange={() => setForm({ ...form, price_behavior: 'ADD' })}
                  className="border-stone-300"
                />
                <span className="text-sm text-stone-600">Přičíst k ceně</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="price_behavior"
                  checked={form.price_behavior === 'REPLACE'}
                  onChange={() => setForm({ ...form, price_behavior: 'REPLACE' })}
                  className="border-stone-300"
                />
                <span className="text-sm text-stone-600">Konečná cena</span>
              </label>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-0 sm:min-w-[120px]">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Výchozí cena (Kč)</label>
                <input
                  type="number"
                  min="0"
                  placeholder={form.price_behavior === 'REPLACE' ? '5000' : '350'}
                  value={form.default_price}
                  onChange={(e) => setForm({ ...form, default_price: e.target.value })}
                  className="w-full p-3 border border-stone-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded border-stone-300"
            />
            <span className="text-sm text-stone-600">Aktivní (zobrazovat v nabídce)</span>
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-stone-800 text-white py-3 rounded-lg font-bold text-[10px] uppercase shadow-md"
            >
              {editingId ? 'Uložit změny' : '+ Přidat add-on'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 bg-stone-100 text-stone-500 rounded-lg font-bold text-[10px] uppercase"
              >
                Zrušit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-2">
        {addons.length === 0 ? (
          <p className="text-sm text-stone-400 italic">Zatím nemáte žádné add-ony. Přidejte první výše.</p>
        ) : (
          addons.map((addon) => (
            <div
              key={addon.id}
              className={`flex justify-between items-center bg-stone-50 p-3 rounded-lg border border-stone-100 transition-all ${editingId === addon.id ? 'ring-2 ring-stone-400' : ''}`}
            >
              <div>
                <span className="text-sm font-bold text-stone-800">{addon.name}</span>
                <div className="flex gap-2 mt-1 text-[10px] text-stone-500">
                  <span>{addon.default_price ?? 0} Kč</span>
                  {addon.duration_minutes != null && addon.duration_minutes !== '' && (
                    <span>{addon.duration_minutes} min</span>
                  )}
                  {addon.is_active === false && (
                    <span className="text-amber-600 font-medium">Neaktivní</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(addon)}
                  className="p-2 text-stone-400 hover:text-stone-800"
                  title="Upravit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(addon.id)}
                  className="p-2 text-stone-300 hover:text-red-500"
                  title="Smazat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminAddonsTab;

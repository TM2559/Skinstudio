import React, { useState } from 'react';
import {
  Scissors,
  X,
  Plus,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Edit2,
  Trash2,
  WandSparkles,
  Loader2,
} from 'lucide-react';

const AdminServicesTab = ({
  services,
  editingServiceId,
  serviceForm,
  setServiceForm,
  onService,
  onDeleteService,
  onStartEdit,
  moveService,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  draggedItemIndex,
  onCancelEdit,
  addons = [],
  editingAddonLinks = [],
  setEditingAddonLinks,
}) => {
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatError, setFormatError] = useState('');

  const handleFormatDescription = async () => {
    const raw = (serviceForm.description || '').trim();
    if (!raw) {
      setFormatError('Nejprve napište hrubý text do popisu.');
      return;
    }
    setIsFormatting(true);
    setFormatError('');
    try {
      const res = await fetch('/api/format-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: raw }),
      });
      let data;
      try {
        data = await res.json();
      } catch (_) {
        if (!res.ok) throw new Error(`Chyba ${res.status}. Zkuste to znovu.`);
        throw new Error('Neplatná odpověď serveru. Zkuste to znovu.');
      }
      if (!res.ok) {
        throw new Error(data.error || `Chyba ${res.status}`);
      }
      if (data.formattedMarkdown != null) {
        setServiceForm({ ...serviceForm, description: data.formattedMarkdown });
      }
    } catch (err) {
      const msg = err.message || '';
      const isParseOrPattern = err instanceof SyntaxError || /unexpected token|expected pattern/i.test(msg);
      setFormatError(isParseOrPattern ? 'Formátování není teď k dispozici. Zkuste to později.' : msg || 'Formátování se nepovedlo.');
    } finally {
      setIsFormatting(false);
    }
  };

  return (
  <div className="bg-stone-50/60 rounded-2xl border border-stone-200 p-3 sm:p-5 md:p-8 shadow-sm">
    <h2 className="font-display text-xl mb-1 flex items-center gap-2 text-stone-800">
      <Scissors size={20} className="text-stone-500" />
      Služby
    </h2>
    <p className="text-xs text-stone-500 mb-6">Procedury a ceník – přidávání, úprava pořadí a nastavení upsellů.</p>

    <div className="bg-white p-3 sm:p-5 rounded-xl border border-stone-200 space-y-3 shadow-sm mb-6">
      <h3 className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">
        {editingServiceId ? 'Upravit produkt' : 'Nový produkt / Služba'}
      </h3>
      <input
        type="text"
        placeholder="Název"
        value={serviceForm.name}
        onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
        className="w-full p-3 border rounded-lg text-sm"
      />
      <div>
        <label htmlFor="service-category" className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Kategorie</label>
        <select
          id="service-category"
          value={serviceForm.category ?? 'STANDARD'}
          onChange={(e) => {
            const newCategory = e.target.value;
            const isPmu = newCategory === 'PMU';
            const pmuDurations = ['180', '210', '240', '270'];
            const standardDurations = ['30', '60', '90', '120'];
            const currentDuration = String(serviceForm.duration ?? '60');
            const duration = isPmu
              ? (pmuDurations.includes(currentDuration) ? currentDuration : '180')
              : (standardDurations.includes(currentDuration) ? currentDuration : '60');
            setServiceForm({ ...serviceForm, category: newCategory, duration });
          }}
          className="w-full p-3 border rounded-lg text-sm bg-white"
        >
          <option value="STANDARD">Kosmetika</option>
          <option value="PMU">PMU (permanentní make-up)</option>
        </select>
      </div>
      <div>
        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            placeholder="Cena"
            value={serviceForm.price}
            onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
            className="flex-1 min-w-0 p-3 border rounded-lg text-sm"
          />
          <select
            value={serviceForm.duration}
            onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
            className="flex-1 min-w-0 p-3 border rounded-lg text-sm bg-white"
          >
            {(serviceForm.category || 'STANDARD') === 'PMU' ? (
              <>
                <option value="180">3 h</option>
                <option value="210">3,5 h</option>
                <option value="240">4 h</option>
                <option value="270">4,5 h</option>
              </>
            ) : (
              <>
                <option value="30">30 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
                <option value="120">120 min</option>
              </>
            )}
          </select>
        </div>
        <label data-cena-od className="flex items-center gap-2 mt-2 p-3 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-700 cursor-pointer">
          <input
            type="checkbox"
            checked={!!serviceForm.isStartingPrice}
            onChange={(e) => setServiceForm({ ...serviceForm, isStartingPrice: e.target.checked })}
            className="rounded border-stone-300 w-4 h-4 shrink-0"
          />
          Cena je &quot;od&quot;?
        </label>
      </div>
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Popis služby</label>
          <button
            type="button"
            onClick={handleFormatDescription}
            disabled={isFormatting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            title="Převést hrubý text na luxusní Markdown (AI)"
          >
            {isFormatting ? (
              <Loader2 size={14} className="animate-spin shrink-0" />
            ) : (
              <WandSparkles size={14} className="shrink-0" />
            )}
            <span>AI Vylepšit</span>
          </button>
        </div>
        {formatError && (
          <p className="text-xs text-amber-700 mb-1" role="alert">{formatError}</p>
        )}
        <textarea
          placeholder="Několik vět popisujících proceduru (zobrazí se po rozkliknutí na webu)"
          value={serviceForm.description || ''}
          onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
          rows={4}
          className="w-full p-3 border rounded-lg text-sm resize-y min-h-[80px]"
        />
        <label className="flex items-start gap-2 mt-2 p-3 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-700 cursor-pointer">
          <input
            type="checkbox"
            checked={!!serviceForm.availableForGiftVoucher}
            onChange={(e) => setServiceForm({ ...serviceForm, availableForGiftVoucher: e.target.checked })}
            className="rounded border-stone-300 w-4 h-4 shrink-0 mt-0.5"
          />
          <span>
            <span className="font-medium">Dárkový poukaz</span>
            <span className="block text-xs text-stone-500 mt-0.5">
              Po uložení služby se automaticky zveřejní jako poukaz na webu (a v administraci v Dárkové poukazy). Ruční úpravu stále najdete tam.
            </span>
          </span>
        </label>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={onService}
          className="flex-1 bg-stone-800 text-white py-3 rounded-lg font-bold text-[10px] uppercase shadow-md"
        >
          {editingServiceId ? 'Uložit změny' : '+ Přidat'}
        </button>
        {editingServiceId && (
          <button
            onClick={onCancelEdit}
            className="w-full sm:w-auto px-4 py-3 sm:py-0 bg-stone-100 text-stone-500 rounded-lg font-bold text-[10px] uppercase"
          >
            Zrušit
          </button>
        )}
      </div>
    </div>

    {editingServiceId && setEditingAddonLinks && (
      <div className="bg-stone-50 p-3 sm:p-5 rounded-xl border border-stone-200 space-y-4 shadow-sm mb-6">
        <h3 className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">
          Upsell konfigurace
        </h3>
        <p className="text-xs text-stone-500">
          Přidejte add-ony, které se zákazníkovi nabídnou u této procedury. Přepsaná cena přepíše výchozí cenu add-onu.
        </p>
        <div className="space-y-3">
          {editingAddonLinks.map((row, index) => {
            const selectedAddon = addons.find((a) => a.id === row.addon_id);
            const defaultPrice = selectedAddon?.default_price ?? '';
            return (
              <div
                key={index}
                className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg border border-stone-100"
              >
                <select
                  value={row.addon_id}
                  onChange={(e) =>
                    setEditingAddonLinks(
                      editingAddonLinks.map((r, i) =>
                        i === index ? { ...r, addon_id: e.target.value } : r
                      )
                    )}
                  className="flex-1 min-w-0 sm:min-w-[140px] p-2 border border-stone-200 rounded-lg text-sm bg-white"
                >
                  <option value="">Vyberte add-on...</option>
                  {addons
                    .filter((a) => a.is_active !== false)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.default_price ?? 0} Kč)
                      </option>
                    ))}
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder={defaultPrice ? `Výchozí: ${defaultPrice}` : 'Cena'}
                  value={row.custom_price}
                  onChange={(e) =>
                    setEditingAddonLinks(
                      editingAddonLinks.map((r, i) =>
                        i === index ? { ...r, custom_price: e.target.value } : r
                      )
                    )}
                  className="w-24 p-2 border border-stone-200 rounded-lg text-sm"
                />
                <label className="flex items-center gap-1.5 text-xs text-stone-600 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={!!row.is_recommended}
                    onChange={(e) =>
                      setEditingAddonLinks(
                        editingAddonLinks.map((r, i) =>
                          i === index ? { ...r, is_recommended: e.target.checked } : r
                        )
                      )}
                    className="rounded border-stone-300"
                  />
                  Doporučené
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setEditingAddonLinks(editingAddonLinks.filter((_, i) => i !== index))
                  }
                  className="p-2 text-stone-300 hover:text-red-500"
                  title="Odebrat"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() =>
            setEditingAddonLinks([
              ...editingAddonLinks,
              { addon_id: '', custom_price: '', is_recommended: false },
            ])
          }
          className="w-full bg-stone-200 text-stone-700 py-2 rounded-lg font-bold text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-stone-300 transition-all"
        >
          <Plus size={14} /> Přidat další add-on
        </button>
      </div>
    )}

    <div>
      <h3 className="text-sm font-bold text-stone-700 mb-3">Seznam služeb</h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scroll">
        {services.map((s, index) => (
          <div
            key={s.id}
            className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-white p-3 rounded-lg border border-stone-100 transition-all ${draggedItemIndex === index ? 'opacity-50' : 'opacity-100'}`}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDrop={(e) => onDrop(e, index)}
            style={{ cursor: 'move' }}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex flex-col gap-1 mr-1 md:hidden">
                <button
                  onClick={() => moveService(index, -1)}
                  disabled={index === 0}
                  className="text-stone-400 hover:text-stone-800 disabled:opacity-20 bg-stone-50 p-1 rounded-full border border-stone-200 shadow-sm"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => moveService(index, 1)}
                  disabled={index === services.length - 1}
                  className="text-stone-400 hover:text-stone-800 disabled:opacity-20 bg-stone-50 p-1 rounded-full border border-stone-200 shadow-sm"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="hidden md:block">
                <GripVertical className="text-stone-300" size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-stone-800 truncate">{s.name}</span>
                <div className="flex gap-2 mt-1 flex-wrap items-center">
                  <span className="text-[10px] font-bold text-stone-500">{s.isStartingPrice ? `od ${s.price} Kč` : `${s.price} Kč`}</span>
                  <span className="text-[10px] text-stone-300">{s.duration} min</span>
                  <span className="text-[10px] text-stone-400">
                    {(s.category || 'STANDARD') === 'PMU' ? 'PMU' : 'Kosmetika'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-1 self-end sm:self-auto">
              <button type="button" onClick={() => onStartEdit(s)} className="p-2 text-stone-400 hover:text-stone-800" data-testid="edit-service" aria-label={`Upravit ${s.name}`}>
                <Edit2 size={14} />
              </button>
              <button onClick={() => onDeleteService(s.id)} className="p-2 text-stone-300 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

export default AdminServicesTab;

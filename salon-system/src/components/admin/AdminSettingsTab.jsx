import React from 'react';
import {
  Clock,
  Scissors,
  X,
  Plus,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Utils } from '../../utils/helpers';

const AdminSettingsTab = ({
  adminDateInput,
  setAdminDateInput,
  workStart,
  setWorkStart,
  workEnd,
  setWorkEnd,
  periods,
  onShift,
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
}) => (
  <div className="grid md:grid-cols-2 gap-10">
    <section>
      <h2 className="font-serif text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800">
        <Clock size={18} className="text-stone-400" /> Pracovní doba
      </h2>
      <div className="bg-stone-50 p-6 rounded-xl space-y-6 shadow-inner">
        <input
          type="date"
          value={adminDateInput}
          onChange={(e) => setAdminDateInput(e.target.value)}
          className="w-full p-3 border border-stone-200 rounded-lg outline-none bg-white font-medium"
        />
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Směny:</p>
          {periods.map((p, idx) => (
            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-stone-100 shadow-sm">
              <span className="text-sm font-bold">{p.start} — {p.end}</span>
              <button onClick={() => onShift('remove', idx)} className="text-red-300 hover:text-red-500">
                <X size={16} />
              </button>
            </div>
          ))}
          {periods.length === 0 && <p className="text-xs text-stone-400 italic">Tento den je zavřeno.</p>}
        </div>
        <div className="pt-4 border-t border-stone-200">
          <div className="flex gap-2 items-center mb-4">
            <select
              value={workStart}
              onChange={(e) => setWorkStart(e.target.value)}
              className="p-3 border rounded-lg w-full bg-white text-sm"
            >
              {Utils.generateTimeOptions().map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span>-</span>
            <select
              value={workEnd}
              onChange={(e) => setWorkEnd(e.target.value)}
              className="p-3 border rounded-lg w-full bg-white text-sm"
            >
              {Utils.generateTimeOptions().map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => onShift('add')}
            className="w-full bg-stone-800 text-white py-3 rounded-lg font-bold text-[10px] uppercase shadow-md flex items-center justify-center gap-2 hover:bg-black transition-all"
          >
            <Plus size={14} /> Přidat blok času
          </button>
        </div>
      </div>
    </section>

    <section>
      <h2 className="font-serif text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800">
        <Scissors size={18} className="text-stone-400" /> Správa produktů
      </h2>
      <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3 shadow-sm mb-4">
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
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Cena"
            value={serviceForm.price}
            onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
            className="flex-1 p-3 border rounded-lg text-sm"
          />
          <select
            value={serviceForm.duration}
            onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
            className="flex-1 p-3 border rounded-lg text-sm bg-white"
          >
            <option value="30">30 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
            <option value="120">120 min</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Popis služby</label>
          <textarea
            placeholder="Několik vět popisujících proceduru (zobrazí se po rozkliknutí na webu)"
            value={serviceForm.description || ''}
            onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
            rows={4}
            className="w-full p-3 border rounded-lg text-sm resize-y min-h-[80px]"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onService}
            className="flex-1 bg-stone-800 text-white py-3 rounded-lg font-bold text-[10px] uppercase shadow-md"
          >
            {editingServiceId ? 'Uložit změny' : '+ Přidat'}
          </button>
          {editingServiceId && (
            <button
              onClick={onCancelEdit}
              className="px-4 bg-stone-100 text-stone-500 rounded-lg font-bold text-[10px] uppercase"
            >
              Zrušit
            </button>
          )}
        </div>
      </div>

      {editingServiceId && setEditingAddonLinks && (
        <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 space-y-4 shadow-sm mb-4">
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
                    className="flex-1 min-w-[140px] p-2 border border-stone-200 rounded-lg text-sm bg-white"
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

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scroll">
        {services.map((s, index) => (
          <div
            key={s.id}
            className={`flex justify-between items-center bg-stone-50 p-3 rounded-lg group border border-stone-100 transition-all ${draggedItemIndex === index ? 'opacity-50' : 'opacity-100'}`}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDrop={(e) => onDrop(e, index)}
            style={{ cursor: 'move' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1 mr-1 md:hidden">
                <button
                  onClick={() => moveService(index, -1)}
                  disabled={index === 0}
                  className="text-stone-400 hover:text-stone-800 disabled:opacity-20 bg-white p-1 rounded-full border border-stone-200 shadow-sm"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => moveService(index, 1)}
                  disabled={index === services.length - 1}
                  className="text-stone-400 hover:text-stone-800 disabled:opacity-20 bg-white p-1 rounded-full border border-stone-200 shadow-sm"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="hidden md:block">
                <GripVertical className="text-stone-300" size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-stone-800">{s.name}</span>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] font-bold text-stone-500">{s.price} Kč</span>
                  <span className="text-[10px] text-stone-300">{s.duration} min</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onStartEdit(s)} className="p-2 text-stone-400 hover:text-stone-800">
                <Edit2 size={14} />
              </button>
              <button onClick={() => onDeleteService(s.id)} className="p-2 text-stone-300 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

export default AdminSettingsTab;

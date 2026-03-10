import React, { useState, useEffect } from 'react';
import { Gift, Plus, Edit2, Trash2 } from 'lucide-react';
import { VOUCHER_TYPES } from '../../constants/config';
import VoucherFormModal from './VoucherFormModal';

export default function AdminVouchersTab({
  voucherTemplates = [],
  services = [],
  onSave,
  onDelete,
  onToggleActive,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [overrideActive, setOverrideActive] = useState({});

  // Clear optimistic override when Firestore syncs (server state matches)
  useEffect(() => {
    setOverrideActive((prev) => {
      const next = { ...prev };
      voucherTemplates.forEach((v) => {
        if (next[v.id] !== undefined && (v.is_active !== false) === next[v.id]) {
          delete next[v.id];
        }
      });
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, [voucherTemplates]);

  const handleAddNew = () => {
    setEditingVoucher(null);
    setModalOpen(true);
  };

  const handleEdit = (v) => {
    setEditingVoucher(v);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingVoucher(null);
  };

  const handleSubmit = (payload) => {
    onSave(payload, editingVoucher?.id);
  };

  const handleToggle = (id) => {
    const v = voucherTemplates.find((t) => t.id === id);
    if (!v) return;
    const next = !(overrideActive[id] ?? v.is_active !== false);
    setOverrideActive((prev) => ({ ...prev, [id]: next }));
    onToggleActive(id, next);
  };

  const displayActive = (v) => overrideActive[v.id] ?? (v.is_active !== false);
  const typeLabel = (type) => (type === VOUCHER_TYPES.SERVICE ? 'Služba' : 'Hodnota');

  return (
    <div className="bg-stone-50/60 rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl mb-1 flex items-center gap-2 text-stone-800">
            <Gift size={20} className="text-stone-500" />
            Dárkové poukazy
          </h2>
          <p className="text-xs text-stone-500">
            Vytváření a správa poukazů – hodnotové nebo navázané na konkrétní službu.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddNew}
          className="skin-accent px-4 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 shadow-sm hover:opacity-95 self-start sm:self-center"
        >
          <Plus size={16} /> Nový poukaz
        </button>
      </div>

      {voucherTemplates.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-10 text-center">
          <p className="text-stone-500 mb-4">Zatím nemáte vytvořené žádné dárkové poukazy.</p>
          <button
            type="button"
            onClick={handleAddNew}
            className="skin-accent px-5 py-2.5 rounded-lg text-sm font-bold uppercase inline-flex items-center gap-2"
          >
            <Plus size={18} /> Vytvořit první poukaz
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80">
                  <th className="px-4 py-3 font-semibold text-stone-700">Název</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Typ</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Cena</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Stav</th>
                  <th className="px-4 py-3 font-semibold text-stone-700 text-right">Akce</th>
                </tr>
              </thead>
              <tbody>
                {voucherTemplates.map((v) => (
                  <tr key={v.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                    <td className="px-4 py-3 font-medium text-stone-800">{v.name}</td>
                    <td className="px-4 py-3 text-stone-600">{typeLabel(v.type)}</td>
                    <td className="px-4 py-3 text-stone-600">{v.price != null ? `${v.price} Kč` : '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={displayActive(v)}
                        aria-label={displayActive(v) ? 'Aktivní – vypnout' : 'Neaktivní – zapnout'}
                        onClick={() => handleToggle(v.id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-1 ${
                          displayActive(v) ? 'bg-stone-800 border-stone-800' : 'bg-stone-200 border-stone-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            displayActive(v) ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => handleEdit(v)}
                          className="p-2 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100"
                          aria-label={`Upravit ${v.name}`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(v.id)}
                          className="p-2 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                          aria-label={`Smazat ${v.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <VoucherFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingVoucher={editingVoucher}
        services={services}
      />
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { Gift, Plus, Edit2, Trash2, Banknote, Package } from 'lucide-react';
import { VOUCHER_TYPES, VOUCHER_VALUE_CUSTOM_MIN_KC } from '../../constants/config';
import { normalizeVoucherType } from '../../utils/voucherHelpers';
import VoucherFormModal from './VoucherFormModal';

function VoucherTable({
  vouchers,
  typeLabel,
  displayActive,
  onToggle,
  onEdit,
  onDelete,
}) {
  if (vouchers.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <div className="md:hidden space-y-2 p-3">
        {vouchers.map((v) => (
          <div key={v.id} className="rounded-lg border border-stone-200 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium text-stone-800">{v.name}</div>
                <div className="text-xs text-stone-500 mt-0.5">{typeLabel(v.type)}</div>
                <div className="text-xs text-stone-600 mt-1">
                  {v.is_custom_amount
                    ? `od ${v.price ?? '—'} Kč (vlastní)`
                    : v.price != null
                      ? `${v.price} Kč`
                      : '—'}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={displayActive(v)}
                aria-label={displayActive(v) ? 'Aktivní – vypnout' : 'Neaktivní – zapnout'}
                onClick={() => onToggle(v.id)}
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
            </div>
            <div className="mt-2 flex justify-end gap-1">
              <button
                type="button"
                onClick={() => onEdit(v)}
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
          </div>
        ))}
      </div>
      <table className="hidden md:table w-full text-left text-sm">
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
          {vouchers.map((v) => (
            <tr key={v.id} className="border-b border-stone-100 hover:bg-stone-50/50">
              <td className="px-4 py-3 font-medium text-stone-800">{v.name}</td>
              <td className="px-4 py-3 text-stone-600">{typeLabel(v.type)}</td>
              <td className="px-4 py-3 text-stone-600">
                {v.is_custom_amount
                  ? `od ${v.price ?? '—'} Kč (vlastní)`
                  : v.price != null
                    ? `${v.price} Kč`
                    : '—'}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={displayActive(v)}
                  aria-label={displayActive(v) ? 'Aktivní – vypnout' : 'Neaktivní – zapnout'}
                  onClick={() => onToggle(v.id)}
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
                    onClick={() => onEdit(v)}
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
  );
}

export default function AdminVouchersTab({
  voucherTemplates = [],
  services = [],
  onSave,
  onDelete,
  onToggleActive,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [createPreset, setCreatePreset] = useState('value');
  const [overrideActive, setOverrideActive] = useState({});

  const valueVouchers = useMemo(
    () => voucherTemplates.filter((v) => normalizeVoucherType(v.type) !== VOUCHER_TYPES.SERVICE),
    [voucherTemplates]
  );
  const productVouchers = useMemo(
    () => voucherTemplates.filter((v) => normalizeVoucherType(v.type) === VOUCHER_TYPES.SERVICE),
    [voucherTemplates]
  );

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

  const openCreate = (preset) => {
    setEditingVoucher(null);
    setCreatePreset(preset);
    setModalOpen(true);
  };

  const handleEdit = (v) => {
    setEditingVoucher(v);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingVoucher(null);
    setCreatePreset('value');
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
  const typeLabel = (type) =>
    normalizeVoucherType(type) === VOUCHER_TYPES.SERVICE ? 'Produkt' : 'Hodnota';

  const hasAny = voucherTemplates.length > 0;

  return (
    <div className="bg-stone-50/60 rounded-2xl border border-stone-200 p-3 sm:p-5 md:p-8 shadow-sm space-y-6 sm:space-y-10">
      <div>
        <h2 className="font-display text-xl mb-1 flex items-center gap-2 text-stone-800">
          <Gift size={20} className="text-stone-500" />
          Dárkové poukazy
        </h2>
        <p className="text-xs text-stone-500">
          Hodnotové poukazy (pevná částka nebo jeden řádek „vlastní částka“) a produktové (navázané na službu z
          ceníku).
        </p>
      </div>

      {/* Hodnotové */}
      <section className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 p-3 sm:p-5 border-b border-stone-100 bg-stone-50/50">
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-stone-100 text-stone-600 shrink-0">
              <Banknote size={20} />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-stone-800">Hodnotové poukazy</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                U nového hodnotového poukazu lze zaškrtnout, že zákazník zadá částku sám (min. {VOUCHER_VALUE_CUSTOM_MIN_KC}{' '}
                Kč).
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openCreate('value')}
              className="skin-accent px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 shadow-sm hover:opacity-95"
            >
              <Plus size={14} /> Hodnotový poukaz
            </button>
          </div>
        </div>
        <div className="p-0">
          {valueVouchers.length === 0 ? (
            <p className="text-sm text-stone-500 px-5 py-8 text-center">
              Žádné hodnotové poukazy. Přidejte řádek výše (včetně volby vlastní částky v dialogu).
            </p>
          ) : (
            <VoucherTable
              vouchers={valueVouchers}
              typeLabel={typeLabel}
              displayActive={displayActive}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={onDelete}
            />
          )}
        </div>
      </section>

      {/* Produktové */}
      <section className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 p-3 sm:p-5 border-b border-stone-100 bg-stone-50/50">
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-stone-100 text-stone-600 shrink-0">
              <Package size={20} />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-stone-800">Produktové poukazy</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Konkrétní služba z ceníku (včetně automaticky ze služeb označených jako dárkový poukaz).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openCreate('service')}
            className="skin-accent px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 shadow-sm hover:opacity-95 self-start"
          >
            <Plus size={14} /> Produktový poukaz
          </button>
        </div>
        <div className="p-0">
          {productVouchers.length === 0 ? (
            <p className="text-sm text-stone-500 px-5 py-8 text-center">
              Žádné produktové poukazy. Přidejte ručně nebo označte službu u popisu v záložce Služby.
            </p>
          ) : (
            <VoucherTable
              vouchers={productVouchers}
              typeLabel={typeLabel}
              displayActive={displayActive}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={onDelete}
            />
          )}
        </div>
      </section>

      {!hasAny && (
        <p className="text-center text-xs text-stone-400">
          Celkově zatím nemáte žádné šablony – použijte tlačítka v sekcích výše.
        </p>
      )}

      <VoucherFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingVoucher={editingVoucher}
        services={services}
        createPreset={editingVoucher ? 'value' : createPreset}
      />
    </div>
  );
}

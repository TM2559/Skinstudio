import React, { useState, useCallback } from 'react';
import { ShoppingBag } from 'lucide-react';
import { callUpdateVoucherOrderStatus } from '../../firebaseConfig';
import { useToastContext } from '../../contexts/ToastContext';

const STATUS_OPTIONS = [
  { value: 'new', label: 'Objednáno', className: 'bg-stone-200 text-stone-700' },
  { value: 'ready', label: 'Připraveno', className: 'bg-sky-100 text-sky-800 border border-sky-200' },
  { value: 'completed', label: 'Vyzvednuto', className: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  { value: 'cancelled', label: 'Zrušeno', className: 'bg-red-50 text-red-600 border border-red-200 line-through' },
];

function formatOrderDate(createdAt) {
  if (!createdAt) return '—';
  let d;
  if (typeof createdAt.toDate === 'function') {
    d = createdAt.toDate();
  } else if (createdAt?.seconds != null) {
    d = new Date(createdAt.seconds * 1000);
  } else {
    d = new Date(createdAt);
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${h}:${min}`;
}

function formatPrice(price) {
  if (price == null) return '—';
  const n = Number(price);
  return `${n.toLocaleString('cs-CZ')} Kč`;
}

function formatTargetDate(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return '—';
  const [y, m, d] = isoDate.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

const PACKAGING_LABELS = { envelope: 'Obálka', box: 'Krabička' };

export default function AdminOrdersTab({ voucherOrders = [], voucherTemplates = [] }) {
  const toast = useToastContext();
  const [statusOverride, setStatusOverride] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  const displayStatus = useCallback((order) => {
    const s = statusOverride[order.id] ?? order.status ?? 'new';
    return s === 'pending' ? 'new' : s;
  }, [statusOverride]);

  const handleStatusChange = useCallback(
    async (order, newStatus) => {
      if (newStatus === (order.status ?? 'new')) return;
      const prev = order.status ?? 'new';
      setStatusOverride((s) => ({ ...s, [order.id]: newStatus }));
      setUpdatingId(order.id);
      try {
        const { data } = await callUpdateVoucherOrderStatus({ orderId: order.id, status: newStatus });
        setStatusOverride((s) => {
          const next = { ...s };
          delete next[order.id];
          return next;
        });
        if (data?.smsSent) {
          toast.success('Stav změněn, SMS odeslána.');
        } else {
          toast.success('Stav změněn.');
        }
      } catch (err) {
        setStatusOverride((s) => {
          const next = { ...s };
          delete next[order.id];
          return next;
        });
        toast.error(err.message || 'Změna stavu se nezdařila.');
      } finally {
        setUpdatingId(null);
      }
    },
    [toast]
  );

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-stone-50/60 rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="font-display text-xl mb-1 flex items-center gap-2 text-[#171717]">
          <ShoppingBag size={20} className="text-stone-500" />
          Objednávky poukazů
        </h2>
        <p className="text-xs text-stone-500">
          Přehled objednávek a změna stavu. Při přepnutí na „Připraveno“ se zákazníkovi odešle SMS.
        </p>
      </div>

      {voucherOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-10 text-center">
          <p className="text-stone-500">Zatím nejsou žádné objednávky poukazů.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200" style={{ backgroundColor: '#FAFAFA' }}>
                  <th className="px-4 py-4 font-semibold text-[#171717] whitespace-nowrap">Datum a Čas</th>
                  <th className="px-4 py-4 font-semibold text-[#171717] whitespace-nowrap">Zákazník</th>
                  <th className="px-4 py-4 font-semibold text-[#171717] whitespace-nowrap">Položka</th>
                  <th className="px-4 py-4 font-semibold text-[#171717] whitespace-nowrap">Cena</th>
                  <th className="px-4 py-4 font-semibold text-[#171717] whitespace-nowrap">Termín (Target)</th>
                  <th className="px-4 py-4 font-semibold text-[#171717] whitespace-nowrap">Stav</th>
                </tr>
              </thead>
              <tbody>
                {voucherOrders.map((order) => {
                  const voucher = voucherTemplates.find((t) => t.id === order.voucher_id);
                  const voucherName = voucher?.name ?? order.voucher_id ?? '—';
                  const packagingLabel = PACKAGING_LABELS[order.packaging] ?? order.packaging ?? '';
                  const itemLabel = packagingLabel ? `${voucherName} | ${packagingLabel}` : voucherName;
                  const status = displayStatus(order);
                  const isTargetToday = order.target_pickup_date === todayIso;
                  const isNewAndTargetToday = (order.status ?? 'new') === 'new' && isTargetToday;
                  const isUpdating = updatingId === order.id;

                  return (
                    <tr key={order.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                      <td className="px-4 py-4 text-[#171717] whitespace-nowrap">{formatOrderDate(order.created_at)}</td>
                      <td className="px-4 py-4">
                        <div className="text-[#171717] font-medium">{order.contact_phone ?? '—'}</div>
                        {order.contact_email && (
                          <div className="text-xs mt-0.5" style={{ color: '#737373' }}>
                            {order.contact_email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-[#171717]">{itemLabel}</td>
                      <td className="px-4 py-4 text-[#171717] whitespace-nowrap">{formatPrice(order.total_price)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={isNewAndTargetToday ? 'text-red-600 font-medium' : 'text-[#171717]'}>
                          {formatTargetDate(order.target_pickup_date)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(order, e.target.value)}
                          disabled={isUpdating}
                          className="text-sm border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-[#171717] focus:ring-1 focus:ring-stone-400 focus:outline-none disabled:opacity-60 min-w-[140px]"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {isUpdating && (
                          <span className="ml-2 text-xs text-stone-400">ukládám…</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

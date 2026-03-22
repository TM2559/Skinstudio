import React, { useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { callUpdateVoucherOrderStatus } from '../../firebaseConfig';
import { useToastContext } from '../../contexts/ToastContext';

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nová' },
  { value: 'ready', label: 'Připraveno' },
  { value: 'completed', label: 'Vyzvednuto' },
  { value: 'cancelled', label: 'Zrušeno' },
];

function packagingLabel(p) {
  if (p === 'box') return 'Krabička';
  if (p === 'envelope') return 'Obálka';
  return p || '—';
}

function formatDate(iso) {
  if (!iso || typeof iso !== 'string') return '—';
  const d = new Date(iso + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCreated(ts) {
  if (!ts) return '—';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

export default function AdminOrdersTab({ voucherOrders = [], voucherTemplates = [] }) {
  const toast = useToastContext();
  const [updatingId, setUpdatingId] = useState(null);

  const templateNameById = useMemo(() => {
    const m = {};
    voucherTemplates.forEach((t) => {
      m[t.id] = t.name || t.id;
    });
    return m;
  }, [voucherTemplates]);

  const handleStatusChange = async (orderId, nextStatus) => {
    setUpdatingId(orderId);
    try {
      const { data } = await callUpdateVoucherOrderStatus({ orderId, status: nextStatus });
      if (data?.smsSent) {
        toast.success('Stav uložen. Zákazníkovi byla odeslána SMS.');
      } else {
        toast.success('Stav objednávky byl uložen.');
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'Nepodařilo se změnit stav.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-stone-50/60 rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="font-display text-xl mb-1 flex items-center gap-2 text-stone-800">
          <ShoppingBag size={20} className="text-stone-500" />
          Objednávky poukazů
        </h2>
        <p className="text-xs text-stone-500">
          Přehled objednávek k vyzvednutí v salonu. Při přechodu na „Připraveno“ může zákazník dostat SMS.
        </p>
      </div>

      {voucherOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-10 text-center text-stone-500 text-sm">
          Zatím žádné objednávky poukazů.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                <th className="px-3 py-3 font-semibold text-stone-700">Vytvořeno</th>
                <th className="px-3 py-3 font-semibold text-stone-700">Poukaz</th>
                <th className="px-3 py-3 font-semibold text-stone-700">Balení</th>
                <th className="px-3 py-3 font-semibold text-stone-700">Vyzvednutí</th>
                <th className="px-3 py-3 font-semibold text-stone-700">Kontakt</th>
                <th className="px-3 py-3 font-semibold text-stone-700">Částka</th>
                <th className="px-3 py-3 font-semibold text-stone-700">Stav</th>
              </tr>
            </thead>
            <tbody>
              {voucherOrders.map((o) => (
                <tr key={o.id} className="border-b border-stone-100 hover:bg-stone-50/50 align-top">
                  <td className="px-3 py-3 text-stone-600 whitespace-nowrap">{formatCreated(o.created_at)}</td>
                  <td className="px-3 py-3 font-medium text-stone-800">
                    {templateNameById[o.voucher_id] || o.voucher_id || '—'}
                  </td>
                  <td className="px-3 py-3 text-stone-600">{packagingLabel(o.packaging)}</td>
                  <td className="px-3 py-3 text-stone-600 whitespace-nowrap">{formatDate(o.target_pickup_date)}</td>
                  <td className="px-3 py-3 text-stone-600 text-xs">
                    <div>{o.contact_phone || '—'}</div>
                    <div className="text-stone-500 truncate max-w-[200px]" title={o.contact_email}>
                      {o.contact_email || '—'}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-stone-800 font-medium whitespace-nowrap">
                    {o.total_price != null ? `${o.total_price} Kč` : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={o.status || 'new'}
                      disabled={updatingId === o.id}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="text-sm border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-800 max-w-[140px] disabled:opacity-60"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ShoppingBag, Pencil } from 'lucide-react';
import { callUpdateVoucherOrderStatus, callUpdateVoucherOrder } from '../../firebaseConfig';
import { useToastContext } from '../../contexts/ToastContext';

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nová' },
  { value: 'ready', label: 'Připraveno' },
  { value: 'completed', label: 'Vyzvednuto' },
  { value: 'cancelled', label: 'Zrušeno' },
];

const STATUS_LABELS = {
  new: 'Nová',
  ready: 'Připraveno',
  completed: 'Vyzvednuto',
  cancelled: 'Zrušeno',
  pending: 'Čekající',
};

const SMS_SKIP_LABELS = {
  bulkgate_not_configured: 'SMS brána není nastavena',
  missing_phone: 'chybí telefon',
  invalid_phone: 'neplatné číslo',
  send_failed: 'odeslání selhalo',
};

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

function formatActivityAt(at) {
  if (!at) return '—';
  try {
    const d = at.toDate ? at.toDate() : new Date(at);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function describeActivity(entry) {
  const k = entry?.kind;
  if (k === 'order_created') {
    return 'Objednávka zaznamenána.';
  }
  if (k === 'emails_confirmation') {
    if (entry.error) {
      return `Potvrzovací e-maily: chyba (${entry.error}).`;
    }
    const c = entry.client_ok ? 'zákazník odeslán' : 'zákazník neodeslán';
    const a = entry.admin_ok ? 'přehled salonu odeslán' : 'přehled salonu neodeslán';
    return `Potvrzovací e-maily: ${c}, ${a}.`;
  }
  if (k === 'sms_order_confirmation') {
    if (entry.skipped) {
      if (entry.reason === 'bulkgate_not_configured') return 'SMS potvrzení objednávky: přeskočeno (SMS brána není nastavena).';
      if (entry.reason === 'invalid_phone') return 'SMS potvrzení objednávky: přeskočeno (neplatné číslo).';
      return 'SMS potvrzení objednávky: přeskočeno.';
    }
    if (entry.error) {
      return `SMS potvrzení objednávky: chyba (${entry.error}).`;
    }
    return entry.ok
      ? 'SMS s potvrzením objednávky odeslána.'
      : 'SMS s potvrzením objednávky se nepodařila odeslat.';
  }
  if (k === 'status_change') {
    const from = STATUS_LABELS[entry.from] || entry.from || '—';
    const to = STATUS_LABELS[entry.to] || entry.to || '—';
    let s = `Změna stavu: ${from} → ${to}.`;
    const toReady = entry.to === 'ready';
    const fromNewish = entry.from === 'new' || entry.from === 'pending';
    if (toReady && fromNewish) {
      if (entry.sms_ready_sent) {
        s += ' Odeslána SMS o připraveném poukazu k vyzvednutí.';
      } else if (entry.sms_ready_skipped) {
        const why = SMS_SKIP_LABELS[entry.sms_ready_skipped] || entry.sms_ready_skipped;
        s += ` SMS o připraveném poukazu neodeslána (${why}).`;
      }
    }
    return s;
  }
  return null;
}

function normalizeActivityLog(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return [...raw].sort((a, b) => {
    const ta = a?.at?.toMillis?.() ?? 0;
    const tb = b?.at?.toMillis?.() ?? 0;
    return ta - tb;
  });
}

/** Vyhodnotí stav SMS brány ze všech activity_log záznamů. */
function getSmsGatewayStatus(orders) {
  let hasSkipped = false;
  let hasSent = false;
  for (const order of orders) {
    const log = order.activity_log;
    if (!Array.isArray(log)) continue;
    for (const entry of log) {
      if (entry?.kind === 'status_change') {
        if (entry.sms_ready_skipped === 'bulkgate_not_configured') hasSkipped = true;
        if (entry.sms_ready_sent === true) hasSent = true;
      }
    }
  }
  if (hasSkipped) return 'warning';
  if (hasSent) return 'ok';
  return 'neutral';
}

function SmsBadge({ status }) {
  if (status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        SMS brána aktivní
      </span>
    );
  }
  if (status === 'warning') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        SMS brána není nastavena
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-500 bg-stone-100 border border-stone-200 rounded-full px-2.5 py-0.5">
      <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
      SMS brána – bez dat
    </span>
  );
}

export default function AdminOrdersTab({ voucherOrders = [], voucherTemplates = [] }) {
  const toast = useToastContext();
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingId, setSavingId] = useState(null);

  // Filtrace / řazení
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortMode, setSortMode] = useState('newest');

  const templateNameById = useMemo(() => {
    const m = {};
    voucherTemplates.forEach((t) => {
      m[t.id] = t.name || t.id;
    });
    return m;
  }, [voucherTemplates]);

  const smsStatus = useMemo(() => getSmsGatewayStatus(voucherOrders), [voucherOrders]);

  const filteredOrders = useMemo(() => {
    let list = [...voucherOrders];

    // Textové vyhledávání
    const q = searchText.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        const name = (templateNameById[o.voucher_id] || o.voucher_id || '').toLowerCase();
        const phone = (o.contact_phone || '').toLowerCase();
        const email = (o.contact_email || '').toLowerCase();
        const id = (o.id || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || email.includes(q) || id.includes(q);
      });
    }

    // Filtr stavu
    if (filterStatus) {
      list = list.filter((o) => (o.status || 'new') === filterStatus);
    }

    // Řazení
    list.sort((a, b) => {
      const getMs = (o) => {
        if (!o.created_at) return 0;
        try {
          return o.created_at.toDate ? o.created_at.toDate().getTime() : new Date(o.created_at).getTime();
        } catch {
          return 0;
        }
      };
      if (sortMode === 'newest') return getMs(b) - getMs(a);
      if (sortMode === 'oldest') return getMs(a) - getMs(b);
      if (sortMode === 'price_desc') return (b.total_price ?? 0) - (a.total_price ?? 0);
      if (sortMode === 'price_asc') return (a.total_price ?? 0) - (b.total_price ?? 0);
      return 0;
    });

    return list;
  }, [voucherOrders, searchText, filterStatus, sortMode, templateNameById]);

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

  const openEdit = (order) => {
    setEditingId(order.id);
    setEditForm({
      contactPhone: order.contact_phone || '',
      contactEmail: order.contact_email || '',
      targetPickupDate: order.target_pickup_date || '',
      packaging: order.packaging || 'envelope',
    });
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditSave = async (orderId) => {
    setSavingId(orderId);
    try {
      await callUpdateVoucherOrder({
        orderId,
        contactPhone: editForm.contactPhone,
        contactEmail: editForm.contactEmail,
        targetPickupDate: editForm.targetPickupDate,
        packaging: editForm.packaging,
      });
      toast.success('Objednávka byla uložena.');
      closeEdit();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'Nepodařilo se uložit objednávku.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="bg-stone-50/60 rounded-2xl border border-stone-200 p-3 sm:p-5 md:p-8 shadow-sm">
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap mb-1">
          <h2 className="font-display text-xl flex items-center gap-2 text-stone-800">
            <ShoppingBag size={20} className="text-stone-500" />
            Objednávky poukazů
          </h2>
          <SmsBadge status={smsStatus} />
        </div>
        <p className="text-xs text-stone-500">
          Přehled objednávek k vyzvednutí v salonu. Při přechodu na „Připraveno" může zákazník dostat SMS. Níže u
          každé objednávky je historie stavů a odeslaných zpráv.
        </p>
      </div>

      {/* Filtrace a řazení */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <input
          type="search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Hledat (jméno, telefon, e-mail, ID)…"
          className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-800 placeholder:text-stone-400 min-w-0 w-full sm:min-w-[220px] flex-1"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-800 w-full sm:w-auto"
        >
          <option value="">Všechny stavy</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          className="text-sm border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-800 w-full sm:w-auto"
        >
          <option value="newest">Nejnovější</option>
          <option value="oldest">Nejstarší</option>
          <option value="price_desc">Cena ↓</option>
          <option value="price_asc">Cena ↑</option>
        </select>
      </div>

      {voucherOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-10 text-center text-stone-500 text-sm">
          Zatím žádné objednávky poukazů.
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-10 text-center text-stone-500 text-sm">
          Žádné objednávky neodpovídají filtru.
        </div>
      ) : (
        <>
        <div className="md:hidden space-y-3">
          {filteredOrders.map((o) => {
            const log = normalizeActivityLog(o.activity_log);
            const open = expandedId === o.id;
            const editing = editingId === o.id;
            return (
              <div key={o.id} className="bg-white rounded-xl border border-stone-200 p-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs text-stone-500">{formatCreated(o.created_at)}</div>
                    <div className="text-sm font-semibold text-stone-800">
                      {o.is_custom_amount || (o.custom_amount_kc != null && !o.voucher_id)
                        ? `Vlastní hodnota (${o.custom_amount_kc != null ? `${o.custom_amount_kc} Kč` : '—'})`
                        : templateNameById[o.voucher_id] || o.voucher_id || '—'}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {packagingLabel(o.packaging)} • {formatDate(o.target_pickup_date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : o.id)}
                      className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                      aria-expanded={open}
                    >
                      {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => editing ? closeEdit() : openEdit(o)}
                      className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-stone-600">
                  <div>{o.contact_phone || '—'}</div>
                  <div className="break-all">{o.contact_email || '—'}</div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-stone-800">{o.total_price != null ? `${o.total_price} Kč` : '—'}</span>
                  <select
                    value={o.status || 'new'}
                    disabled={updatingId === o.id}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                    className="text-sm border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-800 disabled:opacity-60"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {editing && (
                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <input
                      type="text"
                      value={editForm.contactPhone}
                      onChange={(e) => setEditForm((f) => ({ ...f, contactPhone: e.target.value }))}
                      placeholder="Telefon"
                      className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm bg-white text-stone-800"
                    />
                    <input
                      type="text"
                      value={editForm.contactEmail}
                      onChange={(e) => setEditForm((f) => ({ ...f, contactEmail: e.target.value }))}
                      placeholder="E-mail"
                      className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm bg-white text-stone-800"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={editForm.targetPickupDate}
                        onChange={(e) => setEditForm((f) => ({ ...f, targetPickupDate: e.target.value }))}
                        className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm bg-white text-stone-800"
                      />
                      <select
                        value={editForm.packaging}
                        onChange={(e) => setEditForm((f) => ({ ...f, packaging: e.target.value }))}
                        className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm bg-white text-stone-800"
                      >
                        <option value="envelope">Obálka</option>
                        <option value="box">Krabička</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditSave(o.id)}
                        disabled={savingId === o.id}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-60"
                      >
                        {savingId === o.id ? 'Ukládám…' : 'Uložit'}
                      </button>
                      <button
                        type="button"
                        onClick={closeEdit}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                      >
                        Zrušit
                      </button>
                    </div>
                  </div>
                )}
                {open && (
                  <div className="text-xs text-stone-600 bg-stone-50 rounded-lg border border-stone-100 p-2">
                    <div className="font-semibold text-stone-700 mb-2">Historie objednávky a zpráv</div>
                    {log.length === 0 ? (
                      <p className="text-stone-500 italic">Bez historie.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {log.map((entry, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-stone-400 shrink-0">{formatActivityAt(entry.at)}</span>
                            <span>{describeActivity(entry) || 'Událost v systému.'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="hidden md:block bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[820px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                <th className="px-2 py-3 w-10 font-semibold text-stone-700" aria-label="Historie" />
                <th className="px-2 py-3 w-10 font-semibold text-stone-700" aria-label="Editace" />
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
              {filteredOrders.map((o) => {
                const log = normalizeActivityLog(o.activity_log);
                const open = expandedId === o.id;
                const editing = editingId === o.id;
                return (
                  <React.Fragment key={o.id}>
                    <tr className="border-b border-stone-100 hover:bg-stone-50/50 align-top">
                      {/* Rozbalení historie */}
                      <td className="px-2 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => setExpandedId(open ? null : o.id)}
                          className="p-1 rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                          aria-expanded={open}
                          aria-label={open ? 'Skrýt historii' : 'Zobrazit historii'}
                        >
                          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                      </td>
                      {/* Editace */}
                      <td className="px-2 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => editing ? closeEdit() : openEdit(o)}
                          className="p-1 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                          aria-label="Editovat objednávku"
                        >
                          <Pencil size={15} />
                        </button>
                      </td>
                      <td className="px-3 py-3 text-stone-600 whitespace-nowrap">{formatCreated(o.created_at)}</td>
                      <td className="px-3 py-3 font-medium text-stone-800">
                        {o.is_custom_amount || (o.custom_amount_kc != null && !o.voucher_id)
                          ? `Vlastní hodnota (${o.custom_amount_kc != null ? `${o.custom_amount_kc} Kč` : '—'})`
                          : templateNameById[o.voucher_id] || o.voucher_id || '—'}
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

                    {/* Inline editace */}
                    {editing && (
                      <tr className="border-b border-stone-100 bg-amber-50/40">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="font-semibold text-stone-700 text-xs mb-3">Editace objednávky</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <label className="flex flex-col gap-1 text-xs text-stone-600">
                              Telefon
                              <input
                                type="text"
                                value={editForm.contactPhone}
                                onChange={(e) => setEditForm((f) => ({ ...f, contactPhone: e.target.value }))}
                                className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-300"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-stone-600">
                              E-mail
                              <input
                                type="text"
                                value={editForm.contactEmail}
                                onChange={(e) => setEditForm((f) => ({ ...f, contactEmail: e.target.value }))}
                                className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-300"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-stone-600">
                              Datum vyzvednutí
                              <input
                                type="date"
                                value={editForm.targetPickupDate}
                                onChange={(e) => setEditForm((f) => ({ ...f, targetPickupDate: e.target.value }))}
                                className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-300"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-stone-600">
                              Balení
                              <select
                                value={editForm.packaging}
                                onChange={(e) => setEditForm((f) => ({ ...f, packaging: e.target.value }))}
                                className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-300"
                              >
                                <option value="envelope">Obálka</option>
                                <option value="box">Krabička</option>
                              </select>
                            </label>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => handleEditSave(o.id)}
                              disabled={savingId === o.id}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-60"
                            >
                              {savingId === o.id ? 'Ukládám…' : 'Uložit'}
                            </button>
                            <button
                              type="button"
                              onClick={closeEdit}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                            >
                              Zrušit
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Historie */}
                    {open && (
                      <tr className="border-b border-stone-100 bg-stone-50/70">
                        <td colSpan={9} className="px-4 py-3 text-xs text-stone-600">
                          <div className="font-semibold text-stone-700 mb-2">Historie objednávky a zpráv</div>
                          {log.length === 0 ? (
                            <p className="text-stone-500 italic">
                              U této objednávky není uložená historie (starší záznamy před rozšířením administrace).
                            </p>
                          ) : (
                            <ul className="space-y-2 list-none pl-0">
                              {log.map((entry, idx) => {
                                const text = describeActivity(entry);
                                return (
                                  <li key={idx} className="flex gap-2">
                                    <span className="text-stone-400 shrink-0 whitespace-nowrap">
                                      {formatActivityAt(entry.at)}
                                    </span>
                                    <span>{text || 'Událost v systému.'}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}

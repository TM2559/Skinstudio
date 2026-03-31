import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { VOUCHER_TYPES, VOUCHER_VALUE_CUSTOM_MIN_KC } from '../../constants/config';

const initialForm = {
  type: VOUCHER_TYPES.VALUE,
  service_id: '',
  name: '',
  description: '',
  price: '',
  is_active: true,
  is_custom_amount: false,
};

export default function VoucherFormModal({
  open,
  onClose,
  onSubmit,
  editingVoucher,
  services = [],
  /** Při vytváření: 'value' | 'service' */
  createPreset = 'value',
}) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setErrors({});
      return;
    }
    if (editingVoucher) {
      setForm({
        type: editingVoucher.type || VOUCHER_TYPES.VALUE,
        service_id: editingVoucher.service_id || '',
        name: editingVoucher.name || '',
        description: editingVoucher.description || '',
        price: editingVoucher.price != null ? String(editingVoucher.price) : '',
        is_active: editingVoucher.is_active !== false,
        is_custom_amount: !!editingVoucher.is_custom_amount,
      });
    } else {
      const next = { ...initialForm };
      if (createPreset === 'service') {
        next.type = VOUCHER_TYPES.SERVICE;
      } else {
        next.type = VOUCHER_TYPES.VALUE;
      }
      setForm(next);
    }
    setErrors({});
  }, [open, editingVoucher, createPreset]);

  const handleServiceSelect = (serviceId) => {
    if (!serviceId) {
      setForm((prev) => ({ ...prev, service_id: '', name: prev.name, price: prev.price }));
      return;
    }
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      setForm((prev) => ({
        ...prev,
        service_id: serviceId,
        name: prev.name || service.name,
        price: prev.price !== '' ? prev.price : String(service.price ?? ''),
      }));
    }
  };

  const valueMinKc = useMemo(() => {
    if (form.type !== VOUCHER_TYPES.VALUE) return 1;
    if (form.is_custom_amount) return VOUCHER_VALUE_CUSTOM_MIN_KC;
    return 1;
  }, [form.type, form.is_custom_amount]);

  const validate = () => {
    const next = {};
    if (!(form.name || '').trim()) next.name = 'Název je povinný';
    const priceNum = parseInt(form.price, 10);
    if (form.type === VOUCHER_TYPES.VALUE) {
      if (form.price === '' || isNaN(priceNum) || priceNum < valueMinKc) {
        next.price =
          valueMinKc >= VOUCHER_VALUE_CUSTOM_MIN_KC
            ? `Částka musí být alespoň ${VOUCHER_VALUE_CUSTOM_MIN_KC} Kč`
            : 'Cena musí být větší než 0';
      }
    } else if (form.price === '' || isNaN(priceNum) || priceNum <= 0) {
      next.price = 'Cena musí být větší než 0';
    }
    if (form.type === VOUCHER_TYPES.SERVICE && !form.service_id) {
      next.service_id = 'Vyberte službu';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const category =
      form.type === VOUCHER_TYPES.VALUE
        ? 'value'
        : (() => {
            const svc = services.find((s) => s.id === form.service_id);
            return svc && (svc.category || '').toUpperCase() === 'PMU' ? 'pmu' : 'cosmetics';
          })();
    const payload = {
      type: form.type,
      service_id: form.type === VOUCHER_TYPES.SERVICE ? form.service_id : null,
      category,
      name: form.name.trim(),
      description: (form.description || '').trim(),
      price: parseInt(form.price, 10),
      is_active: !!form.is_active,
      is_custom_amount: form.type === VOUCHER_TYPES.VALUE && !!form.is_custom_amount,
    };
    setIsSubmitting(true);
    try {
      const result = onSubmit(payload);
      if (result && typeof result.then === 'function') {
        await result;
      }
      onClose();
    } catch (_) {
      // Chyba se zobrazí v toastu v AdminView, modal zůstane otevřený
    } finally {
      setIsSubmitting(false);
    }
  };

  const isServiceType = form.type === VOUCHER_TYPES.SERVICE;
  /** Služby označené v adminu; při úpravě poukazu doplníme aktuálně navázanou službu, i když už není v nabídce. */
  const activeServices = useMemo(() => {
    const eligible = services.filter((s) => s.availableForGiftVoucher === true);
    if (!isServiceType || !form.service_id) return eligible;
    const linked = services.find((s) => s.id === form.service_id);
    if (linked && !eligible.some((s) => s.id === linked.id)) {
      return [linked, ...eligible];
    }
    return eligible;
  }, [services, isServiceType, form.service_id]);

  if (!open) return null;

  const isService = isServiceType;
  /** Při úpravě lze přepnout typ; při novém záznamu typ určuje tlačítko v administraci. */
  const showTypeRadios = !!editingVoucher;
  const modalTitle = editingVoucher
    ? 'Upravit poukaz'
    : createPreset === 'service'
      ? 'Nový produktový poukaz'
      : 'Nový hodnotový poukaz';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="voucher-form-title"
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <h2 id="voucher-form-title" className="font-display text-lg font-bold text-stone-800">
            {modalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
            aria-label="Zavřít"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {showTypeRadios && (
            <div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-stone-700">
                  Typ poukazu
                  <span className="sr-only"> (povinné)</span>
                </legend>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="voucher-type"
                      value={VOUCHER_TYPES.VALUE}
                      checked={form.type === VOUCHER_TYPES.VALUE}
                      onChange={() =>
                        setForm((prev) => ({
                          ...prev,
                          type: VOUCHER_TYPES.VALUE,
                          service_id: '',
                          is_custom_amount: false,
                        }))
                      }
                      className="rounded-full border-stone-300 text-stone-800 focus:ring-stone-500"
                    />
                    <span className="text-sm text-stone-700">Hodnotový poukaz</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="voucher-type"
                      value={VOUCHER_TYPES.SERVICE}
                      checked={form.type === VOUCHER_TYPES.SERVICE}
                      onChange={() =>
                        setForm((prev) => ({ ...prev, type: VOUCHER_TYPES.SERVICE, is_custom_amount: false }))
                      }
                      className="rounded-full border-stone-300 text-stone-800 focus:ring-stone-500"
                    />
                    <span className="text-sm text-stone-700">Produktová služba</span>
                  </label>
                </div>
              </fieldset>
            </div>
          )}

          {isService && (
            <div>
              <label htmlFor="voucher-service" className="block text-sm font-semibold text-stone-700 mb-1">
                Vyberte službu z ceníku
                <span className="text-red-500"> *</span>
              </label>
              <select
                id="voucher-service"
                value={form.service_id}
                onChange={(e) => handleServiceSelect(e.target.value)}
                className={`w-full p-3 border rounded-lg text-sm bg-white ${errors.service_id ? 'border-red-500' : 'border-stone-200'}`}
                aria-required="true"
                aria-invalid={!!errors.service_id}
                aria-describedby={errors.service_id ? 'voucher-service-error' : undefined}
              >
                <option value="">— Vyberte službu —</option>
                {activeServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.price ?? 0} Kč)
                  </option>
                ))}
              </select>
              {errors.service_id && (
                <p id="voucher-service-error" className="mt-1 text-xs text-red-600" role="alert">
                  {errors.service_id}
                </p>
              )}
              {activeServices.length === 0 && (
                <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Zatím není označena žádná služba. V administraci u služby u popisu zaškrtněte „Dárkový poukaz“.
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="voucher-name" className="block text-sm font-semibold text-stone-700 mb-1">
              Název
              <span className="text-red-500"> *</span>
            </label>
            <input
              id="voucher-name"
              type="text"
              placeholder={isService ? 'Název služby se doplní po výběru' : 'Např. Poukaz na 2000 Kč'}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className={`w-full p-3 border rounded-lg text-sm ${errors.name ? 'border-red-500' : 'border-stone-200'}`}
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'voucher-name-error' : undefined}
            />
            {errors.name && (
              <p id="voucher-name-error" className="mt-1 text-xs text-red-600" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          {form.type === VOUCHER_TYPES.VALUE && !isService && (
            <div className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50/80 px-4 py-3">
              <input
                id="voucher-custom-amount"
                type="checkbox"
                checked={!!form.is_custom_amount}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setForm((prev) => {
                    const next = { ...prev, is_custom_amount: checked };
                    if (checked) {
                      const n = parseInt(prev.price, 10);
                      if (prev.price === '' || isNaN(n) || n < VOUCHER_VALUE_CUSTOM_MIN_KC) {
                        next.price = String(VOUCHER_VALUE_CUSTOM_MIN_KC);
                      }
                    }
                    return next;
                  });
                }}
                className="mt-1 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
              />
              <label htmlFor="voucher-custom-amount" className="text-sm text-stone-700 cursor-pointer leading-snug">
                <span className="font-semibold text-stone-800">Zákazník zadá částku na webu</span>
                <span className="block text-stone-500 mt-0.5">
                  Zobrazí se jeden řádek s polem pro částku; minimální hodnotu nastavíte níže (od{' '}
                  {VOUCHER_VALUE_CUSTOM_MIN_KC} Kč).
                </span>
              </label>
            </div>
          )}

          <div>
            <label htmlFor="voucher-price" className="block text-sm font-semibold text-stone-700 mb-1">
              {form.type === VOUCHER_TYPES.VALUE && form.is_custom_amount ? 'Minimální částka (Kč)' : 'Cena (Kč)'}
              <span className="text-red-500"> *</span>
            </label>
            <input
              id="voucher-price"
              type="number"
              min={form.type === VOUCHER_TYPES.VALUE ? valueMinKc : 1}
              step="1"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              className={`w-full p-3 border rounded-lg text-sm ${errors.price ? 'border-red-500' : 'border-stone-200'}`}
              aria-required="true"
              aria-invalid={!!errors.price}
              aria-describedby={errors.price ? 'voucher-price-error' : undefined}
            />
            {errors.price && (
              <p id="voucher-price-error" className="mt-1 text-xs text-red-600" role="alert">
                {errors.price}
              </p>
            )}
            {form.type === VOUCHER_TYPES.VALUE && form.is_custom_amount && (
              <p className="mt-1.5 text-xs text-stone-500">
                Na webu půjde zadat libovolnou částku od této minimální hodnoty nahoru.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="voucher-description" className="block text-sm font-semibold text-stone-700 mb-1">
              Popis
              <span className="text-stone-400 font-normal"> (volitelný)</span>
            </label>
            <textarea
              id="voucher-description"
              placeholder="Zadejte text, který se zobrazí u poukazu..."
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full p-3 border border-stone-200 rounded-lg text-sm resize-y"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              id="voucher-active-toggle"
              type="button"
              role="switch"
              aria-checked={!!form.is_active}
              aria-label={form.is_active ? 'Poukaz je aktivní' : 'Poukaz je neaktivní'}
              onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 ${
                form.is_active ? 'bg-stone-800 border-stone-800' : 'bg-stone-200 border-stone-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                  form.is_active ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <label htmlFor="voucher-active-toggle" className="text-sm font-medium text-stone-700 cursor-pointer">
              Aktivní (zobrazí se na webu)
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg text-sm font-bold bg-stone-800 text-white hover:bg-stone-900 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Ukládám…' : 'Uložit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

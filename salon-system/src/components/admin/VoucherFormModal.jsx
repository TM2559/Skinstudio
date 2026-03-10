import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { VOUCHER_TYPES } from '../../constants/config';

const initialForm = {
  type: VOUCHER_TYPES.VALUE,
  service_id: '',
  name: '',
  description: '',
  price: '',
  is_active: true,
};

export default function VoucherFormModal({
  open,
  onClose,
  onSubmit,
  editingVoucher,
  services = [],
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
      });
    } else {
      setForm(initialForm);
    }
    setErrors({});
  }, [open, editingVoucher]);

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

  const validate = () => {
    const next = {};
    if (!(form.name || '').trim()) next.name = 'Název je povinný';
    const priceNum = parseInt(form.price, 10);
    if (form.price === '' || isNaN(priceNum) || priceNum <= 0) {
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

  if (!open) return null;

  const isService = form.type === VOUCHER_TYPES.SERVICE;
  const activeServices = services;

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
            {editingVoucher ? 'Upravit poukaz' : 'Nový poukaz'}
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
          <div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-stone-700">
                Typ poukazu
                <span className="sr-only"> (povinné)</span>
              </legend>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="voucher-type"
                    value={VOUCHER_TYPES.VALUE}
                    checked={form.type === VOUCHER_TYPES.VALUE}
                    onChange={() => setForm((prev) => ({ ...prev, type: VOUCHER_TYPES.VALUE, service_id: '' }))}
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
                    onChange={() => setForm((prev) => ({ ...prev, type: VOUCHER_TYPES.SERVICE }))}
                    className="rounded-full border-stone-300 text-stone-800 focus:ring-stone-500"
                  />
                  <span className="text-sm text-stone-700">Konkrétní služba</span>
                </label>
              </div>
            </fieldset>
          </div>

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

          <div>
            <label htmlFor="voucher-price" className="block text-sm font-semibold text-stone-700 mb-1">
              Cena (Kč)
              <span className="text-red-500"> *</span>
            </label>
            <input
              id="voucher-price"
              type="number"
              min="1"
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

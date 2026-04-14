import React from 'react';
import { X } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const CATEGORY_KOSMETIKA = 'kosmetika';
const CATEGORY_PMU = 'pmu';
const SERVICE_CATEGORY_STANDARD = 'STANDARD';
const SERVICE_CATEGORY_PMU = 'PMU';

const ManualBookingModal = ({
  open,
  onClose,
  services,
  manualForm,
  setManualForm,
  manualAvailableSlots,
  manualPrefillSlot,
  hasShifts,
  onSubmit,
  isSubmitting,
}) => {
  if (!open) return null;

  const selectedCategory = manualForm.category ?? null;
  const isPmu = selectedCategory === CATEGORY_PMU;
  const filteredServices = selectedCategory
    ? services.filter(
        (s) => (s.category || SERVICE_CATEGORY_STANDARD) === (isPmu ? SERVICE_CATEGORY_PMU : SERVICE_CATEGORY_STANDARD)
      )
    : [];
  const selectedService = services.find((s) => s.id === manualForm.serviceId);
  const selectedServiceDuration = Number(selectedService?.duration || 0);
  const selectedSlotDuration = Number(manualPrefillSlot?.duration || 0);
  const selectedSlotTooShort =
    selectedSlotDuration > 0 &&
    selectedServiceDuration > 0 &&
    selectedServiceDuration > selectedSlotDuration;

  const handleCategoryChange = (cat) => {
    setManualForm({ ...manualForm, category: cat, serviceId: '', time: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto border-2 transition-colors ${
          isPmu ? 'border-[var(--pmu-color)]' : 'border-transparent'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-xl font-bold text-stone-900">Manuální rezervace</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-stone-400 block mb-2">Kategorie</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleCategoryChange(CATEGORY_KOSMETIKA)}
                className={`category-btn py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border-2 ${
                  selectedCategory === CATEGORY_KOSMETIKA
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700'
                }`}
              >
                Kosmetika
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange(CATEGORY_PMU)}
                className={`category-btn py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border-2 ${
                  selectedCategory === CATEGORY_PMU
                    ? 'bg-[var(--pmu-color)] text-white border-[var(--pmu-color)]'
                    : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700'
                }`}
              >
                PMU
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-stone-400">Služba</label>
            <select
              required
              disabled={!selectedCategory}
              className="w-full p-3 border rounded-lg text-sm bg-white disabled:opacity-60 disabled:cursor-not-allowed"
              value={manualForm.serviceId}
              onChange={(e) => setManualForm({ ...manualForm, serviceId: e.target.value })}
            >
              <option value="">
                {selectedCategory ? 'Vyberte službu...' : 'Nejdříve zvolte kategorii'}
              </option>
              {filteredServices.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
              ))}
            </select>
            {selectedSlotTooShort && (
              <p className="mt-1.5 text-xs text-amber-700">
                Vybraná procedura ({selectedServiceDuration} min) je delší než zvolený volný slot (
                {selectedSlotDuration} min). Zvolte kratší proceduru nebo jiný čas.
              </p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-stone-400">Datum</label>
            <input
              type="date"
              required
              className="w-full p-3 border rounded-lg text-sm"
              value={manualForm.date}
              onChange={(e) => setManualForm({ ...manualForm, date: e.target.value, time: '' })}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-stone-400 flex justify-between">
              Čas {hasShifts ? <span className="text-green-600">Dle směn</span> : <span className="text-orange-500">Bez omezení</span>}
            </label>
            {hasShifts ? (
              <select
                required
                className="w-full p-3 border rounded-lg text-sm bg-white"
                value={manualForm.time}
                onChange={(e) => setManualForm({ ...manualForm, time: e.target.value })}
                disabled={!manualForm.serviceId}
              >
                <option value="">Vyberte čas...</option>
                {manualForm.time && !manualAvailableSlots.includes(manualForm.time) && (
                  <option value={manualForm.time}>{manualForm.time}</option>
                )}
                {manualAvailableSlots.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            ) : (
              <select
                required
                className="w-full p-3 border rounded-lg text-sm bg-white"
                value={manualForm.time}
                onChange={(e) => setManualForm({ ...manualForm, time: e.target.value })}
              >
                <option value="">Vyberte čas...</option>
                {Utils.generateTimeOptions().map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>

          <div className="border-t border-stone-100 my-4 pt-4 space-y-4">
            <input
              required
              type="text"
              placeholder="Jméno klienta"
              className="w-full p-3 border rounded-lg text-sm"
              value={manualForm.name}
              onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
            />
            <input
              type="tel"
              placeholder="Telefon (volitelné)"
              className="w-full p-3 border rounded-lg text-sm"
              value={manualForm.phone}
              onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email (volitelné)"
              className="w-full p-3 border rounded-lg text-sm"
              value={manualForm.email}
              onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
            />
            <label className="flex items-center gap-3 cursor-pointer text-sm text-stone-600">
              <input
                type="checkbox"
                checked={manualForm.sendNotification !== false}
                onChange={(e) => setManualForm({ ...manualForm, sendNotification: e.target.checked })}
                className="w-4 h-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
              />
              <span>Odeslat potvrzení</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white py-3 rounded-lg font-bold text-xs uppercase transition-all disabled:opacity-50 ${
              isPmu
                ? 'bg-[var(--pmu-color)] hover:opacity-90 border-2 border-[var(--pmu-color)]'
                : 'bg-stone-800 hover:bg-black border-2 border-stone-800'
            }`}
          >
            {isSubmitting ? 'Ukládám...' : 'Vytvořit rezervaci'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManualBookingModal;

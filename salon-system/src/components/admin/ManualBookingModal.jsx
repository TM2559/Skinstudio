import React from 'react';
import { X } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const ManualBookingModal = ({
  open,
  onClose,
  services,
  manualForm,
  setManualForm,
  manualAvailableSlots,
  hasShifts,
  onSubmit,
  isSubmitting,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-xl font-bold text-stone-900">Manuální rezervace</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-stone-400">Služba</label>
            <select
              required
              className="w-full p-3 border rounded-lg text-sm bg-white"
              value={manualForm.serviceId}
              onChange={(e) => setManualForm({ ...manualForm, serviceId: e.target.value, time: '' })}
            >
              <option value="">Vyberte proceduru...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
              ))}
            </select>
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
              required
              type="tel"
              placeholder="Telefon"
              className="w-full p-3 border rounded-lg text-sm"
              value={manualForm.phone}
              onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
            />
            <input
              required
              type="email"
              placeholder="Email (pro potvrzení)"
              className="w-full p-3 border rounded-lg text-sm"
              value={manualForm.email}
              onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-stone-800 text-white py-3 rounded-lg font-bold text-xs uppercase hover:bg-black transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Ukládám...' : 'Vytvořit rezervaci'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManualBookingModal;

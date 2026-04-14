import React from 'react';
import { Mail, UserX, PlusCircle } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const hasContact = (val) => (val != null && String(val).trim() !== '');

const ReservationList = ({ data, emptyMsg, onSelectOrder, onAddReservation, todayKey }) => (
  <div className="space-y-3">
    {data.length === 0 && (
      <div className="text-left py-6">
        <p className="text-stone-500 text-sm mb-4">{emptyMsg}</p>
        {onAddReservation && (
          <button
            type="button"
            onClick={onAddReservation}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-800 text-white text-sm font-semibold rounded-xl hover:bg-stone-700 transition-colors"
          >
            <PlusCircle size={16} /> Přidat rezervaci
          </button>
        )}
      </div>
    )}

    {data.map((res) => {
      const isToday = res.date === todayKey;
      const isAnonymous = !hasContact(res.phone) && !hasContact(res.email);
      return (
        <div
          key={res.id}
          onClick={() => onSelectOrder(res)}
          title={isAnonymous ? 'Bez kontaktních údajů' : undefined}
          className={`group relative p-4 bg-white rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md
            ${isToday ? 'border-l-4 border-l-stone-800 border-stone-200' : 'border border-stone-100 hover:border-stone-300'}
            ${isAnonymous ? 'border-dashed border-2 border-stone-400' : 'border-solid'}
          `}
          style={isAnonymous ? { opacity: 0.85 } : undefined}
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div className="flex gap-3 items-start sm:items-center min-w-0">
              <div className={`flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-lg shrink-0 ${isToday ? 'bg-stone-800 text-white' : 'bg-stone-50 text-stone-500'}`}>
                <span className="text-lg font-bold leading-none">{res.time}</span>
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-stone-900 flex items-center gap-2">
                  {res.name}
                  {isAnonymous && (
                    <UserX size={14} className="text-stone-400 shrink-0" aria-hidden />
                  )}
                  {isToday && (
                    <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                      Dnes
                    </span>
                  )}
                </h4>
                <div className="text-xs text-stone-500 flex items-center gap-2 mt-1 min-w-0">
                  <span className="font-medium">{Utils.formatDateDisplay(res.date)}</span>
                  <span>•</span>
                  <span className="truncate">{res.serviceName}</span>
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs font-bold text-stone-400">{res.phone || res.email || '—'}</div>
              {res.reminderSent && (
                <div className="text-[9px] text-green-500 font-bold mt-1 flex items-center sm:justify-end gap-1">
                  <Mail size={10} /> Odesláno
                </div>
              )}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default ReservationList;

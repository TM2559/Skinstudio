import React from 'react';
import { Mail, UserX } from 'lucide-react';
import { Utils } from '../../../utils/helpers';

const hasContact = (val) => val != null && String(val).trim() !== '';

const ReservationTimelineCard = ({ data: res, onSelectOrder, todayKey, extraBottomMargin, outsideShift = false }) => {
  const isToday = res.date === todayKey;
  const isAnonymous = !hasContact(res.phone) && !hasContact(res.email);
  return (
    <div
      onClick={() => onSelectOrder(res)}
      title={isAnonymous ? 'Bez kontaktních údajů' : undefined}
      className={`group relative p-4 bg-white rounded-xl cursor-pointer transition-colors mt-2
        ${extraBottomMargin ? 'mb-6' : 'mb-2'}
        ${isToday ? 'border-l-4 border-l-slate-900 border-slate-200' : 'border border-slate-200 hover:border-slate-300'}
        ${isAnonymous ? 'border-dashed border-2 border-slate-400' : 'border-solid'}
      `}
      style={isAnonymous ? { opacity: 0.85 } : undefined}
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-center">
          <div
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${
              isToday ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500'
            }`}
          >
            <span className="text-lg font-bold leading-none">{res.time}</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              {res.name}
              {isAnonymous && <UserX size={14} className="text-slate-400 shrink-0" aria-hidden />}
              {isToday && (
                <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                  Dnes
                </span>
              )}
            </h4>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
              <span className="font-medium">{Utils.formatDateDisplay(res.date)}</span>
              <span aria-hidden>•</span>
              <span>{res.serviceName}</span>
              {outsideShift && (
                <>
                  <span aria-hidden>•</span>
                  <span className="text-amber-700 font-semibold">Mimo směnu</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xs font-bold text-slate-400">{res.phone || res.email || '—'}</div>
          {res.reminderSent && (
            <div className="text-[9px] text-green-600 font-bold mt-1 flex items-center justify-end gap-1">
              <Mail size={10} aria-hidden /> Odesláno
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationTimelineCard;

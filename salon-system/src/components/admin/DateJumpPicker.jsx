import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Utils } from '../../utils/helpers';
import { getDayPeriods } from '../../utils/dayAgenda';
import {
  WEEK_JUMPS,
  addWeeksISO,
  dateFromISO,
  isoFromDate,
  shortDateCs,
  weeksLabel,
} from '../../utils/dateJumps';

/**
 * Výběr data bez listování: nahoře skoky „+N týdnů“ (od `baseISO`, výchozí dnešek),
 * pod tím měsíční kalendář otevřený na měsíci vybraného data.
 * Tečka = den s rezervací, tučně = den se směnou.
 * Nahrazuje nativní <input type="date">, který na iPhonu neumí rychle skočit o týdny.
 */
export default function DateJumpPicker({
  value,
  onChange,
  onClose,
  baseISO,
  reservations = [],
  schedule = {},
  schedulePmu = {},
  title = 'Vybrat datum',
}) {
  const todayISO = Utils.getLocalISODate();
  const base = baseISO || todayISO;
  const [viewMonth, setViewMonth] = useState(() => {
    const d = dateFromISO(value || todayISO);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const bookedKeys = useMemo(() => {
    const set = new Set();
    reservations.forEach((r) => r.date && set.add(r.date));
    return set;
  }, [reservations]);

  const cells = useMemo(() => {
    const first = new Date(viewMonth.y, viewMonth.m, 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(viewMonth.y, viewMonth.m + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < offset; i++) out.push(null);
    for (let d = 1; d <= days; d++) out.push(new Date(viewMonth.y, viewMonth.m, d));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [viewMonth]);

  const shiftMonth = (delta) =>
    setViewMonth((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const pick = (iso) => {
    onChange(iso);
    onClose();
  };

  const monthLabel = new Date(viewMonth.y, viewMonth.m, 1).toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={title}
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-stone-900">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Zavřít" className="p-2 -mr-2 rounded-full text-stone-400 hover:text-stone-800">
            <X size={20} />
          </button>
        </div>

        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          {base === todayISO ? 'Od dneška' : `Od ${shortDateCs(base)}`}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            type="button"
            onClick={() => pick(todayISO)}
            className="py-2 px-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-800 hover:border-stone-400"
          >
            Dnes
            <span className="block text-[11px] font-normal text-stone-500">{shortDateCs(todayISO)}</span>
          </button>
          {WEEK_JUMPS.map((w) => {
            const iso = addWeeksISO(base, w);
            return (
              <button
                key={w}
                type="button"
                onClick={() => pick(iso)}
                className={`py-2 px-2 rounded-xl border text-sm font-semibold hover:border-stone-400 ${
                  iso === value ? 'bg-stone-800 text-white border-stone-800' : 'border-stone-200 text-stone-800'
                }`}
              >
                +{weeksLabel(w)}
                <span className={`block text-[11px] font-normal ${iso === value ? 'text-stone-300' : 'text-stone-500'}`}>
                  {shortDateCs(iso)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-2">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Předchozí měsíc" className="p-2 rounded-lg hover:bg-stone-100">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold capitalize">{monthLabel}</span>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Další měsíc" className="p-2 rounded-lg hover:bg-stone-100">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-stone-400 mb-1">
          {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const iso = isoFromDate(d);
            const key = Utils.formatDateKey(d);
            const isSel = iso === value;
            const isToday = iso === todayISO;
            const hasShift = getDayPeriods(schedule[key]).length > 0 || getDayPeriods(schedulePmu[key]).length > 0;
            const hasBooking = bookedKeys.has(key);
            return (
              <button
                key={iso}
                type="button"
                onClick={() => pick(iso)}
                className={`relative aspect-square flex items-center justify-center rounded-lg text-sm transition-colors ${
                  isSel
                    ? 'bg-stone-800 text-white'
                    : `${hasShift ? 'text-stone-900 font-semibold' : 'text-stone-400'} ${isToday ? 'ring-1 ring-stone-400' : ''} hover:bg-stone-100`
                }`}
              >
                {d.getDate()}
                {hasBooking && (
                  <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-stone-800'}`} />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[11px] text-stone-500">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-stone-800" /> rezervace</span>
          <span><b className="text-stone-900">tučně</b> = směna</span>
        </div>
      </div>
    </div>
  );
}

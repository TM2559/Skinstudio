import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Mail, MessageSquare, Phone, Plus, Repeat, X } from 'lucide-react';
import { Utils } from '../../utils/helpers';
import { buildDayAgenda } from '../../utils/dayAgenda';
import {
  REBOOK_WEEK_JUMPS,
  addDaysISO,
  dateFromISO,
  mondayOfISO,
  shortDateCs,
  weeksLabel,
} from '../../utils/dateJumps';
import DateJumpPicker from '../admin/DateJumpPicker';

const fmt = (min) => Utils.minutesToTime(min);
const hoursLabel = (min) => {
  const h = min / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1).replace('.', ',')} h`;
};

/**
 * Přehled týdne pro mobil: každý den = směna + rezervace + volná okna.
 * Klepnutí na volné okno → nová rezervace s předvyplněným dnem a časem.
 * Klepnutí na rezervaci → detail (zavolat, SMS, objednat znovu za N týdnů).
 */
export default function AgendaView({ reservations, schedule, schedulePmu, selectedISO, setSelectedISO, onNewBooking, onRebook }) {
  const todayISO = Utils.getLocalISODate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const dayRefs = useRef({});

  const mondayISO = mondayOfISO(selectedISO);
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const iso = addDaysISO(mondayISO, i);
        const dateKey = Utils.getDateKeyFromISO(iso);
        return { iso, dateKey, agenda: buildDayAgenda({ dateKey, schedule, schedulePmu, reservations }) };
      }),
    [mondayISO, schedule, schedulePmu, reservations]
  );

  // Po skoku na datum ho odscrolluj do záběru.
  useEffect(() => {
    dayRefs.current[selectedISO]?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [selectedISO]);

  const sunday = dateFromISO(addDaysISO(mondayISO, 6));
  const monday = dateFromISO(mondayISO);
  const weekLabel =
    monday.getMonth() === sunday.getMonth()
      ? `${monday.getDate()}.–${sunday.getDate()}. ${sunday.getMonth() + 1}.`
      : `${monday.getDate()}. ${monday.getMonth() + 1}. – ${sunday.getDate()}. ${sunday.getMonth() + 1}.`;
  const isThisWeek = mondayISO === mondayOfISO(todayISO);
  const weeksAhead = Math.round((dateFromISO(mondayISO) - dateFromISO(mondayOfISO(todayISO))) / (7 * 864e5));

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-5 px-5 py-3 bg-[var(--skin-cream,#faf7f2)] border-b" style={{ borderColor: 'var(--skin-beige-muted,#e7ded2)' }}>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setSelectedISO(addDaysISO(selectedISO, -7))} aria-label="Předchozí týden" className="p-2 rounded-xl hover:bg-white">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 text-center leading-tight">
            <div className="font-semibold">{weekLabel}</div>
            <div className="text-[11px] text-stone-500">
              {isThisWeek ? 'tento týden' : weeksAhead > 0 ? `za ${weeksLabel(weeksAhead)}` : `před ${weeksLabel(-weeksAhead)}`}
            </div>
          </div>
          <button type="button" onClick={() => setSelectedISO(addDaysISO(selectedISO, 7))} aria-label="Další týden" className="p-2 rounded-xl hover:bg-white">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => setSelectedISO(todayISO)}
            disabled={selectedISO === todayISO}
            className="flex-1 py-2 rounded-xl border border-stone-200 bg-white text-sm font-semibold disabled:opacity-40"
          >
            Dnes
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex-[2] py-2 rounded-xl border border-stone-200 bg-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <CalendarDays size={16} /> Jít na datum / +týdny
          </button>
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {days.map(({ iso, agenda }) => {
          const isToday = iso === todayISO;
          const isPast = iso < todayISO;
          const isSel = iso === selectedISO;
          const empty = agenda.shifts.length === 0 && agenda.bookings.length === 0;
          const shiftText = agenda.shifts
            .map((p) => `${p.type === 'pmu' ? 'PMU ' : ''}${p.start}–${p.end}`)
            .join(', ');
          return (
            <section
              key={iso}
              ref={(el) => { dayRefs.current[iso] = el; }}
              className={`rounded-2xl bg-white border scroll-mt-32 ${isSel ? 'border-stone-800' : 'border-stone-200'} ${isPast ? 'opacity-60' : ''}`}
            >
              <header className={`flex items-center justify-between px-4 ${empty ? 'py-2.5' : 'pt-3 pb-2'}`}>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold capitalize ${empty ? 'text-stone-400' : ''}`}>{shortDateCs(iso)}</span>
                  {isToday && <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Dnes</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-right text-stone-500">
                    {empty ? 'volno' : shiftText || 'bez směny'}
                    {agenda.bookings.length > 0 && <span className="ml-2 font-semibold text-stone-800">{agenda.bookings.length}×</span>}
                  </span>
                  {!isPast && (
                    <button
                      type="button"
                      onClick={() => onNewBooking({ date: iso })}
                      aria-label={`Přidat rezervaci na ${shortDateCs(iso)}`}
                      className="p-1.5 -mr-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </header>
              {!empty && (
                <ul className="px-2 pb-2">
                  {agenda.items.map((it) =>
                    it.kind === 'booking' ? (
                      <li key={`b-${it.reservation.id}`}>
                        <button
                          type="button"
                          onClick={() => setDetail(it.reservation)}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left hover:bg-stone-50"
                        >
                          <span className="w-[6.75rem] shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums">{fmt(it.startMin)}–{fmt(it.endMin)}</span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold truncate">{it.reservation.name || '—'}</span>
                            <span className="block text-xs text-stone-500 truncate">{it.reservation.serviceName}</span>
                          </span>
                        </button>
                      </li>
                    ) : (
                      <li key={`f-${it.startMin}`}>
                        <button
                          type="button"
                          disabled={isPast}
                          onClick={() => onNewBooking({ date: iso, time: fmt(it.startMin) })}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left text-emerald-700 hover:bg-emerald-50 disabled:pointer-events-none"
                        >
                          <span className="w-[6.75rem] shrink-0 whitespace-nowrap text-sm tabular-nums">{fmt(it.startMin)}–{fmt(it.endMin)}</span>
                          <span className="text-sm flex-1">volno · {hoursLabel(it.endMin - it.startMin)}</span>
                          {!isPast && <Plus size={16} />}
                        </button>
                      </li>
                    )
                  )}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {pickerOpen && (
        <DateJumpPicker
          value={selectedISO}
          onChange={setSelectedISO}
          onClose={() => setPickerOpen(false)}
          reservations={reservations}
          schedule={schedule}
          schedulePmu={schedulePmu}
          title="Přejít na den"
        />
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setDetail(null)}>
          <div
            role="dialog"
            aria-label="Detail rezervace"
            className="bg-white w-full max-w-md rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-display text-xl font-bold">{detail.name || '—'}</h3>
                <p className="text-sm text-stone-500">{detail.serviceName}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} aria-label="Zavřít" className="p-2 -mr-2 text-stone-400">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm mb-4">
              <span className="capitalize">{shortDateCs(Utils.getISOFromDateKey(detail.date))}</span> · {detail.time}
              {detail.duration ? ` · ${detail.duration} min` : ''}
            </p>
            {(detail.phone || detail.email) ? (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {detail.phone && (
                  <a href={`tel:${detail.phone}`} className="py-3 rounded-xl bg-stone-800 text-white text-sm font-semibold flex items-center justify-center gap-1.5">
                    <Phone size={16} /> Volat
                  </a>
                )}
                {detail.phone && (
                  <a href={`sms:${detail.phone}`} className="py-3 rounded-xl border border-stone-200 text-sm font-semibold flex items-center justify-center gap-1.5">
                    <MessageSquare size={16} /> SMS
                  </a>
                )}
                {detail.email && (
                  <a href={`mailto:${detail.email}`} className="py-3 rounded-xl border border-stone-200 text-sm font-semibold flex items-center justify-center gap-1.5">
                    <Mail size={16} /> E-mail
                  </a>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-400 mb-4">Bez kontaktu</p>
            )}
            <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5 flex items-center gap-1.5">
              <Repeat size={12} /> Objednat znovu za
            </div>
            <div className="grid grid-cols-4 gap-2">
              {REBOOK_WEEK_JUMPS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => { onRebook(detail, w); setDetail(null); }}
                  className="py-3 rounded-xl border border-stone-200 text-sm font-semibold hover:border-stone-800"
                >
                  {w} týd.
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

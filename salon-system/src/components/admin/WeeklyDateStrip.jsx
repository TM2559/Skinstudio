import React, { useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const STRIP_DAYS = 14;
const STRIP_BACK_DAYS = 4;

const MONTH_NAMES = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
];

const addMonthsISO = (iso, delta) => {
  if (!iso || typeof iso !== 'string') return iso;
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return iso;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  date.setMonth(date.getMonth() + delta);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/**
 * Horizontálně scrollovatelný pruh dní s vizualizací počtu rezervací.
 * Aktivní den = adminDateInput (ISO). Šipky mění měsíc; kalendář (label) pro libovolné datum.
 * Pruh je ukotěný kolem vybraného dne (ne vždy od „dnes“).
 */
const WeeklyDateStrip = ({ adminDateInput, setAdminDateInput, reservations, schedule = {}, onOpenDatePicker }) => {
  const activeDateKey = Utils.getDateKeyFromISO(adminDateInput);
  const todayIso = Utils.getLocalISODate();
  const todayKey = Utils.getDateKeyFromISO(todayIso);

  const { dates, countByDate, shiftByDate } = useMemo(() => {
    const baseDate = adminDateInput ? new Date(`${adminDateInput}T00:00:00`) : new Date();
    const dates = [];
    for (let i = -STRIP_BACK_DAYS; i < STRIP_DAYS - STRIP_BACK_DAYS; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const dateKey = Utils.formatDateKey(d);
      dates.push({
        dateKey,
        iso: Utils.getISOFromDateKey(dateKey),
        dayNum: dObj.getDate(),
        dayShort: Utils.getDayOfWeekShort(dateKey),
      });
    }
    const shiftByDate = {};
    Object.entries(schedule || {}).forEach(([dateKey, day]) => {
      shiftByDate[dateKey] = !!(day && (day.periods?.length > 0 || day.start));
    });

    const countByDate = {};
    (reservations || []).forEach((r) => {
      if (r?.date) countByDate[r.date] = (countByDate[r.date] || 0) + 1;
    });

    return { dates, countByDate, shiftByDate };
  }, [adminDateInput, reservations, schedule, todayIso]);

  const activeLabel = Utils.formatDateWithDayLong(activeDateKey);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Vybrané datum</p>
          <p className="text-sm font-semibold text-stone-800 truncate">{activeLabel}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setAdminDateInput(todayIso)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors ${
              activeDateKey === todayKey
                ? 'bg-stone-800 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
            title="Přejít na dnešek"
          >
            Dnes
          </button>
          <button
            type="button"
            onClick={onOpenDatePicker}
            className="flex-shrink-0 p-2 rounded-lg text-gray-500 hover:bg-stone-100 hover:text-gray-700 transition-colors border border-transparent"
            title="Vybrat datum"
            aria-label="Otevřít kalendář"
          >
            <Calendar size={18} />
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-hide min-w-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {dates.map(({ dateKey, iso, dayNum, dayShort }) => {
          const isActive = dateKey === activeDateKey;
          const isToday = dateKey === todayKey;
          const count = countByDate[dateKey] || 0;
          const hasShift = !!shiftByDate[dateKey];
          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => setAdminDateInput(iso)}
              className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[3.25rem] py-2 px-1 rounded-lg border transition-all
                ${isActive
                  ? 'bg-[#1A1A1A] text-white font-semibold border-[#1A1A1A]'
                  : isToday
                    ? 'bg-white text-stone-700 border-stone-300'
                    : 'bg-transparent text-gray-500 border-transparent hover:text-gray-700 hover:bg-stone-100'
                }`}
              title={Utils.formatDateDisplay(dateKey)}
            >
              <span className="text-[10px] uppercase tracking-wide">{dayShort}</span>
              <span className="text-base font-bold leading-tight">{dayNum}</span>
              <span className="mt-0.5 flex items-center gap-1">
                {hasShift && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full border ${isActive ? 'border-white' : 'border-stone-500'}`}
                    aria-label="Vypsaná směna"
                  />
                )}
                {count > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-black'}`}
                    aria-label={`${count} rezervací`}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-[11px] text-stone-500">
        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full border border-stone-500" /> směna</span>
        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-black" /> rezervace</span>
      </div>
    </div>
  );
};

export default WeeklyDateStrip;

import React, { useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const STRIP_DAYS = 14;

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
const WeeklyDateStrip = ({ adminDateInput, setAdminDateInput, reservations, dateInputId }) => {
  const activeDateKey = Utils.getDateKeyFromISO(adminDateInput);

  const { dates, countByDate, monthLabel } = useMemo(() => {
    const today = new Date();
    const fallbackY = today.getFullYear();
    const fallbackM = today.getMonth() + 1;
    const fallbackD = today.getDate();
    const parts = adminDateInput ? adminDateInput.split('-').map(Number) : [];
    const valid = parts.length === 3 && !parts.some(Number.isNaN);
    const [y, m, d] = valid ? parts : [fallbackY, fallbackM, fallbackD];

    const start = new Date(y, m - 1, d);
    start.setDate(start.getDate() - 3);

    const dates = [];
    for (let i = 0; i < STRIP_DAYS; i++) {
      const dObj = new Date(start);
      dObj.setDate(start.getDate() + i);
      const dateKey = Utils.formatDateKey(dObj);
      dates.push({
        dateKey,
        iso: Utils.getISOFromDateKey(dateKey),
        dayNum: dObj.getDate(),
        dayShort: Utils.getDayOfWeekShort(dateKey),
      });
    }

    const countByDate = {};
    (reservations || []).forEach((r) => {
      if (r.date) countByDate[r.date] = (countByDate[r.date] || 0) + 1;
    });

    const monthLabel = `${MONTH_NAMES[m - 1]} ${y}`;
    return { dates, countByDate, monthLabel };
  }, [adminDateInput, reservations]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 w-full">
        <div className="flex items-center flex-1 min-w-0 gap-1">
          <button
            type="button"
            onClick={() => setAdminDateInput(addMonthsISO(adminDateInput, -1))}
            className="flex-shrink-0 p-2.5 rounded-lg text-stone-600 hover:bg-stone-100 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Předchozí měsíc"
            title="Předchozí měsíc"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-stone-800 truncate px-1">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => setAdminDateInput(addMonthsISO(adminDateInput, 1))}
            className="flex-shrink-0 p-2.5 rounded-lg text-stone-600 hover:bg-stone-100 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Další měsíc"
            title="Další měsíc"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <label
          htmlFor={dateInputId}
          className="flex-shrink-0 p-2.5 rounded-lg text-gray-500 hover:bg-stone-100 hover:text-gray-700 transition-colors cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Vybrat datum"
          aria-label="Otevřít kalendář"
        >
          <Calendar size={18} />
        </label>
      </div>
      <div className="flex items-center gap-2 w-full">
        <div
          className="flex flex-1 overflow-x-auto gap-1 pb-1 scrollbar-hide min-w-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {dates.map(({ dateKey, iso, dayNum, dayShort }) => {
            const isActive = dateKey === activeDateKey;
            const count = countByDate[dateKey] || 0;
            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setAdminDateInput(iso)}
                className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[3rem] py-2 px-1 rounded-lg transition-all
                ${isActive
                  ? 'bg-[#1A1A1A] text-white font-semibold'
                  : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-stone-100'
                }`}
                title={Utils.formatDateDisplay(dateKey)}
              >
                <span className="text-[10px] uppercase tracking-wide">{dayShort}</span>
                <span className="text-base font-bold leading-tight">{dayNum}</span>
                {count > 0 && (
                  <span
                    className={`mt-0.5 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-black'}`}
                    aria-label={`${count} rezervací`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyDateStrip;

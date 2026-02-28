import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const STRIP_DAYS = 14;

/**
 * Horizontálně scrollovatelný pruh dní s vizualizací počtu rezervací.
 * Aktivní den = adminDateInput (ISO). Vpravo ikona kalendáře pro výběr vzdáleného data.
 */
const WeeklyDateStrip = ({ adminDateInput, setAdminDateInput, reservations, onOpenDatePicker }) => {
  const activeDateKey = Utils.getDateKeyFromISO(adminDateInput);

  const { dates, countByDate } = useMemo(() => {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < STRIP_DAYS; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateKey = Utils.formatDateKey(d);
      dates.push({
        dateKey,
        iso: Utils.getISOFromDateKey(dateKey),
        dayNum: d.getDate(),
        dayShort: Utils.getDayOfWeekShort(dateKey),
      });
    }
    const countByDate = {};
    (reservations || []).forEach((r) => {
      if (r.date) countByDate[r.date] = (countByDate[r.date] || 0) + 1;
    });
    return { dates, countByDate };
  }, [reservations]);

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex flex-1 overflow-x-auto gap-1 pb-1 scrollbar-hide min-w-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
      <button
        type="button"
        onClick={onOpenDatePicker}
        className="flex-shrink-0 p-2 rounded-lg text-gray-500 hover:bg-stone-100 hover:text-gray-700 transition-colors"
        title="Vybrat datum"
        aria-label="Otevřít kalendář"
      >
        <Calendar size={18} />
      </button>
    </div>
  );
};

export default WeeklyDateStrip;

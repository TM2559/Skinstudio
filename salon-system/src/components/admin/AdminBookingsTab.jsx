import React, { useRef, useMemo, useState } from 'react';
import { Search, Send } from 'lucide-react';
import { Utils } from '../../utils/helpers';
import ReservationList from './ReservationList';
import WeeklyDateStrip from './WeeklyDateStrip';
import DailyView from './daily/DailyView';
import DailyDigest from './daily/DailyDigest';
import ChronologicalSchedule from './daily/ChronologicalSchedule';
import { normalizeDayScheduleToShift } from './daily/calculateTimelineSegments';

const ADMIN_BOOKINGS_DATE_INPUT_ID = 'admin-bookings-date-picker';

const AdminBookingsTab = ({
  adminDateInput,
  setAdminDateInput,
  searchTerm,
  setSearchTerm,
  dailyReservations,
  onOpenReminders,
  onSelectOrder,
  onAddReservation,
  onManualBookingFromSlot,
  onCreateShiftForDay,
  schedule = {},
  todayKey,
  reservations = [],
  upcomingReservations = [],
  isGlobalSearchMode,
}) => {
  const dateInputRef = useRef(null);
  const [viewMode, setViewMode] = useState('future');
  const dateKey = Utils.getDateKeyFromISO(adminDateInput);
  const safeSchedule = schedule == null ? {} : schedule;
  const daySchedule = safeSchedule[dateKey];
  const shift = useMemo(() => normalizeDayScheduleToShift(daySchedule), [daySchedule]);
  const isFutureListMode = viewMode === 'future';
  const isShiftListMode = viewMode === 'shifts';
  const isDayMode = viewMode === 'day';

  const getComparableDate = (dateStr) => {
    if (!dateStr) return 0;
    const [d, m, y] = dateStr.split('-');
    return parseInt(`${y}${m}${d}`, 10);
  };

  const listedShifts = useMemo(() => {
    const todayComparable = getComparableDate(Utils.formatDateKey(new Date()));
    return Object.entries(safeSchedule)
      .filter(([, day]) => day && (day.periods?.length > 0 || day.start))
      .map(([dKey, day]) => {
        const periods = day.periods?.length > 0 ? day.periods : [{ start: day.start, end: day.end }];
        const dayReservations = (reservations || []).filter((r) => r.date === dKey && r.time);
        return {
          dateKey: dKey,
          periods,
          reservationsCount: dayReservations.length,
          outsideShiftCount: 0,
        };
      })
      .filter((item) => getComparableDate(item.dateKey) >= todayComparable)
      .sort((a, b) => getComparableDate(a.dateKey) - getComparableDate(b.dateKey));
  }, [safeSchedule, reservations]);

  const outsideReservationsByDate = useMemo(() => {
    const todayComparable = getComparableDate(Utils.formatDateKey(new Date()));
    const map = {};
    (reservations || []).forEach((r) => {
      if (!r?.date || !r?.time) return;
      if (getComparableDate(r.date) < todayComparable) return;

      const day = safeSchedule[r.date];
      const hasShift = !!(day && (day.periods?.length > 0 || day.start));
      const periods = hasShift
        ? day.periods?.length > 0
          ? day.periods
          : [{ start: day.start, end: day.end }]
        : [];

      const start = Utils.timeToMinutes(r.time);
      const end = start + (Number(r.duration) > 0 ? Number(r.duration) : 60);
      const overlaps = periods.some((p) => {
        const pStart = Utils.timeToMinutes(p.start);
        const pEnd = Utils.timeToMinutes(p.end);
        return start < pEnd && end > pStart;
      });

      if (!hasShift || !overlaps) {
        map[r.date] = (map[r.date] || 0) + 1;
      }
    });
    return map;
  }, [reservations, safeSchedule]);

  const shiftsWithOutsideInfo = useMemo(() => {
    return listedShifts.map((s) => ({
      ...s,
      outsideShiftCount: outsideReservationsByDate[s.dateKey] || 0,
    }));
  }, [listedShifts, outsideReservationsByDate]);

  const outsideOnlyDates = useMemo(() => {
    const shiftDates = new Set(listedShifts.map((s) => s.dateKey));
    return Object.keys(outsideReservationsByDate)
      .filter((d) => !shiftDates.has(d))
      .sort((a, b) => getComparableDate(a) - getComparableDate(b))
      .map((d) => ({ dateKey: d, outsideShiftCount: outsideReservationsByDate[d] }));
  }, [listedShifts, outsideReservationsByDate]);

  const shiftListItems = useMemo(() => {
    const shiftItems = shiftsWithOutsideInfo.map((item) => ({ type: 'shift', ...item }));
    const outsideItems = outsideOnlyDates.map((item) => ({ type: 'outsideOnly', ...item }));
    return [...shiftItems, ...outsideItems].sort(
      (a, b) => getComparableDate(a.dateKey) - getComparableDate(b.dateKey)
    );
  }, [shiftsWithOutsideInfo, outsideOnlyDates]);

  const formatDateDdMm = (dateKeyValue) => {
    if (!dateKeyValue) return '';
    const [dd, mm] = dateKeyValue.split('-');
    return `${dd}.${mm}.`;
  };
  const formatDateShortNoYear = (dateKeyValue) => {
    if (!dateKeyValue) return '';
    const [dd, mm] = dateKeyValue.split('-');
    return `${dd}.${mm}.`;
  };

  const groupedUpcomingReservations = useMemo(() => {
    const groups = [];
    let current = null;
    (upcomingReservations || []).forEach((r) => {
      if (!current || current.date !== r.date) {
        current = { date: r.date, items: [] };
        groups.push(current);
      }
      current.items.push(r);
    });
    return groups;
  }, [upcomingReservations]);

  return (
  <div className="w-full max-w-none mx-auto space-y-4 sm:space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <button
        type="button"
        onClick={() => setViewMode('future')}
        className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors ${
          isFutureListMode
            ? 'bg-stone-800 text-white'
            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
        }`}
      >
        Budoucí rezervace
      </button>
      <button
        type="button"
        onClick={() => setViewMode('shifts')}
        className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors ${
          isShiftListMode
            ? 'bg-stone-800 text-white'
            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
        }`}
      >
        Vypsané směny
      </button>
      <button
        type="button"
        onClick={() => setViewMode('day')}
        className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors ${
          isDayMode
            ? 'bg-stone-800 text-white'
            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
        }`}
      >
        Denní přehled
      </button>
    </div>

    {!isFutureListMode && !isShiftListMode && (
      <div className="flex flex-col gap-3">
        <WeeklyDateStrip
          adminDateInput={adminDateInput}
          setAdminDateInput={setAdminDateInput}
          reservations={reservations}
          schedule={safeSchedule}
          onOpenDatePicker={() => dateInputRef.current?.showPicker?.()}
        />
        <input
          ref={dateInputRef}
          type="date"
          value={adminDateInput}
          onChange={(e) => setAdminDateInput(e.target.value)}
          className="sr-only absolute opacity-0 pointer-events-none w-0 h-0"
          aria-hidden
        />
      </div>
    )}
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 text-stone-400" size={16} />
        <input
          type="text"
          placeholder="Hledat klienta, službu nebo ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 p-3 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-800 outline-none transition-all"
        />
      </div>
      <button
        onClick={onOpenReminders}
        className="bg-white border border-stone-200 text-stone-600 px-4 py-3 rounded-xl text-xs font-bold uppercase hover:bg-stone-50 flex items-center justify-center gap-2 transition-all sm:w-auto w-full"
      >
        <Send size={14} /> <span>Připomínky</span>
      </button>
    </div>

    <div className="flex justify-between items-end mt-2 sm:mt-4 mb-2 gap-2">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">
        {isFutureListMode
          ? 'Budoucí rezervace'
          : isShiftListMode
            ? 'Vypsané směny'
          : isGlobalSearchMode
          ? 'Výsledky vyhledávání'
          : Utils.formatDateKey(new Date()) === Utils.getDateKeyFromISO(adminDateInput)
            ? 'Dnešní agenda'
            : `Agenda: ${Utils.formatDateDisplay(Utils.getDateKeyFromISO(adminDateInput))}`}
      </h3>
      <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-1 rounded-lg font-bold">
        {isFutureListMode
          ? `${upcomingReservations.length} rezervací`
          : isShiftListMode
            ? `${shiftsWithOutsideInfo.length} směn`
            : `${dailyReservations.length} rezervací`}
      </span>
    </div>

    {isFutureListMode ? (
      groupedUpcomingReservations.length > 0 ? (
        <div className="space-y-4">
          {groupedUpcomingReservations.map((group) => (
            <section key={group.date} className="rounded-xl border border-stone-200 bg-stone-50/40 p-2">
              <div className="px-2 py-1.5 flex items-center justify-between">
                <span className="text-sm sm:text-base font-bold uppercase tracking-wide text-stone-600">
                  {Utils.getDayOfWeekShort(group.date)} {formatDateShortNoYear(group.date)}
                </span>
                <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-lg">{group.items.length}</span>
              </div>
              <div className="space-y-2">
                {group.items.map((res) => (
                  (() => {
                    const day = safeSchedule?.[res.date];
                    const hasShift = !!(day && (day.periods?.length > 0 || day.start));
                    const periods = hasShift
                      ? (day.periods?.length > 0 ? day.periods : [{ start: day.start, end: day.end }])
                      : [];
                    const start = Utils.timeToMinutes(res.time);
                    const end = start + (Number(res.duration) > 0 ? Number(res.duration) : 60);
                    const overlapsShift = periods.some((p) => {
                      const pStart = Utils.timeToMinutes(p.start);
                      const pEnd = Utils.timeToMinutes(p.end);
                      return start < pEnd && end > pStart;
                    });
                    const showNoShiftNote = !hasShift;

                    return (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => onSelectOrder(res)}
                    className="w-full text-left p-4 bg-white border border-stone-200 rounded-xl hover:border-stone-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-[64px] sm:min-w-[90px]">
                        <div className="text-xl sm:text-2xl font-semibold text-stone-400 leading-none">{res.time}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-stone-900">{res.name}</div>
                        <div className="text-xs text-stone-500 mt-1">{res.serviceName}</div>
                        {showNoShiftNote && (
                          <div className="text-[11px] text-amber-700 mt-1">
                            Na tento den není vypsaná směna - nejsou možné rezervace pro veřejnost.
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                    );
                  })()
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <ReservationList
          data={[]}
          emptyMsg="Žádné budoucí rezervace."
          onSelectOrder={onSelectOrder}
          onAddReservation={onAddReservation}
          todayKey={todayKey}
        />
      )
    ) : isShiftListMode ? (
      shiftListItems.length > 0 ? (
        <div className="space-y-3">
          {Object.keys(outsideReservationsByDate).length > 0 && (
            <div className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Existují rezervace mimo vypsané směny ({Object.values(outsideReservationsByDate).reduce((a, b) => a + b, 0)}).
            </div>
          )}

          {shiftListItems.map((item) => (
            item.type === 'shift' ? (
              <button
                key={`shift-${item.dateKey}`}
                type="button"
                onClick={() => {
                  setAdminDateInput(Utils.getISOFromDateKey(item.dateKey));
                  setViewMode('day');
                }}
                className="w-full text-left p-4 bg-white border border-stone-200 rounded-xl hover:border-stone-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-stone-900">
                      {Utils.getDayOfWeekShort(item.dateKey)} {formatDateDdMm(item.dateKey)}
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      {item.periods.map((p) => `${p.start}–${p.end}`).join(', ')}
                    </div>
                    {item.outsideShiftCount > 0 && (
                      <div className="text-[11px] text-amber-700 font-medium mt-1">
                        Pozor: {item.outsideShiftCount} rezervací mimo vypsanou směnu.
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-1 rounded-lg font-bold">
                    {item.reservationsCount} rezervací
                  </span>
                </div>
              </button>
            ) : (
              <button
                key={`outside-${item.dateKey}`}
                type="button"
                onClick={() => {
                  setAdminDateInput(Utils.getISOFromDateKey(item.dateKey));
                  setViewMode('day');
                }}
                className="w-full text-left p-4 bg-amber-50 border border-amber-200 rounded-xl hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-amber-900">
                      {Utils.getDayOfWeekShort(item.dateKey)} {formatDateDdMm(item.dateKey)}
                    </div>
                    <div className="text-xs text-amber-700 mt-1">Není vypsaná směna pro tento den.</div>
                    <div className="text-[11px] text-amber-700 font-medium mt-1">
                      Pozor: {item.outsideShiftCount} rezervací mimo vypsanou směnu.
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-1 rounded-lg font-bold">
                    bez směny
                  </span>
                </div>
              </button>
            )
          ))}
        </div>
      ) : (
        <p className="text-sm font-medium text-slate-500 text-center py-8">
          Žádné budoucí směny nejsou vypsané.
        </p>
      )
    ) : isGlobalSearchMode ? (
      <ReservationList
        data={dailyReservations}
        emptyMsg="Žádné nadcházející rezervace nevyhovují vyhledávání."
        onSelectOrder={onSelectOrder}
        onAddReservation={onAddReservation}
        todayKey={todayKey}
      />
    ) : shift ? (
      <DailyView date={adminDateInput}>
        <DailyDigest shift={shift} reservations={dailyReservations} />
        <ChronologicalSchedule
          shift={shift}
          reservations={dailyReservations}
          onSelectOrder={onSelectOrder}
          todayKey={todayKey}
          onAvailableSlotClick={(slot) => onManualBookingFromSlot(adminDateInput, slot)}
        />
      </DailyView>
    ) : dailyReservations.length > 0 ? (
      <div className="space-y-3">
        <div className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>Pro tento den není vypsaná směna, ale existují rezervace mimo směnu.</span>
          <button
            type="button"
            onClick={() => onCreateShiftForDay?.(adminDateInput)}
            className="self-start sm:self-auto text-[11px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
          >
            Vypsat směnu na tento den
          </button>
        </div>
        <ReservationList
          data={dailyReservations}
          emptyMsg={`Na ${Utils.formatDateDisplay(Utils.getDateKeyFromISO(adminDateInput))} nejsou žádné rezervace.`}
          onSelectOrder={onSelectOrder}
          onAddReservation={onAddReservation}
          todayKey={todayKey}
        />
      </div>
    ) : (
      <p className="text-sm font-medium text-slate-500 text-center py-8">
        Žádná vypsaná směna pro tento den
      </p>
    )}
  </div>
);
};

export default AdminBookingsTab;

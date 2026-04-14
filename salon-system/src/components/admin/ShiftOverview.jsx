import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Trash2, Plus } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const WEEKDAY_LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const MONTH_NAMES = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];

function dateKeyToISO(dateKey) {
  if (!dateKey) return '';
  const [d, m, y] = dateKey.split('-');
  return `${y}-${m}-${d}`;
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - (day === 0 ? 7 : day) + 1;
  const monday = new Date(date);
  monday.setDate(diff);
  return monday;
}

function getWeekRange(monday) {
  const sun = new Date(monday);
  sun.setDate(monday.getDate() + 6);
  return {
    mon: monday.getDate() + '. ' + (monday.getMonth() + 1) + '.',
    sun: sun.getDate() + '. ' + (sun.getMonth() + 1) + '.',
    weekNum: getISOWeekNum(monday),
  };
}

function getISOWeekNum(d) {
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const mon = getMonday(jan4);
  const thisMon = getMonday(d);
  const diff = Math.round((thisMon - mon) / 86400000);
  return Math.floor(diff / 7) + 1;
}

function formatTimeRange(periods) {
  if (!periods?.length) return null;
  const first = periods[0];
  const start = first.start ?? '';
  const end = first.end ?? '';
  if (periods.length === 1) return `${start} – ${end}`;
  return `${start} – ${end} (+${periods.length - 1})`;
}

export default function ShiftOverview({
  schedule = {},
  schedulePmu = {},
  adminDateInput,
  setAdminDateInput,
  scheduleType,
  setScheduleType,
  onShift,
  getDocPath,
  setDoc,
  deleteDoc,
}) {
  const [viewDate, setViewDate] = useState(() => {
    if (adminDateInput) {
      const [y, m] = adminDateInput.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const todayKey = Utils.formatDateKey(new Date());

  const { daysInGrid, stats, listByWeek } = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    const firstDayOfWeek = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();
    const leadingEmpty = firstDayOfWeek;
    const totalCells = leadingEmpty + daysInMonth;
    const rows = Math.ceil(totalCells / 7);
    const gridCells = [];

    let standardDays = 0;
    let pmuDays = 0;

    for (let i = 0; i < leadingEmpty; i++) gridCells.push({ empty: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dateKey = Utils.formatDateKey(date);
      const stdData = schedule[dateKey];
      const pmuData = schedulePmu[dateKey];
      const stdPeriods = stdData?.periods || (stdData?.start ? [{ start: stdData.start, end: stdData.end }] : []);
      const pmuPeriods = pmuData?.periods || (pmuData?.start ? [{ start: pmuData.start, end: pmuData.end }] : []);
      const hasStandard = stdPeriods.length > 0;
      const hasPmu = pmuPeriods.length > 0;
      if (hasStandard) standardDays++;
      if (hasPmu) pmuDays++;

      gridCells.push({
        empty: false,
        dateKey,
        date,
        day: d,
        hasStandard,
        hasPmu,
        stdPeriods,
        pmuPeriods,
        stdTime: formatTimeRange(stdPeriods),
        pmuTime: formatTimeRange(pmuPeriods),
      });
    }
    while (gridCells.length < rows * 7) gridCells.push({ empty: true });

    const daysWithAnyShift = new Set();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dateKey = Utils.formatDateKey(date);
      const hasStd = (schedule[dateKey]?.periods?.length || schedule[dateKey]?.start);
      const hasPmu = (schedulePmu[dateKey]?.periods?.length || schedulePmu[dateKey]?.start);
      if (hasStd || hasPmu) daysWithAnyShift.add(dateKey);
    }
    const stats = { standard: standardDays, pmu: pmuDays, off: Math.max(0, daysInMonth - daysWithAnyShift.size) };

    const listItems = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dateKey = Utils.formatDateKey(date);
      const stdData = schedule[dateKey];
      const pmuData = schedulePmu[dateKey];
      const stdPeriods = stdData?.periods || (stdData?.start ? [{ start: stdData.start, end: stdData.end }] : []);
      const pmuPeriods = pmuData?.periods || (pmuData?.start ? [{ start: pmuData.start, end: pmuData.end }] : []);
      if (stdPeriods.length > 0) {
        listItems.push({ dateKey, date, type: 'standard', periods: stdPeriods, label: 'Standard' });
      }
      if (pmuPeriods.length > 0) {
        listItems.push({ dateKey, date, type: 'pmu', periods: pmuPeriods, label: 'PMU' });
      }
    }

    const byWeek = {};
    listItems.forEach((item) => {
      const mon = getMonday(item.date);
      const key = Utils.formatDateKey(mon);
      if (!byWeek[key]) byWeek[key] = { ...getWeekRange(mon), items: [] };
      byWeek[key].items.push(item);
    });
    const listByWeek = Object.values(byWeek).sort((a, b) => a.items[0]?.date - b.items[0]?.date);

    return { daysInGrid: gridCells, stats, listByWeek };
  }, [viewYear, viewMonth, schedule, schedulePmu]);

  const prevMonth = () => setViewDate(new Date(viewYear, viewMonth - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewYear, viewMonth + 1, 1));

  const handleCellClick = (cell) => {
    if (cell.empty) return;
    setAdminDateInput(dateKeyToISO(cell.dateKey));
    if (cell.hasPmu && !cell.hasStandard) setScheduleType('pmu');
    else if (cell.hasStandard) setScheduleType('standard');
    const formEl = document.getElementById('shift-edit-form');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRemoveShift = async (dateKey, type) => {
    const col = type === 'pmu' ? 'schedule_pmu' : 'schedule';
    const ref = getDocPath(col, dateKey);
    await deleteDoc(ref);
  };

  const monthDays = useMemo(
    () => daysInGrid.filter((c) => !c.empty),
    [daysInGrid]
  );

  return (
    <div className="space-y-6">
      {/* Month selector: sticky on mobile, static on desktop */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 md:static md:mx-0 md:px-0 md:py-0 bg-white/95 backdrop-blur-sm md:bg-transparent border-b border-stone-100 md:border-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 touch-manipulation"
              aria-label="Předchozí měsíc"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="font-display font-semibold text-stone-800 text-base sm:text-lg min-w-0 text-center">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h3>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 touch-manipulation"
              aria-label="Následující měsíc"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="text-sm text-stone-500 flex flex-wrap gap-x-4 gap-y-1 md:block">
            <span><strong className="text-stone-700">Standard:</strong> {stats.standard} dní</span>
            <span><strong className="text-stone-700">PMU:</strong> {stats.pmu} dní</span>
            <span><strong className="text-stone-700">Volno:</strong> {stats.off} dní</span>
          </div>
        </div>
      </div>

      {/* Desktop: 7-column calendar grid */}
      <div className="hidden md:grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center text-[10px] font-bold text-stone-400 uppercase tracking-wider py-1">
            {label}
          </div>
        ))}
        {daysInGrid.map((cell, idx) => {
          if (cell.empty) {
            return <div key={idx} className="aspect-square min-h-[52px]" />;
          }
          const isToday = cell.dateKey === todayKey;
          const hasAny = cell.hasStandard || cell.hasPmu;
          const isPmuOnly = cell.hasPmu && !cell.hasStandard;
          const isStandardOnly = cell.hasStandard && !cell.hasPmu;
          const isBoth = cell.hasStandard && cell.hasPmu;

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => handleCellClick(cell)}
              className={`
                aspect-square min-h-[52px] rounded-lg border flex flex-col items-center justify-center text-xs transition-all
                ${!hasAny ? 'group bg-stone-50 border-stone-100 text-stone-400 hover:bg-stone-100 hover:border-stone-200 hover:text-stone-600' : ''}
                ${cell.hasStandard ? 'bg-stone-100 border-stone-200 text-stone-800' : ''}
                ${cell.hasPmu ? 'bg-stone-900 border-stone-700 text-amber-100' : ''}
                ${isBoth ? 'bg-stone-800 border-stone-600 text-amber-100' : ''}
              `}
            >
              <span className={`font-semibold ${isToday ? 'w-6 h-6 rounded-full ring-2 ring-amber-500 ring-offset-2 ring-offset-inherit flex items-center justify-center text-[10px]' : ''}`}>
                {cell.day}
              </span>
              {hasAny && (
                <span className="mt-0.5 truncate w-full px-0.5 text-[10px]">
                  {isBoth ? 'S + P' : cell.stdTime || cell.pmuTime}
                </span>
              )}
              {!hasAny && <span className="text-[9px] opacity-0 group-hover:opacity-100 mt-0.5 transition-opacity">Přidat směnu</span>}
            </button>
          );
        })}
      </div>

      {/* Mobile: vertical agenda (day cards) */}
      <div className="flex flex-col gap-2 md:hidden pb-2">
        {monthDays.map((cell) => {
          const isToday = cell.dateKey === todayKey;
          const hasAny = cell.hasStandard || cell.hasPmu;
          const isPmuOnly = cell.hasPmu && !cell.hasStandard;
          const isStandardOnly = cell.hasStandard && !cell.hasPmu;
          const isBoth = cell.hasStandard && cell.hasPmu;
          const dayLabel = cell.date.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' });

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => handleCellClick(cell)}
              className={`
                w-full min-h-[60px] rounded-lg flex items-center justify-between gap-3 px-4 py-3 text-left
                touch-manipulation active:scale-[0.99] transition-transform
                ${!hasAny
                  ? 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-50 hover:border-stone-300'
                  : ''
                }
                ${isStandardOnly
                  ? 'bg-stone-50 border-l-4 border-stone-300 border border-stone-100 text-stone-800'
                  : ''
                }
                ${isPmuOnly || isBoth
                  ? 'bg-stone-900 border-l-4 border-amber-500 border border-stone-800 text-amber-50'
                  : ''
                }
              `}
            >
              <span className={`font-bold text-base shrink-0 ${isToday ? 'text-amber-600' : ''}`}>
                {dayLabel}
                {isToday && <span className="ml-1.5 text-xs font-medium">(dnes)</span>}
              </span>
              {!hasAny ? (
                <span className="shrink-0 p-2 rounded-full bg-stone-100 text-stone-400" aria-hidden>
                  <Plus size={18} />
                </span>
              ) : (
                <span className={`
                  text-xs font-semibold px-2.5 py-1 rounded-full shrink-0
                  ${isPmuOnly || isBoth ? 'bg-amber-500/20 text-amber-200' : 'bg-stone-200 text-stone-700'}
                `}>
                  {isBoth ? 'S + P' : (cell.stdTime || cell.pmuTime)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div>
        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Směny po týdnech</h4>
        <div className="space-y-4">
          {listByWeek.length === 0 && (
            <p className="text-sm text-stone-400 italic">Pro tento měsíc zatím nejsou zadané žádné směny.</p>
          )}
          {listByWeek.map((week) => (
            <div key={week.mon} className="border border-stone-200 rounded-xl overflow-hidden">
              <div className="bg-stone-50 px-3 py-2 text-xs font-bold text-stone-600 border-b border-stone-200">
                Týden {week.weekNum} ({week.mon} – {week.sun})
              </div>
              <ul className="divide-y divide-stone-100">
                {week.items.map((item, idx) => (
                  <li key={`${item.dateKey}-${item.type}-${idx}`} className="flex items-center justify-between gap-2 px-3 py-2 bg-white hover:bg-stone-50/80">
                    <span className="text-sm text-stone-700">
                      {item.date.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' })}.
                    </span>
                    <span className="text-sm font-medium text-stone-800">
                      {formatTimeRange(item.periods)}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${item.type === 'pmu' ? 'bg-stone-800 text-amber-100' : 'bg-stone-200 text-stone-700'}`}>
                      {item.label}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminDateInput(dateKeyToISO(item.dateKey));
                          setScheduleType(item.type);
                          document.getElementById('shift-edit-form')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="p-1.5 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                        aria-label="Upravit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                          type="button"
                          onClick={() => handleRemoveShift(item.dateKey, item.type)}
                          className="p-1.5 rounded text-stone-400 hover:text-red-600 hover:bg-red-50"
                          aria-label="Smazat"
                        >
                          <Trash2 size={14} />
                        </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { X, Plus, Calendar, ChevronRight, ChevronDown } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const MONTH_NAMES = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
];

const getDaysInMonth = (year, month) => {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const days = [];
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    days.push(Utils.formatDateKey(new Date(d)));
  }
  return days;
};

const getPeriodsForDay = (schedule, dateKey) => {
  const dayData = schedule[dateKey];
  if (!dayData) return [];
  return dayData.periods || (dayData.start ? [{ start: dayData.start, end: dayData.end }] : []);
};

const getDayType = (schedule, schedulePmu, dateKey) => {
  const hasK = getPeriodsForDay(schedule, dateKey).length > 0;
  const hasP = getPeriodsForDay(schedulePmu, dateKey).length > 0;
  if (hasK) return 'kosmetika';
  if (hasP) return 'pmu';
  return 'closed';
};

const TYPE_LABELS = { kosmetika: 'Kosmetika', pmu: 'PMU', closed: 'Zavřeno' };
const TYPE_LABELS_UPPER = { kosmetika: 'KOSMETIKA', pmu: 'PMU', closed: 'ZAVŘENO' };

const isValidTimeRange = (start, end) => {
  if (!start || !end) return false;
  return Utils.timeToMinutes(end) > Utils.timeToMinutes(start);
};

/** Generuje možnosti měsíců: cca 12 měsíců zpět a 12 dopředu od aktuálního */
const getMonthOptions = () => {
  const now = new Date();
  const options = [];
  for (let i = -12; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const value = `${y}-${String(m).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[m - 1]} ${y}`;
    options.push({ value, label });
  }
  return options;
};

const MONTH_OPTIONS = getMonthOptions();

const AdminShiftsTab = ({
  schedule = {},
  schedulePmu = {},
  onSaveDay,
}) => {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [monthInput, setMonthInput] = useState(defaultMonth);
  const [monthSelectOpen, setMonthSelectOpen] = useState(false);
  const monthSelectRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const [editingDateKey, setEditingDateKey] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editType, setEditType] = useState('kosmetika');
  const [editPeriods, setEditPeriods] = useState([]);
  const [editWorkStart, setEditWorkStart] = useState('09:00');
  const [editWorkEnd, setEditWorkEnd] = useState('17:00');
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    if (editingDateKey) {
      const id = requestAnimationFrame(() => setDrawerVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setDrawerVisible(false);
    }
  }, [editingDateKey]);

  const monthDays = useMemo(() => {
    const [y, m] = monthInput.split('-').map(Number);
    return getDaysInMonth(y, m);
  }, [monthInput]);

  const monthShifts = useMemo(() => {
    return monthDays.map((dateKey) => {
      const type = getDayType(schedule, schedulePmu, dateKey);
      const periodsK = getPeriodsForDay(schedule, dateKey);
      const periodsP = getPeriodsForDay(schedulePmu, dateKey);
      const dayPeriods = type === 'pmu' ? periodsP : periodsK;
      return {
        dateKey,
        displayShort: Utils.formatDateWithDayShort(dateKey),
        dayShort: Utils.getDayOfWeekShort(dateKey),
        dateOnly: dateKey ? `${dateKey.split('-')[0]}/${dateKey.split('-')[1]}` : '',
        type,
        periods: dayPeriods,
      };
    });
  }, [monthDays, schedule, schedulePmu]);

  const monthDisplayLabel = useMemo(() => {
    const opt = MONTH_OPTIONS.find((o) => o.value === monthInput);
    return opt ? opt.label : monthInput;
  }, [monthInput]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (monthSelectRef.current && !monthSelectRef.current.contains(e.target)) {
        setMonthSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startEdit = (dateKey) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    const type = getDayType(schedule, schedulePmu, dateKey);
    const periodsK = getPeriodsForDay(schedule, dateKey);
    const periodsP = getPeriodsForDay(schedulePmu, dateKey);
    const currentPeriods = type === 'pmu' ? periodsP : type === 'kosmetika' ? periodsK : [];
    setEditingDateKey(dateKey);
    setEditType(type);
    setEditPeriods(currentPeriods.length ? currentPeriods.map((p) => ({ ...p })) : []);
    setEditWorkStart('09:00');
    setEditWorkEnd('17:00');
    setTimeError('');
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setTimeError('');
    closeTimeoutRef.current = setTimeout(() => setEditingDateKey(null), 300);
  };

  const addEditPeriod = () => {
    setTimeError('');
    if (!isValidTimeRange(editWorkStart, editWorkEnd)) {
      setTimeError('Konec musí být po začátku');
      return;
    }
    setEditPeriods((prev) =>
      [...prev, { start: editWorkStart, end: editWorkEnd }].sort(
        (a, b) => Utils.timeToMinutes(a.start) - Utils.timeToMinutes(b.start)
      )
    );
  };

  const removeEditPeriod = (idx) => {
    setEditPeriods((prev) => prev.filter((_, i) => i !== idx));
    setTimeError('');
  };

  const updateEditPeriod = (idx, field, value) => {
    setEditPeriods((prev) => {
      const next = prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p));
      return next;
    });
    setTimeError('');
  };

  const saveEdit = async () => {
    if (!editingDateKey || !onSaveDay) return;
    if (editType !== 'closed' && editPeriods.some((p) => !isValidTimeRange(p.start, p.end))) {
      setTimeError('Každý blok musí mít konec po začátku');
      return;
    }
    setTimeError('');
    const typeToSave = editType;
    const periodsToSave = typeToSave === 'closed' ? [] : editPeriods.filter((p) => isValidTimeRange(p.start, p.end));
    await onSaveDay(editingDateKey, typeToSave, periodsToSave);
    closeDrawer();
  };

  const isDrawerOpen = !!editingDateKey;

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden" style={{ boxShadow: 'none' }}>
        <div className="p-6 md:p-8 pb-4">
          <h2 className="font-display text-xl font-semibold text-stone-800 mb-1 flex items-center gap-2">
            <Calendar size={20} className="text-stone-400" />
            Seznam směn
          </h2>
          <p className="text-sm text-stone-500 font-normal mb-6">
            Kliknutím na řádek otevřete úpravu směny (Kosmetika / PMU).
          </p>

          {/* Custom Select: Měsíc Rok – na mobilu větší dotyková plocha */}
          <div className="mb-6 relative" ref={monthSelectRef}>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Měsíc
            </label>
            <button
              type="button"
              onClick={() => setMonthSelectOpen((o) => !o)}
              className="flex items-center justify-between w-full max-w-[220px] min-h-12 h-12 md:h-12 px-4 py-3 md:py-0 border border-stone-200 rounded-lg bg-white text-stone-800 font-normal text-left hover:border-stone-300 transition-colors touch-manipulation"
              style={{ boxShadow: 'none', minHeight: '44px' }}
              aria-expanded={monthSelectOpen}
              aria-haspopup="listbox"
              aria-label="Vybrat měsíc"
            >
              <span>{monthDisplayLabel}</span>
              <ChevronDown size={20} className="text-stone-400 shrink-0 ml-2" />
            </button>
            {monthSelectOpen && (
              <ul
                role="listbox"
                className="absolute top-full left-0 mt-1 w-full max-w-[220px] max-h-60 overflow-y-auto border border-stone-200 rounded-lg bg-white py-1 z-10"
                style={{ boxShadow: 'none' }}
              >
                {MONTH_OPTIONS.map((opt) => (
                  <li key={opt.value} role="option" aria-selected={monthInput === opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        setMonthInput(opt.value);
                        setMonthSelectOpen(false);
                      }}
                      className={`w-full px-4 py-3 md:py-2.5 text-left text-sm font-normal transition-colors min-h-[44px] md:min-h-0 flex items-center touch-manipulation ${
                        monthInput === opt.value ? 'bg-stone-100 text-stone-800' : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="max-h-[440px] overflow-y-auto">
          {monthShifts.length === 0 ? (
            <p className="text-sm text-stone-500 font-normal italic px-6 pb-6">Žádné dny v měsíci.</p>
          ) : (
            <ul className="px-6 pb-6">
              {monthShifts.map(({ dateKey, dayShort, dateOnly, type, periods: dayPeriods }) => (
                <li key={dateKey} className="border-b last:border-b-0" style={{ borderColor: '#f0f0f0' }}>
                  <button
                    type="button"
                    onClick={() => startEdit(dateKey)}
                    className="w-full flex flex-wrap justify-between items-center gap-3 py-4 text-left transition-colors hover:bg-[#FAF7F2] focus:outline-none focus:bg-[#FAF7F2]"
                    style={{ paddingLeft: 0, paddingRight: 0 }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-stone-500 text-sm font-normal">{dayShort}</span>
                      <span className="text-stone-800 font-semibold text-sm">{dateOnly}</span>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0"
                      style={{ backgroundColor: '#FAF7F2', color: type === 'closed' ? '#a8a29e' : '#57534e' }}
                    >
                      {TYPE_LABELS_UPPER[type]}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 basis-full sm:basis-auto sm:flex-initial order-3 sm:order-none">
                      {dayPeriods.length > 0 ? (
                        <span className="text-sm text-stone-600 font-normal">
                          {dayPeriods.map((p) => `${p.start} — ${p.end}`).join(', ')}
                        </span>
                      ) : (
                        <span className="text-sm text-stone-400 font-normal italic">—</span>
                      )}
                      <ChevronRight size={18} className="text-stone-300 shrink-0" aria-hidden />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Slide-over (desktop) / Bottom Sheet (mobil) */}
      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40 transition-opacity"
            aria-hidden
            onClick={closeDrawer}
          />
          {/* Panel: na mobilu zdola (bottom sheet), na md+ zprava (slide-over) */}
          <div
            className={`
              fixed z-50 flex flex-col bg-white shadow-lg transition-transform duration-300 ease-out
              left-0 right-0 bottom-0 w-full max-h-[90vh] rounded-t-2xl
              md:top-0 md:bottom-0 md:left-auto md:right-0 md:max-w-md md:max-h-none md:rounded-none
              ${drawerVisible ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}
            `}
            style={{ backgroundColor: '#FFFFFF' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
          >
            {/* Handle – pouze na mobilu */}
            <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0" aria-hidden>
              <span className="w-10 h-1 rounded-full bg-stone-300" />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-6 pb-36 md:pb-32">
                <h2 id="drawer-title" className="text-lg font-semibold text-stone-800 mb-6">
                  Upravit: {editingDateKey ? Utils.formatDateWithDayLong(editingDateKey) : ''}
                </h2>

                {/* Přepínač: Kosmetika / PMU / Zavřeno */}
                <fieldset className="mb-6">
                  <legend className="sr-only">Typ dne</legend>
                  <div className="flex rounded-lg border border-stone-200 p-0.5 bg-stone-50/50">
                    {(['kosmetika', 'pmu', 'closed']).map((t) => (
                      <label
                        key={t}
                        className={`flex-1 py-2.5 px-4 text-center text-sm font-semibold rounded-md cursor-pointer transition-colors min-h-[44px] md:min-h-0 flex items-center justify-center ${
                          editType === t
                            ? 'bg-white text-stone-800 shadow-sm border border-stone-200'
                            : 'text-stone-600 hover:text-stone-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dayType"
                          value={t}
                          checked={editType === t}
                          onChange={() => setEditType(t)}
                          className="sr-only"
                        />
                        {TYPE_LABELS[t]}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {editType !== 'closed' && (
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Časové bloky
                    </p>
                    {editPeriods.length === 0 ? (
                      <p className="text-sm text-stone-500 font-normal italic">Žádné bloky. Přidejte níže.</p>
                    ) : (
                      <ul className="space-y-4">
                        {editPeriods.map((p, idx) => (
                          <li
                            key={idx}
                            className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3 p-4 bg-stone-50 rounded-lg border border-stone-100"
                          >
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:flex-1 md:min-w-0">
                              <input
                                type="time"
                                value={p.start}
                                onChange={(e) => updateEditPeriod(idx, 'start', e.target.value)}
                                className="flex-1 min-h-[44px] min-w-0 p-3 border border-stone-200 rounded-lg text-base font-normal text-stone-800 bg-white touch-manipulation"
                              />
                              <span className="hidden md:inline text-stone-400 font-normal">—</span>
                              <input
                                type="time"
                                value={p.end}
                                onChange={(e) => updateEditPeriod(idx, 'end', e.target.value)}
                                className="flex-1 min-h-[44px] min-w-0 p-3 border border-stone-200 rounded-lg text-base font-normal text-stone-800 bg-white touch-manipulation"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeEditPeriod(idx)}
                              className="p-2.5 md:p-2 self-start md:self-center text-stone-400 hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0 touch-manipulation"
                              title="Odebrat blok"
                              aria-label="Odebrat blok"
                            >
                              <X size={18} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:flex-1 md:min-w-0">
                        <input
                          type="time"
                          value={editWorkStart}
                          onChange={(e) => { setEditWorkStart(e.target.value); setTimeError(''); }}
                          className="min-h-[44px] min-w-0 p-3 border border-stone-200 rounded-lg text-base font-normal text-stone-800 bg-white touch-manipulation"
                        />
                        <span className="hidden md:inline text-stone-400 font-normal">—</span>
                        <input
                          type="time"
                          value={editWorkEnd}
                          onChange={(e) => { setEditWorkEnd(e.target.value); setTimeError(''); }}
                          className="min-h-[44px] min-w-0 p-3 border border-stone-200 rounded-lg text-base font-normal text-stone-800 bg-white touch-manipulation"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addEditPeriod}
                        className="w-full md:w-auto py-3 px-4 rounded-lg text-sm font-semibold text-stone-700 border border-stone-200 bg-white hover:bg-stone-50 transition-colors min-h-[44px] touch-manipulation"
                      >
                        <Plus size={16} className="inline mr-1.5 align-middle" />
                        Přidat blok
                      </button>
                    </div>
                    {timeError && (
                      <p className="text-sm text-red-600 font-normal" role="alert">
                        {timeError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Fixní patička – na mobilu sloupcově, Uložit full width, Zrušit jako odkaz */}
            <div
              className="absolute bottom-0 left-0 right-0 p-4 pt-3 border-t border-stone-100 bg-white flex flex-col gap-3 md:flex-row md:gap-3"
              style={{ backgroundColor: '#FFFFFF' }}
            >
              <button
                type="button"
                onClick={saveEdit}
                className="w-full bg-stone-800 text-white py-3.5 md:py-3 rounded-lg text-sm font-semibold hover:bg-stone-900 transition-colors min-h-[44px] touch-manipulation md:flex-1"
              >
                Uložit změny
              </button>
              <button
                type="button"
                onClick={closeDrawer}
                className="w-full md:w-auto py-3 md:py-3 rounded-lg text-sm font-normal text-stone-600 hover:text-stone-800 bg-transparent hover:underline text-center touch-manipulation min-h-[44px] md:min-h-0 flex items-center justify-center md:px-5"
              >
                Zrušit
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AdminShiftsTab;

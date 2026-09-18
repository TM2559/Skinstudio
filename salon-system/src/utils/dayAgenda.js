import { Utils } from './helpers';

/** Periody směny dne ze záznamu rozvrhu (nový tvar `periods` i starý `start`/`end`). */
export function getDayPeriods(dayData) {
  if (!dayData) return [];
  if (Array.isArray(dayData.periods) && dayData.periods.length > 0) return dayData.periods;
  if (dayData.start && dayData.end) return [{ start: dayData.start, end: dayData.end }];
  return [];
}

/**
 * Přehled jednoho dne: směny (kosmetika / PMU), rezervace a volná okna mezi nimi.
 * `items` je seřazený seznam { kind: 'booking' | 'free', startMin, endMin, ... }
 * pro vykreslení agendy. Volná okna kratší než `minGap` minut se vynechají.
 */
export function buildDayAgenda({ dateKey, schedule, schedulePmu, reservations, minGap = 30 }) {
  const shifts = [
    ...getDayPeriods(schedule?.[dateKey]).map((p) => ({ ...p, type: 'kosmetika' })),
    ...getDayPeriods(schedulePmu?.[dateKey]).map((p) => ({ ...p, type: 'pmu' })),
  ].sort((a, b) => Utils.timeToMinutes(a.start) - Utils.timeToMinutes(b.start));

  const bookings = (reservations || [])
    .filter((r) => r.date === dateKey && r.time)
    .map((r) => {
      const startMin = Utils.timeToMinutes(r.time);
      return { kind: 'booking', startMin, endMin: startMin + (Number(r.duration) || 60), reservation: r };
    })
    .sort((a, b) => a.startMin - b.startMin);

  const free = [];
  shifts.forEach((p) => {
    let cursor = Utils.timeToMinutes(p.start);
    const end = Utils.timeToMinutes(p.end);
    bookings.forEach((b) => {
      if (b.endMin <= cursor || b.startMin >= end) return;
      if (b.startMin - cursor >= minGap) free.push({ kind: 'free', startMin: cursor, endMin: b.startMin, type: p.type });
      cursor = Math.max(cursor, b.endMin);
    });
    if (end - cursor >= minGap) free.push({ kind: 'free', startMin: cursor, endMin: end, type: p.type });
  });

  const items = [...bookings, ...free].sort((a, b) => a.startMin - b.startMin || (a.kind === 'booking' ? -1 : 1));
  const freeMinutes = free.reduce((sum, f) => sum + (f.endMin - f.startMin), 0);

  return { shifts, bookings, items, freeMinutes };
}

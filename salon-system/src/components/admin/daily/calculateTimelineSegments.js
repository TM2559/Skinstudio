import { Utils } from '../../../utils/helpers';

function isValidTimeField(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Normalizuje dokument směny z Firestore na { periods: [{ start, end }] } nebo null.
 * Položky bez platných řetězců start/end ignoruje (ochrana proti poškozeným datům / null v poli).
 */
export function normalizeDayScheduleToShift(daySchedule) {
  if (!daySchedule) return null;
  const raw =
    daySchedule.periods?.length > 0
      ? daySchedule.periods
      : daySchedule.start
        ? [{ start: daySchedule.start, end: daySchedule.end }]
        : [];
  const valid = (Array.isArray(raw) ? raw : []).filter(
    (p) => p != null && isValidTimeField(p.start) && isValidTimeField(p.end)
  );
  if (valid.length === 0) return null;
  const periods = [...valid].sort(
    (a, b) => Utils.timeToMinutes(a.start) - Utils.timeToMinutes(b.start)
  );
  return { periods };
}

function reservationIntervalMinutes(r) {
  const start = Utils.timeToMinutes(r.time);
  const dur = Number(r.duration);
  const duration = Number.isFinite(dur) && dur > 0 ? dur : 60;
  return { start, end: start + duration };
}

function reservationKey(r) {
  const { end } = reservationIntervalMinutes(r);
  return r.id != null ? String(r.id) : `${r.time}-${end}`;
}

/**
 * @param {{ periods: { start: string, end: string }[] }} shift
 * @param {Array<{ id?: string, time: string, duration?: number }>} reservations – již filtrované na den, libovolné pořadí
 * @returns {Array<{ type: 'available', startMin: number, endMin: number } | { type: 'reservation', reservation: object }>}
 */
export function calculateTimelineSegments(shift, reservations) {
  if (!shift?.periods?.length) return [];

  const list = Array.isArray(reservations) ? reservations : [];
  const sortedRes = list
    .filter((r) => r != null && isValidTimeField(r.time))
    .sort((a, b) => Utils.timeToMinutes(a.time) - Utils.timeToMinutes(b.time));

  const segments = [];
  const emitted = new Set();

  for (const period of shift.periods) {
    const pStart = Utils.timeToMinutes(period.start);
    const pEnd = Utils.timeToMinutes(period.end);
    let cursor = pStart;

    const overlapping = sortedRes
      .map((r) => ({ r, ...reservationIntervalMinutes(r) }))
      .filter(({ start: rStart, end: rEnd }) => rStart < pEnd && rEnd > pStart)
      .sort((a, b) => a.start - b.start);

    for (const { r, start: rStart, end: rEnd } of overlapping) {
      const blockStart = Math.max(rStart, pStart);
      const blockEnd = Math.min(rEnd, pEnd);

      if (cursor < blockStart) {
        segments.push({ type: 'available', startMin: cursor, endMin: blockStart });
      }

      const key = reservationKey(r);
      if (!emitted.has(key)) {
        segments.push({ type: 'reservation', reservation: r, outsideShift: false });
        emitted.add(key);
      }

      cursor = Math.max(cursor, blockEnd);
    }

    if (cursor < pEnd) {
      segments.push({ type: 'available', startMin: cursor, endMin: pEnd });
    }
  }

  // Rezervace mimo směnu zobrazíme také (uživatel je chce vidět v přehledu dne).
  for (const r of sortedRes) {
    const key = reservationKey(r);
    if (!emitted.has(key)) {
      segments.push({ type: 'reservation', reservation: r, outsideShift: true });
      emitted.add(key);
    }
  }

  return segments;
}

/** Součet minut všech available segmentů (včetně kratších než 15 min). */
export function sumAvailableMinutes(segments) {
  return segments
    .filter((s) => s.type === 'available')
    .reduce((acc, s) => acc + (s.endMin - s.startMin), 0);
}

/**
 * Obsazené minuty jako sjednocení intervalů rezervací oříznutých o směnu (bez dvojího započtení překryvu).
 */
export function occupancyMinutesUnion(shift, reservations) {
  if (!shift?.periods?.length) return 0;

  const list = Array.isArray(reservations) ? reservations : [];
  const clips = [];
  for (const r of list) {
    if (r == null || !isValidTimeField(r.time)) continue;
    const { start, end } = reservationIntervalMinutes(r);
    for (const period of shift.periods) {
      const pStart = Utils.timeToMinutes(period.start);
      const pEnd = Utils.timeToMinutes(period.end);
      const lo = Math.max(start, pStart);
      const hi = Math.min(end, pEnd);
      if (hi > lo) clips.push([lo, hi]);
    }
  }

  clips.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [s, e] of clips) {
    const prev = merged[merged.length - 1];
    if (!prev || s > prev[1]) merged.push([s, e]);
    else prev[1] = Math.max(prev[1], e);
  }

  return merged.reduce((acc, [s, e]) => acc + (e - s), 0);
}

export function totalShiftMinutes(shift) {
  if (!shift?.periods?.length) return 0;
  return shift.periods.reduce((acc, p) => {
    return acc + (Utils.timeToMinutes(p.end) - Utils.timeToMinutes(p.start));
  }, 0);
}

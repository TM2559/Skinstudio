import { describe, it, expect } from 'vitest';
import {
  calculateTimelineSegments,
  normalizeDayScheduleToShift,
  occupancyMinutesUnion,
  totalShiftMinutes,
} from './calculateTimelineSegments';

describe('normalizeDayScheduleToShift', () => {
  it('returns null for empty input', () => {
    expect(normalizeDayScheduleToShift(null)).toBe(null);
    expect(normalizeDayScheduleToShift({})).toBe(null);
  });

  it('uses legacy start/end', () => {
    const s = normalizeDayScheduleToShift({ start: '10:00', end: '12:00' });
    expect(s.periods).toEqual([{ start: '10:00', end: '12:00' }]);
  });

  it('sorts periods by start time', () => {
    const s = normalizeDayScheduleToShift({
      periods: [
        { start: '13:00', end: '17:00' },
        { start: '09:00', end: '12:00' },
      ],
    });
    expect(s.periods[0].start).toBe('09:00');
    expect(s.periods[1].start).toBe('13:00');
  });

  it('returns null when periods only contain invalid entries', () => {
    expect(
      normalizeDayScheduleToShift({
        periods: [null, { start: '', end: '12:00' }, { start: '09:00' }],
      })
    ).toBe(null);
  });
});

describe('calculateTimelineSegments', () => {
  it('one period, no reservations: single available block', () => {
    const shift = normalizeDayScheduleToShift({ start: '09:00', end: '12:00' });
    const segs = calculateTimelineSegments(shift, []);
    expect(segs).toEqual([{ type: 'available', startMin: 9 * 60, endMin: 12 * 60 }]);
  });

  it('two periods: available in each, no slot across lunch', () => {
    const shift = normalizeDayScheduleToShift({
      periods: [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    });
    const segs = calculateTimelineSegments(shift, []);
    expect(segs).toHaveLength(2);
    expect(segs[0]).toMatchObject({ type: 'available', startMin: 540, endMin: 720 });
    expect(segs[1]).toMatchObject({ type: 'available', startMin: 780, endMin: 1020 });
  });

  it('reservation in the middle splits available gaps', () => {
    const shift = normalizeDayScheduleToShift({ start: '09:00', end: '12:00' });
    const segs = calculateTimelineSegments(shift, [
      { id: 'a', time: '10:00', duration: 60 },
    ]);
    expect(segs).toEqual([
      { type: 'available', startMin: 540, endMin: 600 },
      { type: 'reservation', reservation: { id: 'a', time: '10:00', duration: 60 }, outsideShift: false },
      { type: 'available', startMin: 660, endMin: 720 },
    ]);
  });

  it('gap under 15 minutes between two reservations is still emitted as segment', () => {
    const shift = normalizeDayScheduleToShift({ start: '09:00', end: '12:00' });
    const segs = calculateTimelineSegments(shift, [
      { id: 'a', time: '10:00', duration: 50 },
      { id: 'b', time: '11:00', duration: 30 },
    ]);
    const avail = segs.filter((s) => s.type === 'available');
    const tenGap = avail.find((s) => s.endMin - s.startMin === 10);
    expect(tenGap).toEqual({ type: 'available', startMin: 650, endMin: 660 });
  });

  it('overlapping reservations: each emitted once, cursor advances', () => {
    const shift = normalizeDayScheduleToShift({ start: '09:00', end: '12:00' });
    const segs = calculateTimelineSegments(shift, [
      { id: 'x', time: '10:00', duration: 90 },
      { id: 'y', time: '10:30', duration: 60 },
    ]);
    const resSegs = segs.filter((s) => s.type === 'reservation');
    expect(resSegs).toHaveLength(2);
  });

  it('reservation spanning period boundary: emitted once, second period gets correct gap', () => {
    const shift = normalizeDayScheduleToShift({
      periods: [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    });
    const segs = calculateTimelineSegments(shift, [{ id: 's', time: '11:00', duration: 180 }]);
    const resCount = segs.filter((s) => s.type === 'reservation').length;
    expect(resCount).toBe(1);
    const lastAvail = segs.filter((s) => s.type === 'available').pop();
    expect(lastAvail.endMin).toBe(17 * 60);
  });
});

describe('occupancyMinutesUnion', () => {
  it('clips reservation to shift', () => {
    const shift = normalizeDayScheduleToShift({ start: '09:00', end: '12:00' });
    const occ = occupancyMinutesUnion(shift, [{ time: '10:00', duration: 60 }]);
    expect(occ).toBe(60);
  });

  it('merges overlapping reservations within shift', () => {
    const shift = normalizeDayScheduleToShift({ start: '09:00', end: '12:00' });
    const occ = occupancyMinutesUnion(shift, [
      { time: '10:00', duration: 60 },
      { time: '10:30', duration: 60 },
    ]);
    expect(occ).toBe(90);
  });

  it('totalShiftMinutes matches period length', () => {
    const shift = normalizeDayScheduleToShift({
      periods: [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '14:00' },
      ],
    });
    expect(totalShiftMinutes(shift)).toBe(3 * 60 + 60);
  });
});

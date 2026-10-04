import { describe, it, expect } from 'vitest';
import { buildDayAgenda, getDayPeriods } from './dayAgenda';

const res = (time, duration, extra = {}) => ({ id: `${time}`, date: '22-09-2026', time, duration, name: 'X', ...extra });

describe('dayAgenda', () => {
  it('reads both schedule shapes', () => {
    expect(getDayPeriods({ periods: [{ start: '09:00', end: '12:00' }] })).toHaveLength(1);
    expect(getDayPeriods({ start: '09:00', end: '17:00' })).toEqual([{ start: '09:00', end: '17:00' }]);
    expect(getDayPeriods(undefined)).toEqual([]);
  });

  it('lists bookings and free gaps inside the shift', () => {
    const a = buildDayAgenda({
      dateKey: '22-09-2026',
      schedule: { '22-09-2026': { periods: [{ start: '09:00', end: '13:00' }] } },
      schedulePmu: {},
      reservations: [res('10:00', 60), res('11:00', 90), { ...res('09:00', 60), date: '23-09-2026' }],
    });
    expect(a.bookings).toHaveLength(2);
    expect(a.items.map((i) => [i.kind, i.startMin, i.endMin])).toEqual([
      ['free', 540, 600],
      ['booking', 600, 660],
      ['booking', 660, 750],
      ['free', 750, 780],
    ]);
    expect(a.freeMinutes).toBe(90);
  });

  it('skips gaps shorter than minGap and keeps bookings outside shifts', () => {
    const a = buildDayAgenda({
      dateKey: '22-09-2026',
      schedule: { '22-09-2026': { start: '09:00', end: '10:20' } },
      schedulePmu: {},
      reservations: [res('09:00', 60), res('18:00', 60)],
    });
    expect(a.items.map((i) => i.kind)).toEqual(['booking', 'booking']);
  });

  it('marks PMU shifts', () => {
    const a = buildDayAgenda({
      dateKey: '22-09-2026',
      schedule: {},
      schedulePmu: { '22-09-2026': { periods: [{ start: '09:00', end: '11:00' }] } },
      reservations: [],
    });
    expect(a.shifts[0].type).toBe('pmu');
    expect(a.items).toEqual([{ kind: 'free', startMin: 540, endMin: 660, type: 'pmu' }]);
  });
});

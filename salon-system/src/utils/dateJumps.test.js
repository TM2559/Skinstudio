import { describe, it, expect } from 'vitest';
import { addWeeksISO, addDaysISO, mondayOfISO, laterISO, weeksLabel, shortDateCs } from './dateJumps';

describe('dateJumps', () => {
  it('adds weeks across month and year boundaries', () => {
    expect(addWeeksISO('2026-09-18', 6)).toBe('2026-10-30');
    expect(addWeeksISO('2026-12-10', 4)).toBe('2027-01-07');
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('is not shifted by the DST change (29. 3. / 25. 10. 2026)', () => {
    expect(addWeeksISO('2026-03-25', 1)).toBe('2026-04-01');
    expect(addWeeksISO('2026-10-21', 1)).toBe('2026-10-28');
  });

  it('finds Monday of the week', () => {
    expect(mondayOfISO('2026-09-18')).toBe('2026-09-14'); // pátek
    expect(mondayOfISO('2026-09-20')).toBe('2026-09-14'); // neděle
    expect(mondayOfISO('2026-09-14')).toBe('2026-09-14'); // pondělí
  });

  it('picks the later date', () => {
    expect(laterISO('2026-09-18', '2026-10-01')).toBe('2026-10-01');
    expect(laterISO('2026-11-01', '2026-10-01')).toBe('2026-11-01');
  });

  it('formats Czech labels', () => {
    expect(weeksLabel(1)).toBe('1 týden');
    expect(weeksLabel(4)).toBe('4 týdny');
    expect(weeksLabel(6)).toBe('6 týdnů');
    expect(shortDateCs('2026-10-30')).toBe('pá 30. 10.');
  });
});

/**
 * Unit testy pro src/utils/helpers.js
 * Testují převody času, formátování dat, filtraci služeb (kosmetika vs PMU) a logiku volných slotů (getSmartSlots).
 */
import { describe, it, expect } from 'vitest';
import { filterCosmeticsServices, Utils } from './helpers';

describe('filterCosmeticsServices', () => {
  // Na /rezervace (kosmetika) se smí zobrazit jen STANDARD – PMU služby se tam nesmí dostat.
  it('returns only STANDARD (cosmetics) services, excludes PMU', () => {
    const mixed = [
      { id: 'c1', name: 'Čištění pleti', category: 'STANDARD' },
      { id: 'p1', name: 'PMU obočí', category: 'PMU' },
      { id: 'c2', name: 'Masáž', category: 'STANDARD' },
    ];
    const result = filterCosmeticsServices(mixed);
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual(['c1', 'c2']);
    expect(result.some((s) => s.category === 'PMU')).toBe(false);
  });

  it('treats missing category as STANDARD (cosmetics)', () => {
    const withMissing = [
      { id: 'a', name: 'Služba bez category', category: undefined },
      { id: 'b', name: 'PMU', category: 'PMU' },
    ];
    const result = filterCosmeticsServices(withMissing);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('returns empty array for empty or non-array input', () => {
    expect(filterCosmeticsServices([])).toEqual([]);
    expect(filterCosmeticsServices(null)).toEqual([]);
    expect(filterCosmeticsServices(undefined)).toEqual([]);
  });

  it('returns all when all are STANDARD', () => {
    const all = [
      { id: '1', name: 'A', category: 'STANDARD' },
      { id: '2', name: 'B' },
    ];
    expect(filterCosmeticsServices(all)).toHaveLength(2);
  });
});

describe('Utils Helper Functions', () => {
  // --- Čas: převod řetězec ↔ minuty ---
  it('correctly converts time string to minutes', () => {
    expect(Utils.timeToMinutes('01:00')).toBe(60);
  });
  it('correctly converts minutes to time string', () => {
    expect(Utils.minutesToTime(60)).toBe('01:00');
  });
  it('formats date key for display', () => {
    expect(Utils.formatDateDisplay('2026-01-26')).toBe('2026/01/26');
  });
  it('generates correct time options', () => {
    expect(Utils.generateTimeOptions()).toContain('06:00');
  });

  // --- getSmartSlots: „magnet“ režim pro krátké služby (≤30 min) při existující rezervaci ---
  it('Strict Clustering: 30 min service sticks ONLY to existing reservation', () => {
    // SCÉNÁŘ: Den MÁ rezervaci (16:00-16:30).
    // Hledáme 30 min službu.
    const periods = [{ start: '09:00', end: '17:00' }];
    const duration = 30;
    const booked = [{ start: 960, end: 990 }]; // 16:00 - 16:30

    const slots = Utils.getSmartSlots(periods, duration, booked);

    // OČEKÁVÁNÍ:
    // 09:00 (Start směny) -> NE (Den už má rezervace, nechceme drobit)
    expect(slots).not.toContain('09:00');

    // 15:30 (Hned PŘED rezervací) -> ANO
    expect(slots).toContain('15:30');

    // 16:30 (Hned PO rezervaci) -> ANO
    expect(slots).toContain('16:30');
  });

  it('Empty Day: 30 min service can be ANYWHERE (First come, first served)', () => {
    // SCÉNÁŘ: Den je úplně PRÁZDNÝ.
    // Hledáme 30 min službu.
    const periods = [{ start: '09:00', end: '17:00' }];
    const duration = 30;
    const booked = [];

    const slots = Utils.getSmartSlots(periods, duration, booked);

    // OČEKÁVÁNÍ:
    // ZMĚNA: Klient má absolutní svobodu.
    
    // 09:00 (Start) -> ANO
    expect(slots).toContain('09:00');
    
    // 13:00 (Uprostřed) -> ANO (Toto dříve nešlo, teď už ano!)
    expect(slots).toContain('13:00');
    
    // 16:30 (Konec) -> ANO
    expect(slots).toContain('16:30');
  });

  // Dlouhá služba (60 min) nebo prázdný den: všechny volné sloty jsou povolené.
  it('Free Logic: 60 min service can be anywhere', () => {
    const periods = [{ start: '09:00', end: '17:00' }];
    const duration = 60;
    const booked = [{ start: 960, end: 990 }]; // 16:00-16:30

    const slots = Utils.getSmartSlots(periods, duration, booked);

    expect(slots).toContain('09:00');
    expect(slots).toContain('10:00');
  });

  // Žádný slot nesmí kolidovat s obsazeným intervalem (10:00–11:00).
  it('excludes slots that collide with existing booking', () => {
    const periods = [{ start: '09:00', end: '12:00' }];
    const duration = 60;
    const booked = [{ start: 600, end: 660 }]; // 10:00-11:00

    const slots = Utils.getSmartSlots(periods, duration, booked);

    expect(slots).not.toContain('09:30'); // překrývá 10:00-11:00
    expect(slots).not.toContain('10:00');
    expect(slots).toContain('09:00');
    expect(slots).toContain('11:00');
  });
});

describe('Utils date helpers', () => {
  // formatDateKey: objekt Date → klíč ve formátu DD-MM-YYYY pro rozvrh.
  it('formatDateKey formats Date to DD-MM-YYYY', () => {
    const d = new Date(2026, 0, 15); // 15.1.2026
    expect(Utils.formatDateKey(d)).toBe('15-01-2026');
  });

  it('formatDateKey pads single digit day and month', () => {
    const d = new Date(2026, 0, 5);
    expect(Utils.formatDateKey(d)).toBe('05-01-2026');
  });

  // getDateKeyFromISO: ISO řetězec (YYYY-MM-DD) → DD-MM-YYYY.
  it('getDateKeyFromISO parses ISO date (YYYY-MM-DD) to DD-MM-YYYY', () => {
    expect(Utils.getDateKeyFromISO('2026-01-26')).toBe('26-01-2026');
  });

  it('getDateKeyFromISO returns empty string for null/undefined', () => {
    expect(Utils.getDateKeyFromISO(null)).toBe('');
    expect(Utils.getDateKeyFromISO('')).toBe('');
  });

  it('formatDateDisplay returns empty string for falsy input', () => {
    expect(Utils.formatDateDisplay('')).toBe('');
  });
});

describe('Utils createGoogleCalendarLink', () => {
  // Odkaz pro přidání události do Google kalendáře: základní URL a parametry včetně dates.
  it('builds valid Google Calendar URL with date in DD-MM-YYYY format', () => {
    const url = Utils.createGoogleCalendarLink(
      '26-01-2026', '10:00', 60, 'Test', 'Desc'
    );
    expect(url).toContain('https://www.google.com/calendar/render');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('text=Test');
    expect(url).toContain('details=Desc');
    expect(url).toContain('location=Skin+Studio');
    expect(url).toMatch(/dates=\d{8}T\d{6}Z/);
  });

  // Podpora obou formátů data (DD-MM-YYYY i YYYY-MM-DD).
  it('builds valid URL with date in YYYY-MM-DD format', () => {
    const url = Utils.createGoogleCalendarLink(
      '2026-01-26', '14:30', 30, 'Rezervace', 'Popis'
    );
    expect(url).toContain('https://www.google.com/calendar/render');
    expect(url).toContain('text=Rezervace');
  });
});
import { describe, it, expect } from 'vitest';
import { Utils } from './helpers';

describe('Utils Helper Functions', () => {
  
  // Základní testy
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

  // --- TESTY PRO CLUSTERING (v2) ---

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

  it('Free Logic: 60 min service can be anywhere', () => {
    const periods = [{ start: '09:00', end: '17:00' }];
    const duration = 60;
    const booked = [{ start: 960, end: 990 }]; // 16:00-16:30

    const slots = Utils.getSmartSlots(periods, duration, booked);

    expect(slots).toContain('09:00');
    expect(slots).toContain('10:00');
  });
});
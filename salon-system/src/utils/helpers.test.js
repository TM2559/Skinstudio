import { describe, it, expect } from 'vitest';
import { Utils } from './helpers';

describe('Utils Helper Functions', () => {
  
  // --- ZÁKLADNÍ TESTY (Převody a formátování) ---
  it('correctly converts time string to minutes', () => {
    expect(Utils.timeToMinutes('01:00')).toBe(60);
    expect(Utils.timeToMinutes('00:00')).toBe(0);
    expect(Utils.timeToMinutes('01:30')).toBe(90);
    expect(Utils.timeToMinutes('')).toBe(0);
  });

  it('correctly converts minutes to time string', () => {
    expect(Utils.minutesToTime(60)).toBe('01:00');
    expect(Utils.minutesToTime(90)).toBe('01:30');
    expect(Utils.minutesToTime(0)).toBe('00:00');
  });

  it('formats date key for display', () => {
    expect(Utils.formatDateDisplay('2026-01-26')).toBe('2026/01/26');
    expect(Utils.formatDateDisplay('')).toBe('');
  });

  it('generates correct time options', () => {
    const options = Utils.generateTimeOptions();
    expect(Array.isArray(options)).toBe(true);
    expect(options[0]).toBe('06:00');
    expect(options).toContain('06:30');
  });

  // --- TESTY PRO HYBRIDNÍ LOGIKU (getSmartSlots) ---

  it('Strict Logic for 30 min service (Magnet Mode)', () => {
    // SCÉNÁŘ:
    // Směna: 09:00 - 12:00
    // Rezervace uprostřed: 10:30 - 11:00
    // Hledáme: 30 min službu
    
    // Časová osa v minutách:
    // 09:00 = 540
    // 12:00 = 720
    // Rezervace: 630 - 660
    
    const periods = [{ start: '09:00', end: '12:00' }];
    const duration = 30;
    const booked = [{ start: 630, end: 660 }]; // 10:30 - 11:00

    const slots = Utils.getSmartSlots(periods, duration, booked);

    // OČEKÁVÁNÍ (Magnet):
    // Musí se dotýkat začátku směny, konce směny nebo rezervace.
    
    // 1. 09:00 (Start směny) -> ANO
    expect(slots).toContain('09:00');

    // 2. 10:00 (Končí v 10:30 = začátek rezervace) -> ANO (Tvůj požadavek "před")
    expect(slots).toContain('10:00');

    // 3. 11:00 (Začíná v 11:00 = konec rezervace) -> ANO
    expect(slots).toContain('11:00');

    // 4. 11:30 (Končí v 12:00 = konec směny) -> ANO
    expect(slots).toContain('11:30');

    // NEŽÁDOUCÍ ČASY (Rozdrobení):
    // 09:30 -> NE (Vytvořilo by díru 09:00-09:30 a 10:00-10:30)
    expect(slots).not.toContain('09:30');
  });

  it('Free Logic for 60 min service (Anywhere)', () => {
    // SCÉNÁŘ:
    // Směna: 09:00 - 13:00
    // Žádná rezervace (celý blok volný)
    // Hledáme: 60 min službu
    
    const periods = [{ start: '09:00', end: '13:00' }];
    const duration = 60;
    const booked = [];

    const slots = Utils.getSmartSlots(periods, duration, booked);

    // OČEKÁVÁNÍ (Volný režim):
    // Můžeme si vybrat jakýkoliv čas, kam se vejdeme.
    expect(slots).toContain('09:00');
    expect(slots).toContain('09:30'); // Tady je to OK, netlačíme na magnet
    expect(slots).toContain('10:00');
    expect(slots).toContain('10:30');
    expect(slots).toContain('11:00');
    expect(slots).toContain('11:30');
    expect(slots).toContain('12:00');
    
    // 12:30 už ne, protože končí v 13:30 (mimo směnu)
    expect(slots).not.toContain('12:30');
  });

  it('Handles complex day with multiple reservations', () => {
     // SCÉNÁŘ (30 min služba):
     // Směna 09:00 - 17:00
     // Rezervace: 10:00-11:00
     
     const periods = [{ start: '09:00', end: '17:00' }];
     const duration = 30;
     const booked = [{ start: 600, end: 660 }]; // 10:00 - 11:00
     
     const slots = Utils.getSmartSlots(periods, duration, booked);
     
     // Magnetické body:
     // 09:00 (Start dne)
     // 09:30 (Končí v 10:00 = začátek rezervace)
     // 11:00 (Konec rezervace)
     // 16:30 (Končí v 17:00 = konec dne)
     
     expect(slots).toContain('09:00');
     expect(slots).toContain('09:30');
     expect(slots).toContain('11:00');
     expect(slots).toContain('16:30');
     
     // Náhodný čas uprostřed volného bloku
     // 13:00 -> NE (je to uprostřed ničeho, magnet nedovolí)
     expect(slots).not.toContain('13:00');
  });
});
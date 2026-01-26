import { describe, it, expect } from 'vitest';
import { Utils } from './helpers';

describe('Utils Helper Functions', () => {
  
  // Testujeme převod času na minuty (např. "01:00" -> 60)
  it('correctly converts time string to minutes', () => {
    expect(Utils.timeToMinutes('01:00')).toBe(60);
    expect(Utils.timeToMinutes('00:00')).toBe(0);
    expect(Utils.timeToMinutes('01:30')).toBe(90);
    expect(Utils.timeToMinutes('')).toBe(0);
  });

  // Testujeme převod minut zpět na čas (např. 60 -> "01:00")
  it('correctly converts minutes to time string', () => {
    expect(Utils.minutesToTime(60)).toBe('01:00');
    expect(Utils.minutesToTime(90)).toBe('01:30');
    expect(Utils.minutesToTime(0)).toBe('00:00');
  });

  // Testujeme formátování data pro zobrazení
  it('formats date key for display', () => {
    expect(Utils.formatDateDisplay('2026-01-26')).toBe('2026/01/26');
    expect(Utils.formatDateDisplay('')).toBe('');
  });

  // Testujeme generování časových slotů
  it('generates correct time options', () => {
    const options = Utils.generateTimeOptions();
    expect(Array.isArray(options)).toBe(true);
    expect(options[0]).toBe('06:00');
    expect(options).toContain('06:30');
  });
});
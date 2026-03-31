import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateStrip from './DateStrip';

function makeDates(count) {
  const dates = [];
  const base = new Date(2026, 2, 1);
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    dates.push(d);
  }
  return dates;
}

describe('DateStrip', () => {
  const dates = makeDates(5);
  const slotsPerDate = new Map([
    ['01-03-2026', 3],
    ['02-03-2026', 0],
    ['03-03-2026', 5],
    ['04-03-2026', 2],
    ['05-03-2026', 1],
  ]);
  const onSelect = vi.fn();

  it('renders date buttons', () => {
    render(
      <DateStrip dates={dates} activeDateStr="01-03-2026" slotsPerDate={slotsPerDate}
        selectedService={{ id: 's1' }} isDark={false} onSelect={onSelect} />
    );
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('calls onSelect when clicking an available date', () => {
    render(
      <DateStrip dates={dates} activeDateStr="01-03-2026" slotsPerDate={slotsPerDate}
        selectedService={{ id: 's1' }} isDark={false} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByText('3'));
    expect(onSelect).toHaveBeenCalled();
  });

  it('disables dates with 0 slots', () => {
    render(
      <DateStrip dates={dates} activeDateStr="01-03-2026" slotsPerDate={slotsPerDate}
        selectedService={{ id: 's1' }} isDark={false} onSelect={onSelect} />
    );
    const btn = screen.getByText('2').closest('button');
    expect(btn.disabled).toBe(true);
  });

  it('shows empty message when no dates', () => {
    render(
      <DateStrip dates={[]} activeDateStr={null} slotsPerDate={new Map()}
        selectedService={null} isDark={false} onSelect={onSelect} />
    );
    expect(screen.getByText(/nejsou vypsány/i)).toBeTruthy();
  });

  it('renders in dark mode', () => {
    render(
      <DateStrip dates={dates} activeDateStr="01-03-2026" slotsPerDate={slotsPerDate}
        selectedService={{ id: 's1' }} isDark={true} onSelect={onSelect} />
    );
    expect(screen.getByText('1')).toBeTruthy();
  });
});

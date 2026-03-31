import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimeGrid from './TimeGrid';

describe('TimeGrid', () => {
  const slots = ['09:00', '09:30', '10:00', '10:30'];
  const onSelect = vi.fn();

  it('renders all time slots', () => {
    render(<TimeGrid slots={slots} selectedTime={null} isDark={false} onSelect={onSelect} />);
    slots.forEach((t) => {
      expect(screen.getByText(t)).toBeTruthy();
    });
  });

  it('calls onSelect when a slot is clicked', () => {
    render(<TimeGrid slots={slots} selectedTime={null} isDark={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('10:00'));
    expect(onSelect).toHaveBeenCalledWith('10:00');
  });

  it('highlights selected time', () => {
    render(<TimeGrid slots={slots} selectedTime="09:30" isDark={false} onSelect={onSelect} />);
    const btn = screen.getByText('09:30');
    expect(btn.className).toContain('text-white');
  });

  it('renders empty grid when no slots', () => {
    const { container } = render(<TimeGrid slots={[]} selectedTime={null} isDark={false} onSelect={onSelect} />);
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  it('renders in dark mode', () => {
    render(<TimeGrid slots={slots} selectedTime="09:00" isDark={true} onSelect={onSelect} />);
    const btn = screen.getByText('09:00');
    expect(btn.className).toContain('text-white');
  });
});

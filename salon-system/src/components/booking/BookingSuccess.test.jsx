import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookingSuccess from './BookingSuccess';

vi.mock('../../utils/helpers', () => ({
  Utils: {
    formatDateDisplay: (d) => d,
    createGoogleCalendarLink: () => 'https://calendar.google.com/test',
    downloadICSFile: vi.fn(),
  },
}));

const details = {
  date: '01-03-2026',
  time: '10:00',
  duration: 60,
  serviceName: 'Masáž',
  price: 800,
};

describe('BookingSuccess', () => {
  it('renders confirmation heading', () => {
    render(<BookingSuccess isDark={false} reservationDetails={details} onReset={vi.fn()} />);
    expect(screen.getByText('Vaše rezervace je potvrzena')).toBeTruthy();
  });

  it('shows service name and price', () => {
    render(<BookingSuccess isDark={false} reservationDetails={details} onReset={vi.fn()} />);
    expect(screen.getByText('Masáž')).toBeTruthy();
    expect(screen.getByText('800 Kč')).toBeTruthy();
  });

  it('shows date and time', () => {
    render(<BookingSuccess isDark={false} reservationDetails={details} onReset={vi.fn()} />);
    expect(screen.getByText('01-03-2026 v 10:00')).toBeTruthy();
  });

  it('renders calendar buttons', () => {
    render(<BookingSuccess isDark={false} reservationDetails={details} onReset={vi.fn()} />);
    expect(screen.getByText(/Apple Kalendář/)).toBeTruthy();
    expect(screen.getByText(/Google Kalendář/)).toBeTruthy();
  });

  it('calls onReset when "Zpět" is clicked', () => {
    const onReset = vi.fn();
    render(<BookingSuccess isDark={false} reservationDetails={details} onReset={onReset} />);
    fireEvent.click(screen.getByText('Zpět na nabídku služeb'));
    expect(onReset).toHaveBeenCalled();
  });

  it('shows PMU instructions in dark mode', () => {
    render(<BookingSuccess isDark={true} reservationDetails={details} onReset={vi.fn()} />);
    expect(screen.getByText(/Důležité před zákrokem/)).toBeTruthy();
  });

  it('hides PMU instructions in light mode', () => {
    render(<BookingSuccess isDark={false} reservationDetails={details} onReset={vi.fn()} />);
    expect(screen.queryByText(/Důležité před zákrokem/)).toBeNull();
  });

  it('Google Calendar link has correct href', () => {
    render(<BookingSuccess isDark={false} reservationDetails={details} onReset={vi.fn()} />);
    const link = screen.getByText(/Google Kalendář/).closest('a');
    expect(link.href).toContain('calendar.google.com');
  });
});

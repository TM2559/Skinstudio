import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

let mockLocationState = null;
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/dekujeme', state: mockLocationState }),
  useNavigate: () => mockNavigate,
  Navigate: ({ to }) => <div data-testid="redirect" data-to={to} />,
}));

vi.mock('./booking/BookingSuccess', () => ({
  default: ({ reservationDetails, isDark }) => (
    <div data-testid="booking-success">
      <span>{reservationDetails.serviceName}</span>
      <span>{isDark ? 'dark' : 'light'}</span>
    </div>
  ),
}));

import ThankYouPage from './ThankYouPage';

describe('ThankYouPage', () => {
  it('renders BookingSuccess with state', () => {
    mockLocationState = { serviceName: 'Masáž', date: '01-03-2026', time: '10:00', duration: 60, price: 800, theme: 'light' };
    render(<ThankYouPage />);
    expect(screen.getByTestId('booking-success')).toBeTruthy();
    expect(screen.getByText('Masáž')).toBeTruthy();
    expect(screen.getByText('light')).toBeTruthy();
  });

  it('renders dark mode for PMU theme', () => {
    mockLocationState = { serviceName: 'PMU obočí', date: '01-03-2026', time: '10:00', duration: 120, price: 5000, theme: 'dark' };
    render(<ThankYouPage />);
    expect(screen.getByText('dark')).toBeTruthy();
  });

  it('redirects to / when no state', () => {
    mockLocationState = null;
    render(<ThankYouPage />);
    expect(screen.getByTestId('redirect')).toBeTruthy();
    expect(screen.getByTestId('redirect').getAttribute('data-to')).toBe('/');
  });
});

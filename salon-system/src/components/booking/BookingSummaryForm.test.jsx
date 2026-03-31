import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookingSummaryForm, { calculateReservationTotal } from './BookingSummaryForm';

describe('calculateReservationTotal', () => {
  it('returns service price when no upsells', () => {
    expect(calculateReservationTotal({ price: 800 }, [])).toBe(800);
  });

  it('returns 0 for isStartingPrice service with no upsells', () => {
    expect(calculateReservationTotal({ price: 800, isStartingPrice: true }, [])).toBe(0);
  });

  it('adds ADD upsells to base', () => {
    const service = { price: 800 };
    const upsells = [{ price: 200, price_behavior: 'ADD' }];
    expect(calculateReservationTotal(service, upsells)).toBe(1000);
  });

  it('REPLACE upsell overrides base price', () => {
    const service = { price: 800 };
    const upsells = [{ price: 1200, price_behavior: 'REPLACE' }];
    expect(calculateReservationTotal(service, upsells)).toBe(1200);
  });

  it('last REPLACE wins, ADD is added on top', () => {
    const service = { price: 800 };
    const upsells = [
      { price: 500, price_behavior: 'REPLACE' },
      { price: 900, price_behavior: 'REPLACE' },
      { price: 100, price_behavior: 'ADD' },
    ];
    expect(calculateReservationTotal(service, upsells)).toBe(1000);
  });

  it('handles null/undefined upsells', () => {
    expect(calculateReservationTotal({ price: 500 }, null)).toBe(500);
    expect(calculateReservationTotal({ price: 500 }, undefined)).toBe(500);
  });

  it('handles null service', () => {
    expect(calculateReservationTotal(null, [])).toBe(0);
  });
});

describe('BookingSummaryForm', () => {
  const defaultProps = {
    selectedService: { name: 'Masáž', price: 800, isStartingPrice: false },
    selectedUpsells: [],
    selectedTime: '10:00',
    activeDateStr: '01-03-2026',
    isDark: false,
    formData: { name: '', phone: '', email: '' },
    setFormData: vi.fn(),
    isSending: false,
    onSubmit: vi.fn(),
  };

  it('renders service name and price', () => {
    render(<BookingSummaryForm {...defaultProps} />);
    expect(screen.getByText('Masáž')).toBeTruthy();
    expect(screen.getByText('800 Kč')).toBeTruthy();
  });

  it('shows "—" for isStartingPrice services', () => {
    render(<BookingSummaryForm {...defaultProps} selectedService={{ name: 'X', price: 800, isStartingPrice: true }} />);
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('renders form fields', () => {
    render(<BookingSummaryForm {...defaultProps} />);
    expect(screen.getByPlaceholderText('Vaše jméno')).toBeTruthy();
    expect(screen.getByPlaceholderText('Telefon')).toBeTruthy();
    expect(screen.getByPlaceholderText('E-mail pro potvrzení')).toBeTruthy();
  });

  it('calls onSubmit when form is submitted', () => {
    render(<BookingSummaryForm {...defaultProps} />);
    fireEvent.submit(screen.getByRole('button', { name: /potvrdit/i }).closest('form'));
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('shows loading state when isSending', () => {
    render(<BookingSummaryForm {...defaultProps} isSending={true} />);
    expect(screen.getByText('Odesílám...')).toBeTruthy();
  });

  it('disables form when no time selected', () => {
    const { container } = render(<BookingSummaryForm {...defaultProps} selectedTime={null} />);
    const form = container.querySelector('form');
    expect(form.className).toContain('pointer-events-none');
  });

  it('shows upsells in summary', () => {
    const upsells = [{ id: 'u1', name: 'Extra', price: 200, price_behavior: 'ADD' }];
    render(<BookingSummaryForm {...defaultProps} selectedUpsells={upsells} />);
    expect(screen.getByText('+ Extra:')).toBeTruthy();
    expect(screen.getByText('200 Kč')).toBeTruthy();
  });

  it('calls setFormData on input change', () => {
    const setFormData = vi.fn();
    render(<BookingSummaryForm {...defaultProps} setFormData={setFormData} />);
    fireEvent.change(screen.getByPlaceholderText('Vaše jméno'), { target: { value: 'Jan' } });
    expect(setFormData).toHaveBeenCalled();
  });
});

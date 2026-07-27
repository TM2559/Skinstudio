import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GiftVoucherCheckoutPage from './GiftVoucherCheckoutPage';
import VoucherSuccessPage from './VoucherSuccessPage';

vi.mock('react-router-dom', async () => await import('../../test-utils/mockRouter.jsx'));

const mockCallCreateVoucherOrder = vi.fn();

vi.mock('../../contexts/DataContext', () => ({
  useData: () => ({
    voucherTemplates: [
      { id: 'v1', name: 'Poukaz 2000 Kč', type: 'value', price: 2000, is_active: true, category: 'value' },
      {
        id: 'vc',
        name: 'Vlastní částka',
        type: 'value',
        price: 500,
        is_active: true,
        category: 'value',
        is_custom_amount: true,
      },
      { id: 'v2', name: 'Me time', type: 'service', price: 1500, is_active: true, category: 'cosmetics' },
    ],
  }),
}));

vi.mock('../../firebaseConfig', () => ({
  callCreateVoucherOrder: (...args) => mockCallCreateVoucherOrder(...args),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    footer: ({ children, ...props }) => <footer {...props}>{children}</footer>,
    img: (props) => <img {...props} />,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/darkove-poukazy']}>
      <Routes>
        <Route path="/darkove-poukazy" element={<GiftVoucherCheckoutPage />} />
        <Route path="/poukaz/success" element={<VoucherSuccessPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('GiftVoucherCheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders type cards; lists nominals / services after expanding a type', () => {
    renderWithRouter();
    expect(screen.getByRole('heading', { level: 1, name: 'Dárkový poukaz' })).toBeInTheDocument();
    // Typy poukazu jsou radio karty
    expect(screen.getByRole('radio', { name: /Hodnotový poukaz/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Konkrétní ošetření/i })).toBeInTheDocument();
    // Nominál se zobrazí až po výběru typu
    expect(screen.queryByRole('button', { name: /2\s*000\s*Kč/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /Hodnotový poukaz/i }));
    expect(screen.getByRole('button', { name: /2\s*000\s*Kč/ })).toBeInTheDocument();
    // Přepnutí na konkrétní ošetření zobrazí seznam služeb
    fireEvent.click(screen.getByRole('radio', { name: /Konkrétní ošetření/i }));
    expect(screen.getByText('Me time')).toBeInTheDocument();
  });

  it('shows empty summary state and CTA before a voucher is selected', () => {
    renderWithRouter();
    expect(screen.getByText('Zatím nevybráno.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Závazně objednat/i })).toBeInTheDocument();
  });

  it('shows summary total after selecting a voucher', () => {
    renderWithRouter();
    fireEvent.click(screen.getByRole('radio', { name: /Hodnotový poukaz/i }));
    fireEvent.click(screen.getByRole('button', { name: /2\s*000\s*Kč/ }));
    expect(screen.getByText('Celkem')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Závazně objednat/i })).toBeInTheDocument();
    expect(screen.getAllByText(/2\s*000\s*Kč/).length).toBeGreaterThan(0);
  });

  it('adds 100 Kč for box packaging', () => {
    renderWithRouter();
    fireEvent.click(screen.getByRole('radio', { name: /Hodnotový poukaz/i }));
    fireEvent.click(screen.getByRole('button', { name: /2\s*000\s*Kč/ }));
    expect(screen.getByText('Celkem')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /Luxusní dárková krabička/i }));
    expect(screen.getByText(/2\s*100\s*Kč/)).toBeInTheDocument();
  });

  it('submits order and navigates to success when form valid', async () => {
    mockCallCreateVoucherOrder.mockResolvedValueOnce({ data: { orderId: 'ord-1', total_price: 2000 } });
    renderWithRouter();
    fireEvent.click(screen.getByRole('radio', { name: /Hodnotový poukaz/i }));
    fireEvent.click(screen.getByRole('button', { name: /2\s*000\s*Kč/ }));
    fireEvent.change(screen.getByPlaceholderText(/vas@email/), { target: { value: 'test@example.cz' } });
    fireEvent.change(screen.getByPlaceholderText(/\+420/), { target: { value: '+420 123 456 789' } });
    fireEvent.click(screen.getByRole('button', { name: /Závazně objednat/i }));
    await waitFor(() => {
      expect(mockCallCreateVoucherOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          voucherId: 'v1',
          packaging: 'envelope',
          contactEmail: 'test@example.cz',
        })
      );
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Děkujeme za objednávku' })).toBeInTheDocument();
    });
  });

  it('submits custom amount template with voucherId and customAmountKc', async () => {
    mockCallCreateVoucherOrder.mockResolvedValueOnce({ data: { orderId: 'ord-2', total_price: 1500 } });
    renderWithRouter();
    // Karta "Vlastní hodnota" auto-vybere custom voucher a zobrazí input
    fireEvent.click(screen.getByRole('radio', { name: /Vlastní hodnota/i }));
    const amountInput = screen.getByLabelText('Vlastní částka v korunách');
    fireEvent.change(amountInput, { target: { value: '1500' } });
    fireEvent.change(screen.getByPlaceholderText(/vas@email/), { target: { value: 'a@b.cz' } });
    fireEvent.change(screen.getByPlaceholderText(/\+420/), { target: { value: '+420 123 456 789' } });
    fireEvent.click(screen.getByRole('button', { name: /Závazně objednat/i }));
    await waitFor(() => {
      expect(mockCallCreateVoucherOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          voucherId: 'vc',
          customAmountKc: 1500,
          contactEmail: 'a@b.cz',
        })
      );
    });
  });
});

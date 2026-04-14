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

  it('renders category cards; lists concrete vouchers after expanding a type', () => {
    renderWithRouter();
    expect(screen.getByRole('heading', { level: 1, name: 'Dárkový poukaz' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hodnotový poukaz/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Kosmetické ošetření/i })).toBeInTheDocument();
    expect(screen.queryByText('Poukaz 2000 Kč')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Hodnotový poukaz/i }));
    expect(screen.getByText('Poukaz 2000 Kč')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Zobrazit znovu všechny typy poukazů/i }));
    expect(screen.queryByText('Poukaz 2000 Kč')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Kosmetické ošetření/i }));
    expect(screen.getByText('Me time')).toBeInTheDocument();
  });

  it('does not show footer CTA before voucher is selected', () => {
    renderWithRouter();
    expect(screen.queryByRole('button', { name: 'Závazně objednat' })).not.toBeInTheDocument();
  });

  it('shows footer and CTA after selecting a voucher', () => {
    renderWithRouter();
    fireEvent.click(screen.getByRole('button', { name: /Hodnotový poukaz/i }));
    fireEvent.click(screen.getByText('Poukaz 2000 Kč'));
    expect(screen.getByRole('button', { name: 'Pokračovat' })).toBeInTheDocument();
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent(/Celkem/);
    expect(footer).toHaveTextContent(/2\s*000 Kč/);
  });

  it('adds 100 Kč for box packaging', () => {
    renderWithRouter();
    fireEvent.click(screen.getByRole('button', { name: /Hodnotový poukaz/i }));
    fireEvent.click(screen.getByText('Poukaz 2000 Kč'));
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent(/2\s*000 Kč/);
    fireEvent.click(screen.getByText('Luxusní dárková krabička'));
    expect(footer).toHaveTextContent(/2\s*100 Kč/);
  });

  it('submits order and navigates to success when form valid', async () => {
    mockCallCreateVoucherOrder.mockResolvedValueOnce({ data: { orderId: 'ord-1', total_price: 2000 } });
    renderWithRouter();
    fireEvent.click(screen.getByRole('button', { name: /Hodnotový poukaz/i }));
    fireEvent.click(screen.getByText('Poukaz 2000 Kč'));
    fireEvent.change(screen.getByPlaceholderText(/vas@email/), { target: { value: 'test@example.cz' } });
    const phoneInput = screen.getByPlaceholderText(/\+420/);
    fireEvent.change(phoneInput, { target: { value: '+420 123 456 789' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pokračovat' }));
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
    mockCallCreateVoucherOrder.mockResolvedValueOnce({ data: { orderId: 'ord-2', total_price: 600 } });
    renderWithRouter();
    fireEvent.click(screen.getByRole('button', { name: /Hodnotový poukaz/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Poukaz na … Kč/ }));
    const amountInput = screen.getByRole('textbox', { name: /minimálně 500/i });
    fireEvent.change(amountInput, { target: { value: '1500' } });
    fireEvent.change(screen.getByPlaceholderText(/vas@email/), { target: { value: 'a@b.cz' } });
    const phoneInput = screen.getByPlaceholderText(/\+420/);
    fireEvent.change(phoneInput, { target: { value: '+420 123 456 789' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pokračovat' }));
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

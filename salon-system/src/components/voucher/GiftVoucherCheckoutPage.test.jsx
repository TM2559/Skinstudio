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
    footer: ({ children, ...props }) => <footer {...props}>{children}</footer>,
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

  it('renders voucher sections and cards when templates exist', () => {
    renderWithRouter();
    expect(screen.getByText('Dárkový poukaz')).toBeInTheDocument();
    expect(screen.getByText('Poukaz 2000 Kč')).toBeInTheDocument();
    expect(screen.getByText('Me time')).toBeInTheDocument();
    expect(screen.getByText('Hodnotové poukazy')).toBeInTheDocument();
    expect(screen.getByText('Zážitkové balíčky')).toBeInTheDocument();
  });

  it('does not show footer CTA before voucher is selected', () => {
    renderWithRouter();
    expect(screen.queryByRole('button', { name: 'Závazně objednat' })).not.toBeInTheDocument();
  });

  it('shows footer and CTA after selecting a voucher', () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Poukaz 2000 Kč'));
    expect(screen.getByRole('button', { name: 'Závazně objednat' })).toBeInTheDocument();
    expect(screen.getByText(/Celkem k úhradě/)).toBeInTheDocument();
    const totalRow = screen.getByText(/Celkem k úhradě/).parentElement;
    expect(totalRow).toHaveTextContent(/2\s*000 Kč/);
  });

  it('adds 100 Kč for box packaging', () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Poukaz 2000 Kč'));
    const totalRow = screen.getByText(/Celkem k úhradě/).parentElement;
    expect(totalRow).toHaveTextContent(/2\s*000 Kč/);
    fireEvent.click(screen.getByText('Luxusní dárková krabička'));
    expect(totalRow).toHaveTextContent(/2\s*100 Kč/);
  });

  it('submits order and navigates to success when form valid', async () => {
    mockCallCreateVoucherOrder.mockResolvedValueOnce({ data: { orderId: 'ord-1', total_price: 2000 } });
    renderWithRouter();
    fireEvent.click(screen.getByText('Poukaz 2000 Kč'));
    fireEvent.change(screen.getByPlaceholderText(/vas@email/), { target: { value: 'test@example.cz' } });
    const phoneInput = screen.getByPlaceholderText(/\+420/);
    fireEvent.change(phoneInput, { target: { value: '+420 123 456 789' } });
    fireEvent.click(screen.getByRole('button', { name: 'Závazně objednat' }));
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
      expect(screen.getByRole('heading', { level: 1, name: 'Objednávka byla přijata' })).toBeInTheDocument();
    });
  });
});

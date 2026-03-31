import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VoucherSuccessPage from './VoucherSuccessPage';

vi.mock('react-router-dom', async () => await import('../../test-utils/mockRouter.jsx'));

function renderWithState(state = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/poukaz/success', state }]}>
      <VoucherSuccessPage />
    </MemoryRouter>
  );
}

describe('VoucherSuccessPage', () => {
  it('renders thank-you heading and email copy', () => {
    renderWithState({});
    expect(screen.getByRole('heading', { level: 1, name: 'Děkujeme za objednávku' })).toBeInTheDocument();
    expect(
      screen.getByText(/Váš dárkový poukaz jsme začali připravovat\. Detaily k platbě a vyzvednutí jsme vám právě odeslali na e-mail\./)
    ).toBeInTheDocument();
  });

  it('renders summary with total and voucher label from state', () => {
    renderWithState({
      totalPrice: 3100,
      voucherLabel: 'Hodnotový poukaz',
      pickupSummaryLine: 'Osobní vyzvednutí (zítra)',
    });
    expect(screen.getByRole('heading', { name: 'Shrnutí' })).toBeInTheDocument();
    expect(screen.getByText('Hodnotový poukaz')).toBeInTheDocument();
    expect(screen.getByText(/3\s*100 Kč/)).toBeInTheDocument();
    expect(screen.getByText('Osobní vyzvednutí (zítra)')).toBeInTheDocument();
    expect(screen.getByText('Zdarma')).toBeInTheDocument();
  });

  it('renders em dash for price when no totalPrice in state', () => {
    renderWithState({});
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders link back to home', () => {
    renderWithState({});
    const link = screen.getByRole('link', { name: /Zpět na úvodní stránku/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});

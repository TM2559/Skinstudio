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
  it('renders success heading and thank you text', () => {
    renderWithState({});
    expect(screen.getByRole('heading', { level: 1, name: 'Objednávka byla přijata' })).toBeInTheDocument();
    expect(screen.getByText(/Děkujeme. Váš dárkový poukaz začínáme připravovat/)).toBeInTheDocument();
  });

  it('renders next steps with total price from state', () => {
    renderWithState({ totalPrice: 3100 });
    expect(screen.getByText(/Vyčkejte na SMS s potvrzením a adresou pro vyzvednutí/)).toBeInTheDocument();
    expect(screen.getByText(/Připravte si prosím přesnou hotovost \(3\s*100 Kč\)/)).toBeInTheDocument();
  });

  it('renders 0 Kč when no state totalPrice', () => {
    renderWithState({});
    expect(screen.getByText(/0 Kč/)).toBeInTheDocument();
  });

  it('renders link back to home', () => {
    renderWithState({});
    const link = screen.getByRole('link', { name: /Zpět na úvodní stránku/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});

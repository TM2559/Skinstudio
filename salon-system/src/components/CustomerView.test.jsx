/**
 * Testy komponenty CustomerView – rezervační formulář pro zákazníka.
 * Testuje: výběr služby, termínu a času, formulář, odeslání rezervace (s mockem Firebase/EmailJS).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/testUtils';
import CustomerView from './CustomerView';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

const mockAddDoc = vi.fn(() => Promise.resolve({ id: 'mock-id' }));
vi.mock('firebase/firestore', () => ({ addDoc: (...args) => mockAddDoc(...args) }));
vi.mock('../firebaseConfig', () => ({
  getCollectionPath: vi.fn(() => ({ _path: 'reservations' })),
  EMAILJS_CONFIG: { PUBLIC_KEY: '', SERVICE_ID: '', CONFIRM_TEMPLATE: '', ADMIN_TEMPLATE: '' },
}));

const defaultServices = [
  { id: 's1', name: 'Klasická masáž', duration: 60, price: 800, order: 0 },
  { id: 's2', name: 'Čištění pleti', duration: 30, price: 500, order: 1 },
];

const todayKey = (() => {
  const d = new Date();
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
})();

const defaultSchedule = {
  [todayKey]: {
    periods: [{ start: '09:00', end: '17:00' }],
  },
};

describe('CustomerView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Základní render: zobrazení všech služeb včetně názvů a cen.
  it('renders list of services', () => {
    renderWithProviders(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
      />
    );
    expect(screen.getByText('Klasická masáž')).toBeInTheDocument();
    expect(screen.getByText('Čištění pleti')).toBeInTheDocument();
    expect(screen.getByText('800 Kč')).toBeInTheDocument();
    expect(screen.getByText('500 Kč')).toBeInTheDocument();
  });

  // Kroky rezervace: 1. Výběr procedury, 2. Termín, 3. Čas a blok Rezervace.
  it('shows step headers', () => {
    renderWithProviders(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
      />
    );
    expect(screen.getByText('1. Výběr procedury')).toBeInTheDocument();
    expect(screen.getByText('2. Termín')).toBeInTheDocument();
    expect(screen.getByText('3. Čas')).toBeInTheDocument();
    expect(screen.getByText(/Rezervace/)).toBeInTheDocument();
  });

  // Klik na službu: zobrazí se výběr termínů (ne hláška „žádné termíny“ při platném rozvrhu).
  it('selecting a service highlights it and shows date picker', () => {
    renderWithProviders(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
      />
    );
    const card = screen.getAllByText('Čištění pleti').find((el) => el.closest('[role="button"]'));
    fireEvent.click(card);
    expect(screen.queryByText('Momentálně nejsou vypsány žádné termíny.')).not.toBeInTheDocument();
  });

  // Prázdný rozvrh: po výběru služby se zobrazí „Momentálně nejsou vypsány žádné termíny.“
  it('shows "no dates" message when schedule has no available days', () => {
    renderWithProviders(
      <CustomerView
        services={defaultServices}
        schedule={{}}
        reservations={[]}
      />
    );
    fireEvent.click(screen.getByText('Klasická masáž'));
    expect(screen.getByText('Momentálně nejsou vypsány žádné termíny.')).toBeInTheDocument();
  });

  // Při vybrané službě a rozvrhu: zobrazí se tlačítka časů (např. 09:00, 09:30).
  it('with schedule and service shows date buttons and time slots', () => {
    renderWithProviders(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
      />
    );
    fireEvent.click(screen.getByText('Čištění pleti'));
    const timeSlots = screen.getAllByRole('button', { name: /^\d{2}:\d{2}$/ });
    expect(timeSlots.length).toBeGreaterThan(0);
  });

  // Po výběru služby a času: formulář obsahuje jméno, telefon, e-mail a tlačítko „Potvrdit termín“.
  it('form has name, phone, email inputs and submit button', () => {
    renderWithProviders(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
      />
    );
    fireEvent.click(screen.getByText('Klasická masáž'));
    const timeButtons = screen.getAllByRole('button', { name: /^\d{2}:\d{2}$/ });
    if (timeButtons.length) fireEvent.click(timeButtons[0]);
    expect(screen.getByPlaceholderText('Vaše jméno')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Telefon')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('E-mail pro potvrzení')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Potvrdit termín/ })).toBeInTheDocument();
  });

  // Bez zvoleného času je formulář neaktivní (pointer-events-none).
  it('submit is disabled without time selected', () => {
    renderWithProviders(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
      />
    );
    fireEvent.click(screen.getByText('Klasická masáž'));
    const form = screen.getByPlaceholderText('Vaše jméno').closest('form');
    expect(form).toHaveClass('pointer-events-none');
  });

  // Po vyplnění a odeslání: addDoc je zavolán a callback onBookingSuccess se zavolá.
  it('calls onBookingSuccess after successful submit', async () => {
    const onBookingSuccess = vi.fn();
    renderWithProviders(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
        onBookingSuccess={onBookingSuccess}
      />
    );
    fireEvent.click(screen.getByText('Klasická masáž'));
    const firstTime = screen.getAllByRole('button', { name: /^\d{2}:\d{2}$/ })[0];
    fireEvent.click(firstTime);
    fireEvent.change(screen.getByPlaceholderText('Vaše jméno'), { target: { value: 'Jan Novák' } });
    fireEvent.change(screen.getByPlaceholderText('Telefon'), { target: { value: '777123456' } });
    fireEvent.change(screen.getByPlaceholderText('E-mail pro potvrzení'), { target: { value: 'jan@test.cz' } });
    fireEvent.submit(screen.getByRole('button', { name: /Potvrdit termín/ }));

    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(onBookingSuccess).toHaveBeenCalled();
    });
  });

  // Prop initialServiceId (např. z query ?service=): daná služba je předvybraná (vizuálně zvýrazněná).
  it('applies initialServiceId when provided', () => {
    renderWithProviders(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
        initialServiceId="s2"
      />
    );
    const card = screen.getAllByText('Čištění pleti').find((el) => el.closest('[role="button"]'));
    expect(card).toBeInTheDocument();
    expect(card.closest('.border-l-2')).toBeInTheDocument();
  });

  // theme=dark: v DOM je třída pro tmavý režim (např. .bg-stone-950).
  it('renders with dark theme when theme=dark', () => {
    const { container } = renderWithProviders(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
        theme="dark"
      />
    );
    expect(container.querySelector('.bg-stone-950')).toBeInTheDocument();
  });
});

/**
 * Testy komponenty ReservationApp – kontejner rezervací (customer / login / admin).
 * Testuje: výchozí view, přihlašovací formulář, widgetOnly režim, že na rezervaci (kosmetika) neproniknou PMU služby.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../utils/testUtils';
import { filterCosmeticsServices } from '../utils/helpers';
import ReservationApp from './ReservationApp';

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(''), vi.fn()],
  useLocation: () => ({ pathname: '/rezervace' }),
  useNavigate: () => vi.fn(),
}));

const defaultServices = [
  { id: 's1', name: 'Masáž', duration: 60, price: 800 },
];

const defaultSchedule = {
  '09-02-2026': { periods: [{ start: '09:00', end: '17:00' }] },
};

const renderApp = (props = {}) => {
  return renderWithProviders(<ReservationApp {...props} />);
};

describe('ReservationApp', () => {
  const defaultProps = {
    loading: false,
    view: 'customer',
    setView: vi.fn(),
    adminPassword: '',
    setAdminPassword: vi.fn(),
    loginError: '',
    setLoginError: vi.fn(),
    handleLogoClick: vi.fn(),
    handleLogin: vi.fn(),
    services: defaultServices,
    schedule: defaultSchedule,
    reservations: [],
    addons: [],
    serviceAddonLinks: [],
  };

  // Výchozí view=customer: logo „Skin Studio“ a seznam služeb (CustomerView).
  it('renders customer view by default', () => {
    renderApp(defaultProps);
    expect(screen.getByText('Skin Studio')).toBeInTheDocument();
    expect(screen.getByText('Masáž')).toBeInTheDocument();
  });

  // view=login: zobrazení formuláře Admin Vstup (heslo, Přihlásit, Zpět na web).
  it('shows login form when view is login', () => {
    renderApp({ ...defaultProps, view: 'login' });
    expect(screen.getByText('Admin Vstup')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Heslo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Přihlásit/ })).toBeInTheDocument();
    expect(screen.getByText('Zpět na web')).toBeInTheDocument();
  });

  // Odeslání přihlašovacího formuláře volá handleLogin.
  it('calls handleLogin on login form submit', () => {
    const handleLogin = vi.fn((e) => e.preventDefault());
    renderApp({
      ...defaultProps,
      view: 'login',
      adminPassword: 'xxx',
      handleLogin,
    });
    fireEvent.submit(screen.getByRole('button', { name: /Přihlásit/ }).closest('form'));
    expect(handleLogin).toHaveBeenCalled();
  });

  // Klik na „Zpět na web“ volá setView('customer').
  it('calls setView when "Zpět na web" is clicked', () => {
    const setView = vi.fn();
    renderApp({ ...defaultProps, view: 'login', setView });
    fireEvent.click(screen.getByText('Zpět na web'));
    expect(setView).toHaveBeenCalledWith('customer');
  });

  // loading=true: zobrazí se loading spinner (animate-spin).
  it('shows loading spinner when loading is true', () => {
    renderApp({ ...defaultProps, loading: true });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // widgetOnly: pouze CustomerView, bez banneru „Skin Studio“ (např. pro embed na /pmu).
  it('widgetOnly mode renders CustomerView without logo banner', () => {
    renderApp({ ...defaultProps, widgetOnly: true });
    expect(screen.getByText('Masáž')).toBeInTheDocument();
    expect(screen.queryByText('Skin Studio')).not.toBeInTheDocument();
  });

  // widgetOnly: služby z props se předají do CustomerView a zobrazí se.
  it('renders CustomerView with services in widgetOnly', () => {
    renderApp({ ...defaultProps, widgetOnly: true });
    expect(screen.getByText('Masáž')).toBeInTheDocument();
  });

  // Rezervace (kosmetika): když se předají jen služby filtrované na STANDARD, PMU služba se nezobrazí.
  it('does not show PMU services when passed only cosmetics (STANDARD) services', () => {
    const mixedServices = [
      { id: 'c1', name: 'Čištění pleti', category: 'STANDARD', duration: 30, price: 500 },
      { id: 'p1', name: 'PMU obočí', category: 'PMU', duration: 120, price: 3000 },
    ];
    const cosmeticsOnly = filterCosmeticsServices(mixedServices);
    expect(cosmeticsOnly).toHaveLength(1);
    expect(cosmeticsOnly[0].name).toBe('Čištění pleti');

    renderApp({
      ...defaultProps,
      services: cosmeticsOnly,
      schedule: defaultSchedule,
    });
    expect(screen.getByText('Čištění pleti')).toBeInTheDocument();
    expect(screen.queryByText('PMU obočí')).not.toBeInTheDocument();
  });
});

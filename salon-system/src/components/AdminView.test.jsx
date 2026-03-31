/**
 * Testy komponenty AdminView – admin rozhraní (rezervace, služby, úprava služby).
 * Testuje: po kliknutí na „Upravit“ u služby zůstane zobrazen záložka Služby a formulář pro úpravu (ne prázdná obrazovka).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../utils/testUtils';
import AdminView from './AdminView';

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
  deleteDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  setDoc: vi.fn(() => Promise.resolve()),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  query: vi.fn((ref, ...args) => ({ ref, args })),
  where: vi.fn(() => ({})),
}));

vi.mock('../firebaseConfig', () => ({
  getCollectionPath: vi.fn((...path) => ({ _path: path.join('/') })),
  getDocPath: vi.fn((...path) => ({ _path: path.join('/') })),
  EMAILJS_CONFIG: { PUBLIC_KEY: '', SERVICE_ID: '', REMINDER_TEMPLATE: '', ADMIN_TEMPLATE: '' },
}));

const defaultServices = [
  { id: 's1', name: 'Klasická masáž', duration: 60, price: 800, description: '' },
  { id: 's2', name: 'Čištění pleti', duration: 30, price: 500, description: '' },
];

const defaultProps = {
  services: defaultServices,
  schedule: {},
  schedulePmu: {},
  reservations: [],
  addons: [],
  serviceAddonLinks: [],
  onLogout: vi.fn(),
};

describe('AdminView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
  });

  it('after clicking Služby and then Edit on a service, edit form is visible (not blank screen)', () => {
    renderWithProviders(<AdminView {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Služby/ }));
    expect(screen.getByText('Nový produkt / Služba')).toBeInTheDocument();
    expect(screen.getByText('Klasická masáž')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Upravit Klasická masáž' }));

    expect(screen.getByText('Upravit produkt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Uložit změny' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zrušit' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Název')).toHaveValue('Klasická masáž');
  });
});

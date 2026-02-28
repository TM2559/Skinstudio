import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminAddonsTab from './AdminAddonsTab';

const mockAddDoc = vi.fn(() => Promise.resolve({ id: 'new-id' }));
const mockUpdateDoc = vi.fn(() => Promise.resolve());
const mockDeleteDoc = vi.fn(() => Promise.resolve());

vi.mock('firebase/firestore', () => ({
  addDoc: (...args) => mockAddDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
}));
vi.mock('../../firebaseConfig', () => ({
  getCollectionPath: vi.fn((name) => ({ _path: name })),
  getDocPath: vi.fn((col, id) => ({ _path: `${col}/${id}` })),
}));

const addons = [
  { id: 'a1', name: 'Sérum', default_price: 200, is_active: true, price_behavior: 'ADD' },
  { id: 'a2', name: 'Maska', default_price: 300, is_active: false, price_behavior: 'REPLACE' },
];

describe('AdminAddonsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('renders list of addons', () => {
    render(<AdminAddonsTab addons={addons} />);
    expect(screen.getByText('Sérum')).toBeTruthy();
    expect(screen.getByText('Maska')).toBeTruthy();
  });

  it('shows inactive label', () => {
    render(<AdminAddonsTab addons={addons} />);
    expect(screen.getByText('Neaktivní')).toBeTruthy();
  });

  it('shows empty state when no addons', () => {
    render(<AdminAddonsTab addons={[]} />);
    expect(screen.getByText(/Zatím nemáte žádné add-ony/)).toBeTruthy();
  });

  it('creates new addon on form submit', async () => {
    render(<AdminAddonsTab addons={addons} />);
    fireEvent.change(screen.getByPlaceholderText(/Název/), { target: { value: 'Nový add-on' } });
    fireEvent.submit(screen.getByText('+ Přidat add-on').closest('form'));
    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalledTimes(1);
    });
  });

  it('does not submit empty name', async () => {
    render(<AdminAddonsTab addons={addons} />);
    fireEvent.submit(screen.getByText('+ Přidat add-on').closest('form'));
    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it('starts editing when edit button is clicked', () => {
    render(<AdminAddonsTab addons={addons} />);
    const editBtns = screen.getAllByTitle('Upravit');
    fireEvent.click(editBtns[0]);
    expect(screen.getByDisplayValue('Sérum')).toBeTruthy();
    expect(screen.getByText('Uložit změny')).toBeTruthy();
  });

  it('deletes addon when delete is confirmed', async () => {
    render(<AdminAddonsTab addons={addons} />);
    const deleteBtns = screen.getAllByTitle('Smazat');
    fireEvent.click(deleteBtns[0]);
    await waitFor(() => {
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });
  });

  it('cancels edit when Zrušit is clicked', () => {
    render(<AdminAddonsTab addons={addons} />);
    fireEvent.click(screen.getAllByTitle('Upravit')[0]);
    expect(screen.getByText('Zrušit')).toBeTruthy();
    fireEvent.click(screen.getByText('Zrušit'));
    expect(screen.getByText('+ Přidat add-on')).toBeTruthy();
  });
});

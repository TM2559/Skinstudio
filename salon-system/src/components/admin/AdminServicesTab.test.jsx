/**
 * Testy komponenty AdminServicesTab – záložka Služby v adminu.
 * Testuje: zobrazení formuláře pro novou službu, režim úpravy služby, Zrušit, volání onStartEdit.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminServicesTab from './AdminServicesTab';

const defaultServices = [
  { id: 's1', name: 'Klasická masáž', duration: 60, price: 800, description: 'Popis masáže' },
  { id: 's2', name: 'Čištění pleti', duration: 30, price: 500, description: '' },
];

const noop = () => {};

const defaultProps = {
  services: defaultServices,
  editingServiceId: null,
  serviceForm: { name: '', price: '', duration: '60', description: '', category: 'STANDARD' },
  setServiceForm: vi.fn(),
  onService: vi.fn(),
  onDeleteService: vi.fn(),
  onStartEdit: vi.fn(),
  moveService: vi.fn(),
  onDragStart: noop,
  onDragOver: noop,
  onDragEnd: noop,
  onDrop: noop,
  draggedItemIndex: null,
  onCancelEdit: vi.fn(),
};

describe('AdminServicesTab', () => {
  it('renders list of services and form for new service', () => {
    render(<AdminServicesTab {...defaultProps} />);
    expect(screen.getByText('Služby')).toBeInTheDocument();
    expect(screen.getByText('Nový produkt / Služba')).toBeInTheDocument();
    expect(screen.getByText('Klasická masáž')).toBeInTheDocument();
    expect(screen.getByText('Čištění pleti')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Název')).toHaveValue('');
    expect(screen.getByRole('button', { name: '+ Přidat' })).toBeInTheDocument();
  });

  it('when editingServiceId is set shows "Upravit produkt" and form filled with service data', () => {
    render(
      <AdminServicesTab
        {...defaultProps}
        editingServiceId="s1"
        serviceForm={{
          name: 'Klasická masáž',
          price: 800,
          duration: '60',
          description: 'Popis masáže',
          category: 'STANDARD',
        }}
      />
    );
    expect(screen.getByText('Upravit produkt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Uložit změny' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zrušit' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Název')).toHaveValue('Klasická masáž');
    expect(screen.getByPlaceholderText('Cena')).toHaveValue(800);
  });

  it('calls onCancelEdit when Zrušit is clicked', () => {
    const onCancelEdit = vi.fn();
    render(
      <AdminServicesTab
        {...defaultProps}
        editingServiceId="s1"
        serviceForm={{ name: 'Masáž', price: 800, duration: '60', description: '', category: 'STANDARD' }}
        onCancelEdit={onCancelEdit}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Zrušit' }));
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });

  it('renders category select with Kosmetika and PMU options', () => {
    render(<AdminServicesTab {...defaultProps} />);
    const categorySelect = screen.getByLabelText('Kategorie');
    expect(categorySelect).toBeInTheDocument();
    expect(categorySelect).toHaveValue('STANDARD');
    const options = categorySelect.querySelectorAll('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveValue('STANDARD');
    expect(options[0]).toHaveTextContent('Kosmetika');
    expect(options[1]).toHaveValue('PMU');
    expect(options[1]).toHaveTextContent('PMU (permanentní make-up)');
  });

  it('calls onStartEdit with service when edit button is clicked on a service row', () => {
    const onStartEdit = vi.fn();
    render(<AdminServicesTab {...defaultProps} onStartEdit={onStartEdit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Upravit Klasická masáž' }));
    expect(onStartEdit).toHaveBeenCalledWith(defaultServices[0]);
  });
});

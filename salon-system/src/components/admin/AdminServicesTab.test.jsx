/**
 * Testy komponenty AdminServicesTab – záložka Služby v adminu.
 * Testuje: zobrazení formuláře, režim úpravy, Zrušit, onStartEdit, AI Vylepšit (format-content).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminServicesTab from './AdminServicesTab';

const defaultServices = [
  { id: 's1', name: 'Klasická masáž', duration: 60, price: 800, description: 'Popis masáže' },
  { id: 's2', name: 'Čištění pleti', duration: 30, price: 500, description: '' },
];

const noop = () => {};

const defaultProps = {
  services: defaultServices,
  editingServiceId: null,
  serviceForm: {
    name: '',
    price: '',
    duration: '60',
    description: '',
    category: 'STANDARD',
    isStartingPrice: false,
    availableForGiftVoucher: false,
  },
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
          isStartingPrice: false,
          availableForGiftVoucher: false,
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
        serviceForm={{
          name: 'Masáž',
          price: 800,
          duration: '60',
          description: '',
          category: 'STANDARD',
          isStartingPrice: false,
          availableForGiftVoucher: false,
        }}
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

  describe('AI Vylepšit (format-content)', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('shows error when description is empty and does not call fetch', async () => {
      render(<AdminServicesTab {...defaultProps} serviceForm={{ ...defaultProps.serviceForm, description: '' }} />);
      fireEvent.click(screen.getByRole('button', { name: /AI Vylepšit/i }));
      await waitFor(() => {
        expect(screen.getByText('Nejprve napište hrubý text do popisu.')).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('calls fetch with POST /api/format-content and rawText when description has text', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ formattedMarkdown: '**Formátovaný** text.' }),
      });
      vi.mocked(globalThis.fetch).mockImplementation(mockFetch);

      const setServiceForm = vi.fn();
      render(
        <AdminServicesTab
          {...defaultProps}
          setServiceForm={setServiceForm}
          serviceForm={{ ...defaultProps.serviceForm, description: 'hrubý text' }}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /AI Vylepšit/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/format-content',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rawText: 'hrubý text' }),
          })
        );
      });
    });

    it('updates serviceForm with formattedMarkdown on success', async () => {
      const formatted = '- **Benefit** jeden\n- Benefit dva';
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ formattedMarkdown: formatted }),
      });

      const setServiceForm = vi.fn();
      const serviceForm = {
        name: 'Masáž',
        price: 800,
        duration: '60',
        description: 'hrubý text',
        category: 'STANDARD',
        isStartingPrice: false,
        availableForGiftVoucher: false,
      };
      render(<AdminServicesTab {...defaultProps} setServiceForm={setServiceForm} serviceForm={serviceForm} />);
      fireEvent.click(screen.getByRole('button', { name: /AI Vylepšit/i }));

      await waitFor(() => {
        expect(setServiceForm).toHaveBeenCalledWith({ ...serviceForm, description: formatted });
      });
    });

    it('shows API error message when response is not ok', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: 'No LLM configured.' }),
      });

      render(
        <AdminServicesTab
          {...defaultProps}
          serviceForm={{ ...defaultProps.serviceForm, description: 'nějaký text' }}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /AI Vylepšit/i }));

      await waitFor(() => {
        expect(screen.getByText('No LLM configured.')).toBeInTheDocument();
      });
    });

    it('shows friendly message when response is not valid JSON (e.g. HTML)', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.reject(new SyntaxError("Unexpected token '<' in JSON at position 0")),
      });

      render(
        <AdminServicesTab
          {...defaultProps}
          serviceForm={{ ...defaultProps.serviceForm, description: 'text' }}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /AI Vylepšit/i }));

      await waitFor(() => {
        expect(screen.getByText(/Chyba 404\. Zkuste to znovu\./)).toBeInTheDocument();
      });
    });

    it('shows friendly message when error contains "expected pattern" (e.g. Firebase validation)', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ formattedMarkdown: '- bod' }),
      });
      const setServiceForm = vi.fn().mockImplementation(() => {
        throw new Error('The string did not match the expected pattern.');
      });

      render(
        <AdminServicesTab
          {...defaultProps}
          setServiceForm={setServiceForm}
          serviceForm={{ ...defaultProps.serviceForm, description: 'text' }}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /AI Vylepšit/i }));

      await waitFor(() => {
        expect(screen.getByText('Formátování není teď k dispozici. Zkuste to později.')).toBeInTheDocument();
      });
    });
  });
});

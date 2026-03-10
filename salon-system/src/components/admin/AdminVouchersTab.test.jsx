import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminVouchersTab from './AdminVouchersTab';

const defaultProps = {
  voucherTemplates: [],
  services: [],
  onSave: vi.fn(),
  onDelete: vi.fn(),
  onToggleActive: vi.fn(),
};

describe('AdminVouchersTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('renders heading and empty state when no vouchers', () => {
    render(<AdminVouchersTab {...defaultProps} />);
    expect(screen.getByText('Dárkové poukazy')).toBeInTheDocument();
    expect(screen.getByText(/Zatím nemáte vytvořené žádné dárkové poukazy/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Vytvořit první poukaz/i })).toBeInTheDocument();
  });

  it('renders list of voucher templates', () => {
    const vouchers = [
      { id: 'v1', name: 'Poukaz 2000 Kč', type: 'value', price: 2000, is_active: true, sort_order: 0 },
      { id: 'v2', name: 'PMU obočí', type: 'service', price: 3500, is_active: true, sort_order: 1 },
    ];
    render(<AdminVouchersTab {...defaultProps} voucherTemplates={vouchers} />);
    expect(screen.getByText('Poukaz 2000 Kč')).toBeInTheDocument();
    expect(screen.getByText('PMU obočí')).toBeInTheDocument();
    expect(screen.getByText('Hodnota')).toBeInTheDocument();
    expect(screen.getByText('Služba')).toBeInTheDocument();
  });

  it('opens modal when clicking Nový poukaz', () => {
    render(<AdminVouchersTab {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Nový poukaz/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nový poukaz' })).toBeInTheDocument();
  });

  it('calls onDelete when delete is clicked and confirmed', () => {
    const vouchers = [{ id: 'v1', name: 'Poukaz', type: 'value', price: 1000, is_active: true }];
    render(<AdminVouchersTab {...defaultProps} voucherTemplates={vouchers} />);
    const deleteBtn = screen.getByLabelText(/Smazat Poukaz/i);
    fireEvent.click(deleteBtn);
    expect(defaultProps.onDelete).toHaveBeenCalledWith('v1');
  });

  it('calls onToggleActive when toggle is clicked', () => {
    const vouchers = [{ id: 'v1', name: 'Poukaz', type: 'value', price: 1000, is_active: true }];
    render(<AdminVouchersTab {...defaultProps} voucherTemplates={vouchers} />);
    const toggle = screen.getByRole('switch', { name: /Aktivní/i });
    fireEvent.click(toggle);
    expect(defaultProps.onToggleActive).toHaveBeenCalledWith('v1', false);
  });

  it('opens modal in edit mode when Edit is clicked', () => {
    const vouchers = [{ id: 'v1', name: 'Poukaz 5k', type: 'value', price: 5000, is_active: true }];
    render(<AdminVouchersTab {...defaultProps} voucherTemplates={vouchers} />);
    fireEvent.click(screen.getByLabelText(/Upravit Poukaz 5k/i));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Poukaz 5k')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
  });
});

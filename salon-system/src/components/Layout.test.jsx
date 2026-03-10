/**
 * Testy Layout – navigace a odkaz Rezervace.
 * Klik na REZERVACE při použití setView (na stránce /rezervace) volá setView('customer'),
 * aby se po přihlášení do admina zobrazil rezervační formulář místo adminu.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Layout from './Layout';

vi.mock('../firebaseConfig', () => ({ INSTAGRAM_URL: '' }));
vi.mock('./InstagramShowcase', () => ({ default: () => null }));

const mockUseLocation = vi.fn(() => ({ pathname: '/rezervace' }));
vi.mock('react-router-dom', () => ({
  Link: ({ to, children, onClick, className, ...rest }) => (
    <a href={to} onClick={onClick} className={className} {...rest}>{children}</a>
  ),
  useLocation: () => mockUseLocation(),
}));

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders REZERVACE link', () => {
    render(<Layout><span>Content</span></Layout>);
    expect(screen.getByRole('link', { name: 'REZERVACE' })).toBeInTheDocument();
  });

  it('calls setView("customer") when REZERVACE link is clicked', () => {
    const setView = vi.fn();
    render(<Layout setView={setView}><span>Content</span></Layout>);
    const link = screen.getByRole('link', { name: 'REZERVACE' });
    fireEvent.click(link);
    expect(setView).toHaveBeenCalledWith('customer');
  });

  it('does not throw when setView is not provided and REZERVACE is clicked', () => {
    render(<Layout><span>Content</span></Layout>);
    const link = screen.getByRole('link', { name: 'REZERVACE' });
    expect(() => fireEvent.click(link)).not.toThrow();
  });

  it('when on Kosmetika page with setView, clicking REZERVACE calls setView("customer")', () => {
    mockUseLocation.mockReturnValueOnce({ pathname: '/kosmetika' });
    const setView = vi.fn();
    render(<Layout setView={setView}><span>Content</span></Layout>);
    const link = screen.getByRole('link', { name: 'REZERVACE' });
    fireEvent.click(link);
    expect(setView).toHaveBeenCalledWith('customer');
  });

  it('hides footer and Instagram on voucher checkout route /darkove-poukazy', () => {
    mockUseLocation.mockReturnValueOnce({ pathname: '/darkove-poukazy' });
    const { container } = render(<Layout setView={vi.fn()}><span>Content</span></Layout>);
    expect(container.querySelector('footer#kontakt')).not.toBeInTheDocument();
    expect(container.querySelector('main')).toBeInTheDocument();
  });

  it('hides footer and Instagram on voucher success route /poukaz/success', () => {
    mockUseLocation.mockReturnValueOnce({ pathname: '/poukaz/success' });
    const { container } = render(<Layout setView={vi.fn()}><span>Content</span></Layout>);
    expect(container.querySelector('footer#kontakt')).not.toBeInTheDocument();
  });
});

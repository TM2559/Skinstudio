import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ServiceSelector from './ServiceSelector';

const services = [
  { id: 's1', name: 'Masáž', price: 800, isStartingPrice: false, available_addons: [] },
  { id: 's2', name: 'Čištění pleti', price: 500, isStartingPrice: false, available_addons: [
    { id: 'a1', name: 'Sérum', price: 200, price_behavior: 'ADD' },
  ]},
  { id: 's3', name: 'Premium', price: 1500, isStartingPrice: true, available_addons: [] },
];

describe('ServiceSelector', () => {
  const onSelect = vi.fn();
  const onUpsellToggle = vi.fn();

  it('renders all services', () => {
    render(
      <ServiceSelector services={services} selectedService={null} selectedUpsells={[]}
        isDark={false} onSelect={onSelect} onUpsellToggle={onUpsellToggle} />
    );
    expect(screen.getByText('Masáž')).toBeTruthy();
    expect(screen.getByText('Čištění pleti')).toBeTruthy();
    expect(screen.getByText('Premium')).toBeTruthy();
  });

  it('shows prices', () => {
    render(
      <ServiceSelector services={services} selectedService={null} selectedUpsells={[]}
        isDark={false} onSelect={onSelect} onUpsellToggle={onUpsellToggle} />
    );
    expect(screen.getByText('800 Kč')).toBeTruthy();
    expect(screen.getByText('od 1500 Kč')).toBeTruthy();
  });

  it('calls onSelect when clicking a service', () => {
    render(
      <ServiceSelector services={services} selectedService={null} selectedUpsells={[]}
        isDark={false} onSelect={onSelect} onUpsellToggle={onUpsellToggle} />
    );
    fireEvent.click(screen.getByText('Masáž'));
    expect(onSelect).toHaveBeenCalledWith(services[0]);
  });

  it('shows addons when service is selected', () => {
    render(
      <ServiceSelector services={services} selectedService={services[1]} selectedUpsells={[]}
        isDark={false} onSelect={onSelect} onUpsellToggle={onUpsellToggle} />
    );
    expect(screen.getByText('Sérum')).toBeTruthy();
  });

  it('does not show addons for unselected service', () => {
    render(
      <ServiceSelector services={services} selectedService={services[0]} selectedUpsells={[]}
        isDark={false} onSelect={onSelect} onUpsellToggle={onUpsellToggle} />
    );
    expect(screen.queryByText('Sérum')).toBeNull();
  });

  it('calls onUpsellToggle when clicking addon button', () => {
    render(
      <ServiceSelector services={services} selectedService={services[1]} selectedUpsells={[]}
        isDark={false} onSelect={onSelect} onUpsellToggle={onUpsellToggle} />
    );
    fireEvent.click(screen.getByText('+ 200 Kč'));
    expect(onUpsellToggle).toHaveBeenCalled();
  });

  it('shows checkmark for active upsell', () => {
    const activeUpsells = [{ id: 'a1', name: 'Sérum', price: 200, price_behavior: 'ADD' }];
    render(
      <ServiceSelector services={services} selectedService={services[1]} selectedUpsells={activeUpsells}
        isDark={false} onSelect={onSelect} onUpsellToggle={onUpsellToggle} />
    );
    expect(screen.getByText('✓')).toBeTruthy();
  });

  it('renders in dark mode without errors', () => {
    render(
      <ServiceSelector services={services} selectedService={services[0]} selectedUpsells={[]}
        isDark={true} onSelect={onSelect} onUpsellToggle={onUpsellToggle} />
    );
    expect(screen.getByText('Masáž')).toBeTruthy();
  });
});

import { describe, it, expect } from 'vitest';
import { servicesNeedingGiftVoucherTemplate } from './syncServiceGiftVoucherTemplate';

describe('servicesNeedingGiftVoucherTemplate', () => {
  const services = [
    { id: 'a', name: 'A', availableForGiftVoucher: true },
    { id: 'b', name: 'B', availableForGiftVoucher: false },
    { id: 'c', name: 'C', availableForGiftVoucher: true },
  ];

  it('returns services with checkbox but no template', () => {
    const templates = [];
    const need = servicesNeedingGiftVoucherTemplate(services, templates);
    expect(need.map((s) => s.id).sort()).toEqual(['a', 'c']);
  });

  it('skips when active template exists for service_id', () => {
    const templates = [
      { id: 'v1', service_id: 'a', type: 'service', is_active: true },
      { id: 'v2', service_id: 'c', type: 'service', is_active: true },
    ];
    expect(servicesNeedingGiftVoucherTemplate(services, templates)).toHaveLength(0);
  });

  it('includes service when template is inactive', () => {
    const templates = [{ id: 'v1', service_id: 'a', type: 'service', is_active: false }];
    const need = servicesNeedingGiftVoucherTemplate(services, templates);
    expect(need.map((s) => s.id)).toEqual(['a', 'c']);
  });
});

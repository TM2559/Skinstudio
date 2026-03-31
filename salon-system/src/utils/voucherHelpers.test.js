import { describe, it, expect } from 'vitest';
import { VOUCHER_TYPES } from '../constants/config';
import { normalizeVoucherType, voucherDisplayCategory } from './voucherHelpers';

describe('voucherHelpers', () => {
  describe('normalizeVoucherType', () => {
    it('maps service variants to service', () => {
      expect(normalizeVoucherType('service')).toBe(VOUCHER_TYPES.SERVICE);
      expect(normalizeVoucherType('SERVICE')).toBe(VOUCHER_TYPES.SERVICE);
    });
    it('maps value and unknown to value', () => {
      expect(normalizeVoucherType('value')).toBe(VOUCHER_TYPES.VALUE);
      expect(normalizeVoucherType('VALUE')).toBe(VOUCHER_TYPES.VALUE);
      expect(normalizeVoucherType(undefined)).toBe(VOUCHER_TYPES.VALUE);
    });
  });

  describe('voucherDisplayCategory', () => {
    it('uses category when set', () => {
      expect(voucherDisplayCategory({ category: 'pmu', type: 'value' })).toBe('pmu');
    });
    it('infers value from type when category missing', () => {
      expect(voucherDisplayCategory({ type: 'VALUE' })).toBe('value');
    });
    it('defaults service-like to cosmetics when category missing', () => {
      expect(voucherDisplayCategory({ type: 'service' })).toBe('cosmetics');
    });
  });
});

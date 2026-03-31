import { describe, it, expect } from 'vitest';
import { getFirstInvalidStep } from './voucherFormValidation';

describe('getFirstInvalidStep', () => {
  it('returns type when no category', () => {
    expect(
      getFirstInvalidStep({
        expandedCategory: null,
        selectedVoucher: null,
        customAmountValid: true,
        dateValid: true,
        phoneValid: true,
        emailValid: true,
      })?.step
    ).toBe('type');
  });

  it('returns voucher when category but no voucher', () => {
    expect(
      getFirstInvalidStep({
        expandedCategory: 'value',
        selectedVoucher: null,
        customAmountValid: false,
        dateValid: true,
        phoneValid: true,
        emailValid: true,
      })?.step
    ).toBe('voucher');
  });

  it('returns null when all valid', () => {
    expect(
      getFirstInvalidStep({
        expandedCategory: 'value',
        selectedVoucher: { id: '1', is_custom_amount: false },
        customAmountValid: true,
        dateValid: true,
        phoneValid: true,
        emailValid: true,
      })
    ).toBeNull();
  });
});

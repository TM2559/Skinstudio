import React from 'react';
import SectionHeading from './SectionHeading';
import SpecificVoucherList from './SpecificVoucherList';

export default function StepTwoSpecific({
  visible,
  vouchers,
  selectedVoucher,
  onSelectVoucher,
  customAmountDraft,
  onCustomAmountDraft,
  customAmountInputRef,
  validationHint,
  shakeStep,
}) {
  if (!visible) return null;

  const showVoucherIssue = validationHint?.step === 'voucher' || validationHint?.step === 'amount';
  const shake = shakeStep === 'voucher' || shakeStep === 'amount';

  return (
    <section
      id="voucher-step-specific"
      className={`scroll-mt-24 ${showVoucherIssue ? 'ring-1 ring-[#EF4444] p-px' : ''} ${shake ? 'animate-voucher-form-shake' : ''}`.trim()}
      aria-labelledby="step-specific-voucher-heading"
    >
      <SectionHeading id="step-specific-voucher-heading">Konkrétní poukaz</SectionHeading>
      <SpecificVoucherList
        vouchers={vouchers}
        selectedVoucher={selectedVoucher}
        onSelectVoucher={onSelectVoucher}
        customAmountDraft={customAmountDraft}
        onCustomAmountDraft={onCustomAmountDraft}
        customAmountInputRef={customAmountInputRef}
      />
      {(validationHint?.step === 'voucher' || validationHint?.step === 'amount') && (
        <p className="text-[11px] font-medium text-[#EF4444] mt-1.5" role="status">
          {validationHint.message}
        </p>
      )}
    </section>
  );
}

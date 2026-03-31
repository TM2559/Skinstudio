import React from 'react';
import VoucherListItem from './VoucherListItem';

export default function SpecificVoucherList({
  vouchers,
  selectedVoucher,
  onSelectVoucher,
  customAmountDraft,
  onCustomAmountDraft,
  customAmountInputRef,
}) {
  if (!vouchers?.length) return null;

  return (
    <div
      id="voucher-service-dropdown"
      role="radiogroup"
      aria-label="Vyberte konkrétní dárkový poukaz"
      className="flex flex-col gap-px bg-[#E4E4E7] border border-[#E4E4E7]"
    >
      {vouchers.map((v) => (
        <VoucherListItem
          key={v.id}
          voucher={v}
          isSelected={selectedVoucher?.id === v.id}
          onSelect={onSelectVoucher}
          customAmountDraft={customAmountDraft}
          onCustomAmountDraft={onCustomAmountDraft}
          customAmountInputRef={customAmountInputRef}
        />
      ))}
    </div>
  );
}

import React from 'react';
import StepOneType from './StepOneType';
import ResetLink from './ResetLink';
import StepTwoSpecific from './StepTwoSpecific';
import PackagingOptions from './PackagingOptions';
import PickupDetails from './PickupDetails';

export default function ConfiguratorForm({
  categoryGroups,
  expandedCategory,
  onOpenCategory,
  onCollapse,
  vouchersForExpanded,
  showStepTwo,
  selectedVoucher,
  onSelectVoucher,
  customAmountDraft,
  onCustomAmountDraft,
  customAmountInputRef,
  packaging,
  onPackaging,
  pickupDateType,
  onPickupDateType,
  tomorrowLabel,
  customPickupDate,
  onCustomPickupDate,
  minLaterDate,
  contactPhone,
  onPhoneChange,
  onPhoneKeyDown,
  contactEmail,
  onEmailChange,
  touched,
  onBlurPhone,
  onBlurEmail,
  phoneValid,
  emailValid,
  validationHint,
  shakeStep,
  className = '',
}) {
  const showLaterSteps = Boolean(selectedVoucher);

  return (
    <div className={`flex w-full flex-col gap-16 ${className}`.trim()}>
      <StepOneType
        categoryGroups={categoryGroups}
        expandedCategory={expandedCategory}
        onOpenCategory={onOpenCategory}
        validationHint={validationHint}
        shakeStep={shakeStep}
      />

      <ResetLink visible={expandedCategory != null} onReset={onCollapse} />

      <StepTwoSpecific
        visible={showStepTwo}
        vouchers={vouchersForExpanded}
        selectedVoucher={selectedVoucher}
        onSelectVoucher={onSelectVoucher}
        customAmountDraft={customAmountDraft}
        onCustomAmountDraft={onCustomAmountDraft}
        customAmountInputRef={customAmountInputRef}
        validationHint={validationHint}
        shakeStep={shakeStep}
      />

      {showLaterSteps && (
        <div className="flex flex-col gap-16">
          <PackagingOptions packaging={packaging} onPackaging={onPackaging} />
          <PickupDetails
            packaging={packaging}
            pickupDateType={pickupDateType}
            onPickupDateType={onPickupDateType}
            tomorrowLabel={tomorrowLabel}
            customPickupDate={customPickupDate}
            onCustomPickupDate={onCustomPickupDate}
            minLaterDate={minLaterDate}
            contactPhone={contactPhone}
            onPhoneChange={onPhoneChange}
            onPhoneKeyDown={onPhoneKeyDown}
            contactEmail={contactEmail}
            onEmailChange={onEmailChange}
            touched={touched}
            onBlurPhone={onBlurPhone}
            onBlurEmail={onBlurEmail}
            phoneValid={phoneValid}
            emailValid={emailValid}
            validationHint={validationHint}
            shakeStep={shakeStep}
          />
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Info } from 'lucide-react';
import SectionHeading from './SectionHeading';
import DateSelector from './DateSelector';
import ContactInputs from './ContactInputs';

export default function PickupDetails({
  packaging,
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
}) {
  const showContactIssue = validationHint?.step === 'phone' || validationHint?.step === 'email';
  const shakeContact = shakeStep === 'phone' || shakeStep === 'email';

  return (
    <section className="mt-0" aria-labelledby="step-fulfillment-heading">
      <SectionHeading id="step-fulfillment-heading">Vyzvednutí a kontakt</SectionHeading>

      <DateSelector
        pickupDateType={pickupDateType}
        onPickupDateType={onPickupDateType}
        tomorrowLabel={tomorrowLabel}
        customPickupDate={customPickupDate}
        onCustomPickupDate={onCustomPickupDate}
        minLaterDate={minLaterDate}
        validationHint={validationHint}
        shakeStep={shakeStep}
      />

      <div
        id="voucher-step-contact"
        className={`scroll-mt-24 ${showContactIssue ? 'ring-1 ring-[#EF4444] p-3 -m-px' : ''} ${shakeContact ? 'animate-voucher-form-shake' : ''}`.trim()}
      >
        <ContactInputs
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
        />
      </div>

      <div
        className="mt-12 mb-6 border border-[#EDE8E0] bg-[#FAF8F5] px-6 py-5 flex gap-4 text-sm text-[#525252] leading-relaxed border-l-[3px] border-l-[#c5aa80]/80"
        role="status"
      >
        <Info size={20} strokeWidth={1.5} className="shrink-0 mt-0.5 text-[#71717A]" aria-hidden />
        <p>
          {packaging === 'box'
            ? 'Vaši dárkovou krabičku začneme pečlivě připravovat. Jakmile bude hotová, pošleme vám na uvedené číslo SMS s potvrzením a adresou pro flexibilní vyzvednutí v Uherském Brodě.'
            : 'Vaši dárkovou obálku začneme pečlivě připravovat. Jakmile bude hotová, pošleme vám na uvedené číslo SMS s potvrzením a adresou pro flexibilní vyzvednutí v Uherském Brodě.'}
        </p>
      </div>
    </section>
  );
}

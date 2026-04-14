import React from 'react';

export default function ContactInputs({
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
}) {
  const phoneErr = (touched.phone || validationHint?.step === 'phone') && !phoneValid;
  const emailErr = (touched.email || validationHint?.step === 'email') && !emailValid;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
      <div>
        <label
          htmlFor="contact-phone"
          className={`block text-[11px] uppercase tracking-[0.22em] mb-3 ${phoneErr ? 'text-[#EF4444]' : 'text-[#9c9590]'}`}
        >
          Telefon <span className="normal-case tracking-normal">(+420)</span>
        </label>
        <input
          id="contact-phone"
          type="tel"
          inputMode="tel"
          value={contactPhone}
          onChange={onPhoneChange}
          onKeyDown={onPhoneKeyDown}
          onBlur={onBlurPhone}
          placeholder="+420 123 456 789"
          className={`w-full bg-transparent border-0 border-b rounded-none py-3 px-0 text-base placeholder:text-[#d4cfc8] focus:outline-none ${
            phoneErr
              ? 'border-b-[#EF4444] text-[#EF4444] focus:border-[#EF4444]'
              : 'border-[#EDE8E0] text-[#2a2624] focus:border-[#c5aa80]'
          }`}
          aria-required="true"
          aria-invalid={phoneErr}
        />
        {phoneErr && (
          <p className="text-[11px] font-medium text-[#EF4444] mt-1.5" role="alert">
            Zadejte platné české číslo (+420 a 9 číslic).
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="contact-email"
          className={`block text-[11px] uppercase tracking-[0.22em] mb-3 ${emailErr ? 'text-[#EF4444]' : 'text-[#9c9590]'}`}
        >
          E-mail
        </label>
        <input
          id="contact-email"
          type="email"
          inputMode="email"
          value={contactEmail}
          onChange={onEmailChange}
          onBlur={onBlurEmail}
          placeholder="vas@email.cz"
          className={`w-full bg-transparent border-0 border-b rounded-none py-3 px-0 text-base placeholder:text-[#d4cfc8] focus:outline-none ${
            emailErr
              ? 'border-b-[#EF4444] text-[#EF4444] focus:border-[#EF4444]'
              : 'border-[#EDE8E0] text-[#2a2624] focus:border-[#c5aa80]'
          }`}
          aria-required="true"
          aria-invalid={emailErr}
        />
        {emailErr && (
          <p className="text-[11px] font-medium text-[#EF4444] mt-1.5" role="alert">
            {!contactEmail.trim() ? 'Vyplňte e-mailovou adresu.' : 'Zadejte platnou e-mailovou adresu.'}
          </p>
        )}
      </div>
    </div>
  );
}

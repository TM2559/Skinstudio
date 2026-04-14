import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutHeader from './CheckoutHeader';
import VoucherTypeSection from './VoucherTypeSection';
import PackagingOptions from './configurator/PackagingOptions';
import DateSelector from './configurator/DateSelector';
import ContactInputs from './configurator/ContactInputs';
import OrderSummary from './OrderSummary';
import { useData } from '../../contexts/DataContext';
import { voucherDisplayCategory } from '../../utils/voucherHelpers';
import { callCreateVoucherOrder } from '../../firebaseConfig';
import {
  getMinLaterDate,
  formatPrice,
  formatKcDigits,
  templateAmountMinKc,
  PHONE_PREFIX,
  validatePhone,
  validateEmail,
} from './voucherCheckoutUtils';

export default function GiftVoucherCheckoutPage() {
  const navigate = useNavigate();
  const { voucherTemplates } = useData();
  const activeVouchers = useMemo(
    () => (voucherTemplates || []).filter((v) => v.is_active !== false),
    [voucherTemplates]
  );

  // Rozdělení do skupin (zachováno z původního kódu)
  const valueVouchers = useMemo(
    () => activeVouchers.filter((v) => voucherDisplayCategory(v) === 'value'),
    [activeVouchers]
  );
  const fixedValueVouchers = useMemo(
    () => valueVouchers.filter((v) => !v.is_custom_amount),
    [valueVouchers]
  );
  const customVoucher = useMemo(
    () => valueVouchers.find((v) => v.is_custom_amount) ?? null,
    [valueVouchers]
  );
  const cosmeticsVouchers = useMemo(
    () => activeVouchers.filter((v) => voucherDisplayCategory(v) === 'cosmetics'),
    [activeVouchers]
  );
  const pmuVouchers = useMemo(
    () => activeVouchers.filter((v) => voucherDisplayCategory(v) === 'pmu'),
    [activeVouchers]
  );

  // Stav
  const [activeMode, setActiveMode] = useState(null); // 'value' | 'custom' | 'service'
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [customAmountDraft, setCustomAmountDraft] = useState('');
  const [packaging, setPackaging] = useState('envelope');
  const [pickupDateType, setPickupDateType] = useState('tomorrow');
  const [customPickupDate, setCustomPickupDate] = useState('');
  const [contactPhone, setContactPhone] = useState(PHONE_PREFIX + ' ');
  const [contactEmail, setContactEmail] = useState('');
  const [touched, setTouched] = useState({ phone: false, email: false });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const customAmountInputRef = useRef(null);

  const minLaterDate = getMinLaterDate();
  const tomorrowLabel = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'short' });
  }, []);

  // Vypočítané hodnoty
  const effectiveVoucherPrice = useMemo(() => {
    if (!selectedVoucher) return 0;
    if (selectedVoucher.is_custom_amount) {
      const n = parseInt(String(customAmountDraft).replace(/\s/g, ''), 10);
      return Number.isFinite(n) ? n : 0;
    }
    return selectedVoucher.price || 0;
  }, [selectedVoucher, customAmountDraft]);

  const totalPrice = useMemo(() => {
    if (!selectedVoucher) return 0;
    return effectiveVoucherPrice + (packaging === 'box' ? 100 : 0);
  }, [selectedVoucher, effectiveVoucherPrice, packaging]);

  // Validace
  const phoneValid = validatePhone(contactPhone);
  const emailValid = validateEmail(contactEmail);
  const dateValid = pickupDateType === 'tomorrow' || (customPickupDate && customPickupDate >= minLaterDate);
  const customAmountValid =
    !selectedVoucher?.is_custom_amount ||
    (effectiveVoucherPrice >= templateAmountMinKc(selectedVoucher) && effectiveVoucherPrice > 0);
  const canSubmit =
    selectedVoucher &&
    phoneValid &&
    emailValid &&
    dateValid &&
    customAmountValid &&
    effectiveVoucherPrice > 0;

  // Handlers
  const handlePhoneChange = (e) => {
    let v = e.target.value.replace(/\s/g, '');
    if (!v.startsWith('+420')) v = PHONE_PREFIX + v.replace(/^\+\d*/, '');
    if (v.length > 4 && !/^\+\d*$/.test(v.slice(4))) v = v.slice(0, 4) + v.slice(4).replace(/\D/g, '');
    if (v.length > 13) v = v.slice(0, 13);
    setContactPhone(v.length <= 4 ? v : v.slice(0, 4) + ' ' + v.slice(4).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3').trim());
  };
  const handlePhoneKeyDown = (e) => {
    if (e.key !== 'Backspace') return;
    const digitsOnly = contactPhone.replace(/\D/g, '');
    if (digitsOnly.length <= 3) e.preventDefault();
  };

  const submitOrder = useCallback(async () => {
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const payload = {
        packaging,
        pickupDateType,
        customPickupDate: pickupDateType === 'later' ? customPickupDate : undefined,
        contactPhone,
        contactEmail: contactEmail.trim(),
        voucherId: selectedVoucher.id,
      };
      if (selectedVoucher.is_custom_amount) {
        payload.customAmountKc = effectiveVoucherPrice;
      }
      const { data } = await callCreateVoucherOrder(payload);
      const orderId = data?.orderId;
      const totalFromServer = data?.total_price ?? totalPrice;
      const voucherLabel = selectedVoucher.is_custom_amount
        ? `Poukaz na ${formatKcDigits(effectiveVoucherPrice)} Kč`
        : selectedVoucher.name;
      const pickupSummaryLine =
        pickupDateType === 'tomorrow'
          ? 'Osobní vyzvednutí (zítra)'
          : customPickupDate
          ? `Osobní vyzvednutí (${new Date(`${customPickupDate}T12:00:00`).toLocaleDateString('cs-CZ', {
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
            })})`
          : 'Osobní vyzvednutí';
      navigate('/poukaz/success', {
        state: { orderId, totalPrice: totalFromServer, voucherLabel, pickupSummaryLine },
      });
    } catch (err) {
      const msg = err?.message || '';
      setSubmitError(
        msg.includes('unauthenticated')
          ? 'Pro objednání obnovte stránku a zkuste znovu.'
          : err.message || 'Objednávku se nepodařilo odeslat. Zkuste to znovu.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [packaging, pickupDateType, customPickupDate, contactPhone, contactEmail, selectedVoucher, effectiveVoucherPrice, totalPrice, navigate]);

  const handleSubmit = useCallback(() => {
    setSubmitError('');
    if (isSubmitting) return;
    if (canSubmit) {
      void submitOrder();
      return;
    }
    setShowValidation(true);
    setTouched({ phone: true, email: true });
    // Scroll k prvnímu problému
    if (!activeMode || !selectedVoucher) {
      document.getElementById('voucher-step-type')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (activeMode === 'custom' && !customAmountValid) {
      customAmountInputRef.current?.focus();
    } else if (!dateValid) {
      document.getElementById('voucher-step-pickup-date')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (!phoneValid) {
      document.getElementById('contact-phone')?.focus();
    } else if (!emailValid) {
      document.getElementById('contact-email')?.focus();
    }
  }, [isSubmitting, canSubmit, submitOrder, activeMode, selectedVoucher, customAmountValid, dateValid, phoneValid, emailValid]);

  const showDetails = Boolean(selectedVoucher);

  if (activeVouchers.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#18181B]">
        <CheckoutHeader />
        <main className="mx-auto max-w-2xl px-4 py-24 text-center">
          <p className="text-[#737373]">Momentálně nemáme v prodeji žádné dárkové poukazy.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#18181B] selection:bg-[#C5A880] selection:text-white">
      <CheckoutHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 md:py-20 pb-24">
        <h1 className="mb-2 text-center text-[26px] font-medium tracking-tight text-[#18181B] md:text-[30px]">
          Dárkový poukaz
        </h1>
        <p className="mb-10 text-center text-[15px] text-[#71717A]">
          Potěšte někoho blízkého péčí o sebe.
        </p>

        {/* KROK 1 — Výběr typu a konkrétního poukazu */}
        <section aria-label="Výběr poukazu" className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#9c9590] mb-3">Vyberte poukaz</p>
          <VoucherTypeSection
            fixedValueVouchers={fixedValueVouchers}
            customVoucher={customVoucher}
            cosmeticsVouchers={cosmeticsVouchers}
            pmuVouchers={pmuVouchers}
            activeMode={activeMode}
            onSelectMode={setActiveMode}
            selectedVoucher={selectedVoucher}
            onSelectVoucher={setSelectedVoucher}
            customAmountDraft={customAmountDraft}
            onCustomAmountDraft={setCustomAmountDraft}
            customAmountInputRef={customAmountInputRef}
            showAmountError={showValidation && activeMode === 'custom' && !customAmountValid}
            showTypeError={showValidation && (!activeMode || !selectedVoucher)}
          />
        </section>

        {/* KROK 2 — Detaily (zobrazí se po výběru) */}
        {showDetails && (
          <div className="flex flex-col gap-8">
            <PackagingOptions packaging={packaging} onPackaging={setPackaging} />
            <DateSelector
              pickupDateType={pickupDateType}
              onPickupDateType={setPickupDateType}
              tomorrowLabel={tomorrowLabel}
              customPickupDate={customPickupDate}
              onCustomPickupDate={setCustomPickupDate}
              minLaterDate={minLaterDate}
              validationHint={showValidation && !dateValid ? { step: 'date', message: 'Nastavte platné datum vyzvednutí.' } : null}
              shakeStep={null}
            />
            <section id="voucher-step-contact" className="scroll-mt-24" aria-label="Kontaktní údaje">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#9c9590] mb-6">Kontaktní údaje</p>
              <ContactInputs
                contactPhone={contactPhone}
                onPhoneChange={handlePhoneChange}
                onPhoneKeyDown={handlePhoneKeyDown}
                contactEmail={contactEmail}
                onEmailChange={(e) => setContactEmail(e.target.value)}
                touched={touched}
                onBlurPhone={() => setTouched((t) => ({ ...t, phone: true }))}
                onBlurEmail={() => setTouched((t) => ({ ...t, email: true }))}
                phoneValid={phoneValid}
                emailValid={emailValid}
                validationHint={null}
              />
            </section>
          </div>
        )}

        {/* KROK 3 — Souhrn + platba + CTA */}
        <OrderSummary
          selectedVoucher={selectedVoucher}
          effectiveVoucherPrice={effectiveVoucherPrice}
          packaging={packaging}
          totalPrice={totalPrice}
          submitError={submitError}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          canSubmit={canSubmit}
        />
      </main>
    </div>
  );
}

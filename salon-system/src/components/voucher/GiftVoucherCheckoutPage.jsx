import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutHeader from './CheckoutHeader';
import VoucherCheckoutHero from './VoucherCheckoutHero';
import ConfiguratorForm from './configurator/ConfiguratorForm';
import StickyFooter from './configurator/StickyFooter';
import { WEB_CONTENT } from '../../constants/content';
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
  scrollVoucherStepIntoView,
} from './voucherCheckoutUtils';
import { getFirstInvalidStep, VOUCHER_SCROLL_IDS } from './voucherFormValidation';

export default function GiftVoucherCheckoutPage() {
  const navigate = useNavigate();
  const { voucherTemplates } = useData();
  const activeVouchers = useMemo(
    () => (voucherTemplates || []).filter((v) => v.is_active !== false),
    [voucherTemplates]
  );

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
  const [expandedCategory, setExpandedCategory] = useState(null);
  /** První neplatný krok po kliknutí na CTA — zpráva + zvýraznění sekce. */
  const [validationHint, setValidationHint] = useState(null);
  const [shakeStep, setShakeStep] = useState(null);
  const customAmountInputRef = useRef(null);
  const prevExpandedCategoryRef = useRef(null);
  const prevSelectedVoucherIdRef = useRef(undefined);
  const prevPackagingRef = useRef(packaging);
  const prevPickupDateTypeRef = useRef(pickupDateType);
  const prevCustomPickupDateRef = useRef('');

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

  useEffect(() => {
    if (!selectedVoucher?.is_custom_amount) return;
    const id = requestAnimationFrame(() => {
      customAmountInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [selectedVoucher?.id]);

  /** Po výběru typu — skok na seznam konkrétních poukazů (bez plynulého scrollu). */
  useEffect(() => {
    if (!expandedCategory) {
      prevExpandedCategoryRef.current = null;
      return;
    }
    if (prevExpandedCategoryRef.current === expandedCategory) return;
    prevExpandedCategoryRef.current = expandedCategory;
    scrollVoucherStepIntoView('voucher-step-specific');
  }, [expandedCategory]);

  /** Po výběru poukazu — skok na dárkové balení. */
  useEffect(() => {
    const id = selectedVoucher?.id;
    if (!id) {
      prevSelectedVoucherIdRef.current = undefined;
      return;
    }
    if (prevSelectedVoucherIdRef.current === id) return;
    prevSelectedVoucherIdRef.current = id;
    scrollVoucherStepIntoView('voucher-step-packaging');
  }, [selectedVoucher?.id]);

  /** Po změně balení — skok na datum vyzvednutí. */
  useEffect(() => {
    if (!selectedVoucher) {
      prevPackagingRef.current = packaging;
      return;
    }
    if (prevPackagingRef.current === packaging) return;
    prevPackagingRef.current = packaging;
    scrollVoucherStepIntoView('voucher-step-pickup-date');
  }, [packaging, selectedVoucher]);

  /** Po změně režimu data — zítra → kontakt; jiné datum → kalendář. */
  useEffect(() => {
    if (!selectedVoucher) {
      prevPickupDateTypeRef.current = pickupDateType;
      return;
    }
    if (prevPickupDateTypeRef.current === pickupDateType) return;
    prevPickupDateTypeRef.current = pickupDateType;
    if (pickupDateType === 'tomorrow') {
      scrollVoucherStepIntoView('voucher-step-contact');
    } else {
      scrollVoucherStepIntoView('voucher-step-pickup-date');
    }
  }, [pickupDateType, selectedVoucher]);

  /** Po zvolení data u „jiné datum“ — skok na kontakt. */
  useEffect(() => {
    if (pickupDateType !== 'later' || !selectedVoucher) {
      if (!customPickupDate) prevCustomPickupDateRef.current = '';
      return;
    }
    if (!customPickupDate) return;
    if (prevCustomPickupDateRef.current === customPickupDate) return;
    prevCustomPickupDateRef.current = customPickupDate;
    scrollVoucherStepIntoView('voucher-step-contact');
  }, [customPickupDate, pickupDateType, selectedVoucher]);

  const minLaterDate = getMinLaterDate();
  const tomorrowLabel = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'short' });
  }, []);

  const valueVouchers = activeVouchers.filter((v) => voucherDisplayCategory(v) === 'value');
  const cosmeticsVouchers = activeVouchers.filter((v) => voucherDisplayCategory(v) === 'cosmetics');
  const pmuVouchers = activeVouchers.filter((v) => voucherDisplayCategory(v) === 'pmu');

  const categoryGroups = useMemo(() => {
    const groups = [];
    if (valueVouchers.length > 0) {
      groups.push({ key: 'value', vouchers: valueVouchers });
    }
    if (cosmeticsVouchers.length > 0) {
      groups.push({ key: 'cosmetics', vouchers: cosmeticsVouchers });
    }
    if (pmuVouchers.length > 0) {
      groups.push({ key: 'pmu', vouchers: pmuVouchers });
    }
    return groups;
  }, [valueVouchers, cosmeticsVouchers, pmuVouchers]);

  const vouchersForExpanded = useMemo(() => {
    if (!expandedCategory) return [];
    const g = categoryGroups.find((x) => x.key === expandedCategory);
    return g?.vouchers ?? [];
  }, [expandedCategory, categoryGroups]);

  const openCategory = (cat) => {
    setExpandedCategory(cat);
    setCustomAmountDraft('');
    setSelectedVoucher((prev) => {
      if (!prev) return null;
      return voucherDisplayCategory(prev) === cat ? prev : null;
    });
  };

  const collapseCategoryPicker = useCallback(() => {
    setExpandedCategory(null);
    setSelectedVoucher(null);
    setCustomAmountDraft('');
  }, []);

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

  const hasLineTotal = Boolean(selectedVoucher) && effectiveVoucherPrice > 0;

  useEffect(() => {
    if (!validationHint) return;
    const next = getFirstInvalidStep({
      expandedCategory,
      selectedVoucher,
      customAmountValid,
      dateValid,
      phoneValid,
      emailValid,
    });
    if (!next || next.step !== validationHint.step) {
      setValidationHint(null);
    }
  }, [
    expandedCategory,
    selectedVoucher,
    customAmountValid,
    dateValid,
    phoneValid,
    emailValid,
    validationHint,
  ]);

  useEffect(() => {
    if (canSubmit) setValidationHint(null);
  }, [canSubmit]);

  useEffect(() => {
    if (!shakeStep) return;
    const t = setTimeout(() => setShakeStep(null), 400);
    return () => clearTimeout(t);
  }, [shakeStep]);

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
      };
      payload.voucherId = selectedVoucher.id;
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
        state: {
          orderId,
          totalPrice: totalFromServer,
          voucherLabel,
          pickupSummaryLine,
        },
      });
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('unauthenticated')) {
        setSubmitError('Pro objednání je nutné být přihlášen. Obnovte stránku a zkuste znovu.');
      } else {
        setSubmitError(err.message || 'Objednávku se nepodařilo odeslat. Zkuste to znovu.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    packaging,
    pickupDateType,
    customPickupDate,
    contactPhone,
    contactEmail,
    selectedVoucher,
    effectiveVoucherPrice,
    totalPrice,
    navigate,
  ]);

  const handlePrimaryClick = useCallback(() => {
    setSubmitError('');
    if (isSubmitting) return;
    if (canSubmit) {
      void submitOrder();
      return;
    }
    const first = getFirstInvalidStep({
      expandedCategory,
      selectedVoucher,
      customAmountValid,
      dateValid,
      phoneValid,
      emailValid,
    });
    if (!first) return;
    setValidationHint(first);
    setShakeStep(first.step);

    if (first.step === 'phone') {
      setTouched((t) => ({ ...t, phone: true }));
    }
    if (first.step === 'email') {
      setTouched((t) => ({ ...t, email: true }));
    }

    // Plynulý scroll k první nevyplněné povinné sekci (tlačítko „Pokračovat“).
    const scrollId = VOUCHER_SCROLL_IDS[first.step];
    requestAnimationFrame(() => {
      document.getElementById(scrollId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    window.setTimeout(() => {
      if (first.step === 'amount') {
        customAmountInputRef.current?.focus();
      }
      if (first.step === 'phone') {
        document.getElementById('contact-phone')?.focus();
      }
      if (first.step === 'email') {
        document.getElementById('contact-email')?.focus();
      }
    }, 320);
  }, [
    isSubmitting,
    canSubmit,
    submitOrder,
    expandedCategory,
    selectedVoucher,
    customAmountValid,
    dateValid,
    phoneValid,
    emailValid,
  ]);

  const pageTitle = WEB_CONTENT.voucherCheckout.pageTitle;

  if (activeVouchers.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#18181B] selection:bg-[#C5A880] selection:text-white">
        <CheckoutHeader />
        <main className="mx-auto max-w-2xl px-4 py-12 md:py-24 pb-16">
          <p className="text-center text-[#737373]">Momentálně nemáme v prodeji žádné dárkové poukazy.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#18181B] selection:bg-[#C5A880] selection:text-white">
      <CheckoutHeader />

      <main
        className="mx-auto max-w-2xl min-h-[calc(100svh+14rem)] px-4 py-12 md:py-24 pb-[calc(clamp(28rem,58vh,44rem)+env(safe-area-inset-bottom,0px))] sm:pb-[calc(clamp(30rem,56vh,46rem)+env(safe-area-inset-bottom,0px))]"
      >
        <VoucherCheckoutHero />

        <h1 className="mt-12 mb-12 text-center text-[28px] font-medium tracking-tight text-[#18181B] md:text-[32px]">
          {pageTitle}
        </h1>

        <ConfiguratorForm
          categoryGroups={categoryGroups}
          expandedCategory={expandedCategory}
          onOpenCategory={openCategory}
          onCollapse={collapseCategoryPicker}
          vouchersForExpanded={vouchersForExpanded}
          showStepTwo={expandedCategory != null}
          selectedVoucher={selectedVoucher}
          onSelectVoucher={setSelectedVoucher}
          customAmountDraft={customAmountDraft}
          onCustomAmountDraft={setCustomAmountDraft}
          customAmountInputRef={customAmountInputRef}
          packaging={packaging}
          onPackaging={setPackaging}
          pickupDateType={pickupDateType}
          onPickupDateType={setPickupDateType}
          tomorrowLabel={tomorrowLabel}
          customPickupDate={customPickupDate}
          onCustomPickupDate={setCustomPickupDate}
          minLaterDate={minLaterDate}
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
          validationHint={validationHint}
          shakeStep={shakeStep}
        />
      </main>

      <StickyFooter
        formatPrice={formatPrice}
        totalPrice={totalPrice}
        hasSelection={hasLineTotal}
        expandedCategory={expandedCategory}
        selectedVoucher={selectedVoucher}
        customAmountValid={customAmountValid}
        dateValid={dateValid}
        phoneValid={phoneValid}
        emailValid={emailValid}
        submitError={submitError}
        isSubmitting={isSubmitting}
        onPrimaryClick={handlePrimaryClick}
      />
    </div>
  );
}

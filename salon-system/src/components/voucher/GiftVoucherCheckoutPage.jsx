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
  const [customPickupDate, setCustomPickupDate] = useState(getMinLaterDate());
  const [contactPhone, setContactPhone] = useState(PHONE_PREFIX + ' ');
  const [contactEmail, setContactEmail] = useState('');
  const [touched, setTouched] = useState({ phone: false, email: false });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const customAmountInputRef = useRef(null);

  const minLaterDate = getMinLaterDate();
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
  const dateValid = Boolean(customPickupDate && customPickupDate >= minLaterDate);
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
        pickupDateType: 'later',
        customPickupDate,
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
      const pickupSummaryLine = customPickupDate
        ? `Osobní vyzvednutí (${new Date(`${customPickupDate}T12:00:00`).toLocaleDateString('cs-CZ', {
            day: '2-digit',
            month: '2-digit',
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
  }, [packaging, customPickupDate, contactPhone, contactEmail, selectedVoucher, effectiveVoucherPrice, totalPrice, navigate]);

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
  const showValidationSummary = showValidation && !canSubmit;
  const progressSteps = [
    { id: 'type', label: 'Typ poukazu', done: Boolean(selectedVoucher) },
    { id: 'details', label: 'Balení', done: Boolean(selectedVoucher) },
    { id: 'contact', label: 'Kontakt', done: Boolean(selectedVoucher) && phoneValid && emailValid },
    { id: 'confirm', label: 'Potvrzení', done: canSubmit },
  ];
  const completedSteps = progressSteps.filter((step) => step.done).length;
  const progressPercent = Math.max(8, Math.round((completedSteps / progressSteps.length) * 100));

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
      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14 pb-28 md:pb-16">
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-[#E4E4E7] bg-white px-4 py-1.5 text-[12px] text-[#45403d]">Platnost 12 měsíců</span>
          <span className="rounded-full border border-[#E4E4E7] bg-white px-4 py-1.5 text-[12px] text-[#45403d]">Osobní předání v salonu</span>
          <span className="rounded-full border border-[#E4E4E7] bg-white px-4 py-1.5 text-[12px] text-[#45403d]">Potvrzení do 30 minut</span>
        </div>
        <h1 className="mb-2 text-center text-[28px] font-medium tracking-tight text-[#18181B] md:text-[34px]">Dárkový poukaz Skin Studio</h1>
        <p className="mb-8 text-center text-[15px] text-[#71717A]">Vyberte poukaz během 2 minut. Vše vám potvrdíme telefonicky nebo e-mailem.</p>

        <div className="fixed inset-x-0 top-0 z-40 border-y border-[#EDE8E0] bg-[#FAFAFA]/95 backdrop-blur">
          <section className="mx-auto max-w-6xl px-4 py-2.5">
            <div className="mb-2 flex items-center justify-between text-[11px] text-[#8A837D]">
              <p className="uppercase tracking-[0.16em]">Průběh objednávky</p>
              <p aria-live="polite">{progressPercent}%</p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ECE7DF]" aria-hidden>
              <div
                className="h-full rounded-full bg-[#C5A880] transition-[width] duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <ol className="mt-2 flex items-center gap-2 overflow-x-auto pb-1" aria-label="Průběh objednávky">
              {progressSteps.map((step, idx) => (
                <li
                  key={step.id}
                  className={`shrink-0 text-[11px] ${step.done ? 'text-[#6F5A39]' : 'text-[#A39A91]'}`}
                >
                  {idx + 1}. {step.label}
                </li>
              ))}
            </ol>
          </section>
        </div>
        <div className="h-[56px]" />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            {showValidationSummary && (
              <div className="mb-6 border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#991B1B]" role="alert">
                Doplňte prosím zvýrazněná pole. Jakmile budou údaje kompletní, můžete objednávku dokončit.
              </div>
            )}

            {/* KROK 1 — Výběr typu a konkrétního poukazu */}
            <section aria-label="Výběr poukazu" className="mb-8">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#9c9590] mb-3">Krok 1: Vyberte poukaz</p>
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
                <section aria-label="Dárkové balení">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#9c9590] mb-3">Krok 2: Zvolte předání</p>
                  <PackagingOptions packaging={packaging} onPackaging={setPackaging} />
                </section>
                <DateSelector
                  customPickupDate={customPickupDate}
                  onCustomPickupDate={setCustomPickupDate}
                  minLaterDate={minLaterDate}
                  validationHint={showValidation && !dateValid ? { step: 'date', message: 'Nastavte platné datum vyzvednutí.' } : null}
                />
                <section id="voucher-step-contact" className="scroll-mt-24" aria-label="Kontaktní údaje">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#9c9590] mb-6">Krok 3: Kontaktní údaje</p>
                  <ContactInputs
                    contactPhone={contactPhone}
                    onPhoneChange={(e) => {
                      handlePhoneChange(e);
                      setTouched((t) => ({ ...t, phone: true }));
                    }}
                    onPhoneKeyDown={handlePhoneKeyDown}
                    contactEmail={contactEmail}
                    onEmailChange={(e) => {
                      setContactEmail(e.target.value);
                      setTouched((t) => ({ ...t, email: true }));
                    }}
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

            <section className="mt-10 border border-[#E4E4E7] bg-white px-5 py-5 md:px-6">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#9c9590] mb-4">Jak to funguje</p>
              <ol className="space-y-3 text-[14px] text-[#3f3a37]">
                <li><strong>1.</strong> Zvolte si svůj dárkový poukaz.</li>
                <li><strong>2.</strong> Jakmile poukaz připravíme, ozveme se vám a společně domluvíme čas i místo předání (v salonu nebo jinde v Uherském Brodě).</li>
                <li><strong>3.</strong> Poukaz zaplatíte při předání, a to buď v hotovosti, nebo přes QR kód.</li>
              </ol>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
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
            </div>
          </aside>
        </div>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E4E4E7] bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] text-[#8a837d]">Celkem</p>
            <p className="text-[20px] font-semibold text-[#18181B] tabular-nums">{totalPrice > 0 ? formatPrice(totalPrice) : '—'}</p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-md bg-[#171717] px-5 py-3 text-[14px] font-medium text-white transition-colors hover:bg-black disabled:bg-[#E5E5E5] disabled:text-[#A3A3A3]"
          >
            {isSubmitting ? 'Odesílám…' : 'Dokončit'}
          </button>
        </div>
      </div>
    </div>
  );
}

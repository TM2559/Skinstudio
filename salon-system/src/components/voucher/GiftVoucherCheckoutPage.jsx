import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Banknote } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { VOUCHER_TYPES } from '../../constants/config';
import { callCreateVoucherOrder } from '../../firebaseConfig';

const CTA_ROUNDING = 'rounded-md'; // 4–6px sharp modern look

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function getMinLaterDate() {
  const d = new Date();
  d.setDate(d.getDate() + 2); // Tomorrow + 1 day
  return d.toISOString().slice(0, 10);
}

function formatPrice(n) {
  return new Intl.NumberFormat('cs-CZ').format(n) + ' Kč';
}

const PHONE_PREFIX = '+420';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validatePhone(value) {
  const normalized = value.replace(/\s/g, '');
  if (!normalized.startsWith('+420')) return false;
  const rest = normalized.slice(4).replace(/\s/g, '');
  return /^\d{9}$/.test(rest);
}
function validateEmail(value) {
  return EMAIL_REGEX.test((value || '').trim());
}

// Placeholder visuals when no image URLs are set (replace with env or props later)
const ENVELOPE_PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23FAFAFA"/><stop offset="100%" style="stop-color:%23F0F0F0"/></linearGradient></defs><rect width="800" height="1000" fill="url(%23g)"/><text x="400" y="480" font-family="sans-serif" font-size="24" fill="%23737373" text-anchor="middle">Dárková obálka</text></svg>'
);
const BOX_PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23E5E5E5"/><stop offset="100%" style="stop-color:%23171717"/></linearGradient></defs><rect width="800" height="1000" fill="url(%23g2)"/><text x="400" y="480" font-family="sans-serif" font-size="24" fill="%23FAFAFA" text-anchor="middle">Luxusní dárková krabička</text></svg>'
);

export default function GiftVoucherCheckoutPage() {
  const navigate = useNavigate();
  const { voucherTemplates } = useData();
  const activeVouchers = useMemo(
    () => (voucherTemplates || []).filter((v) => v.is_active !== false),
    [voucherTemplates]
  );

  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [packaging, setPackaging] = useState('envelope');
  const [pickupDateType, setPickupDateType] = useState('tomorrow');
  const [customPickupDate, setCustomPickupDate] = useState('');
  const [contactPhone, setContactPhone] = useState(PHONE_PREFIX + ' ');
  const [contactEmail, setContactEmail] = useState('');
  const [touched, setTouched] = useState({ phone: false, email: false });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = useMemo(() => {
    if (!selectedVoucher) return 0;
    return (selectedVoucher.price || 0) + (packaging === 'box' ? 100 : 0);
  }, [selectedVoucher, packaging]);

  const targetPickupDate = useMemo(() => {
    if (pickupDateType === 'tomorrow') return getTomorrow();
    return customPickupDate || null;
  }, [pickupDateType, customPickupDate]);

  const minLaterDate = getMinLaterDate();
  const tomorrowLabel = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'short' });
  }, []);

  const voucherCategory = (v) => {
    if (v.category) return v.category;
    if (v.type === VOUCHER_TYPES.VALUE) return 'value';
    return 'cosmetics';
  };
  const valueVouchers = activeVouchers.filter((v) => voucherCategory(v) === 'value');
  const cosmeticsVouchers = activeVouchers.filter((v) => voucherCategory(v) === 'cosmetics');
  const pmuVouchers = activeVouchers.filter((v) => voucherCategory(v) === 'pmu');

  const phoneValid = validatePhone(contactPhone);
  const emailValid = validateEmail(contactEmail);
  const dateValid = pickupDateType === 'tomorrow' || (customPickupDate && customPickupDate >= minLaterDate);
  const canSubmit = selectedVoucher && phoneValid && emailValid && dateValid;

  const isFormValid = selectedVoucher && contactEmail.trim() && contactPhone.length >= 9;

  const showFooter = selectedVoucher != null && totalPrice > 0;

  const handlePhoneChange = (e) => {
    let v = e.target.value.replace(/\s/g, '');
    if (!v.startsWith('+420')) v = PHONE_PREFIX + v.replace(/^\+\d*/, '');
    if (v.length > 4 && !/^\+\d*$/.test(v.slice(4))) v = v.slice(0, 4) + v.slice(4).replace(/\D/g, '');
    if (v.length > 13) v = v.slice(0, 13); // +420 999 999 999
    setContactPhone(v.length <= 4 ? v : v.slice(0, 4) + ' ' + v.slice(4).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3').trim());
  };

  const handlePhoneKeyDown = (e) => {
    if (e.key !== 'Backspace') return;
    const digitsOnly = contactPhone.replace(/\D/g, '');
    if (digitsOnly.length <= 3) e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const { data } = await callCreateVoucherOrder({
        voucherId: selectedVoucher.id,
        packaging,
        pickupDateType,
        customPickupDate: pickupDateType === 'later' ? customPickupDate : undefined,
        contactPhone,
        contactEmail: contactEmail.trim(),
      });
      const orderId = data?.orderId;
      const totalFromServer = data?.total_price ?? totalPrice;
      navigate('/poukaz/success', { state: { orderId, totalPrice: totalFromServer } });
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
  };

  if (activeVouchers.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8 bg-[#FFFFFF]">
        <p className="text-[#737373] text-center">Momentálně nemáme v prodeji žádné dárkové poukazy.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-2 min-h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] lg:overflow-hidden bg-[#FFFFFF]">
      {/* Left column (desktop) / Top (mobile) – sticky visual anchor */}
      <div className="relative w-full aspect-[4/5] lg:aspect-auto lg:h-full lg:sticky lg:top-0 bg-[#FAFAFA] overflow-hidden shrink-0">
        <div className="absolute inset-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={packaging}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <img
                src={packaging === 'box' ? BOX_PLACEHOLDER : ENVELOPE_PLACEHOLDER}
                alt={packaging === 'box' ? 'Luxusní dárková krabička' : 'Dárková obálka'}
                className="w-full h-full object-cover"
                fetchPriority="high"
              />
            </motion.div>
          </AnimatePresence>
        </div>
        <img
          src={BOX_PLACEHOLDER}
          alt=""
          className="absolute w-0 h-0 opacity-0 pointer-events-none"
          fetchPriority="low"
          aria-hidden
        />
      </div>

      {/* Right column – form (scrollable); relative so footer can be absolute within it */}
      <div className="relative flex flex-col min-h-0 lg:flex-1 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto pb-32 p-8 lg:p-16">
          <h1 className="text-2xl font-medium text-[#171717] mb-8">Dárkový poukaz</h1>

          {/* Step 1: Voucher selection */}
          <section className="mb-8" aria-label="Výběr poukazu">
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <legend className="sr-only">Vyberte dárkový poukaz</legend>
              {valueVouchers.length > 0 && (
                <>
                  <div className="md:col-span-2 text-xs uppercase tracking-widest text-[#A3A3A3] mb-4">
                    Hodnotové poukazy
                  </div>
                  {valueVouchers.map((v) => (
                    <label
                      key={v.id}
                      className={`block border cursor-pointer p-5 transition-colors ${selectedVoucher?.id === v.id
                        ? 'border-2 border-[#171717] bg-[#FAFAFA] p-[19px]'
                        : 'border border-[#E5E5E5] bg-white hover:border-[#A3A3A3]'
                        } ${CTA_ROUNDING}`}
                    >
                      <input
                        type="radio"
                        name="voucher"
                        value={v.id}
                        checked={selectedVoucher?.id === v.id}
                        onChange={() => setSelectedVoucher(v)}
                        className="sr-only"
                        aria-checked={selectedVoucher?.id === v.id}
                      />
                      <span className="font-medium text-lg text-[#171717] block">{v.name}</span>
                      {v.description && (
                        <span className="text-sm text-[#737373] block mt-1 line-clamp-2">{v.description}</span>
                      )}
                      <span className="font-semibold mt-4 block text-[#171717]">{formatPrice(v.price || 0)}</span>
                    </label>
                  ))}
                </>
              )}
              {cosmeticsVouchers.length > 0 && (
                <>
                  <div className="md:col-span-2 text-xs uppercase tracking-widest text-[#A3A3A3] mb-4 mt-8">
                    Zážitkové balíčky
                  </div>
                  {cosmeticsVouchers.map((v) => (
                    <label
                      key={v.id}
                      className={`block border cursor-pointer p-5 transition-colors ${selectedVoucher?.id === v.id
                        ? 'border-2 border-[#171717] bg-[#FAFAFA] p-[19px]'
                        : 'border border-[#E5E5E5] bg-white hover:border-[#A3A3A3]'
                        } ${CTA_ROUNDING}`}
                    >
                      <input
                        type="radio"
                        name="voucher"
                        value={v.id}
                        checked={selectedVoucher?.id === v.id}
                        onChange={() => setSelectedVoucher(v)}
                        className="sr-only"
                        aria-checked={selectedVoucher?.id === v.id}
                      />
                      <span className="font-medium text-lg text-[#171717] block">{v.name}</span>
                      {v.description && (
                        <span className="text-sm text-[#737373] block mt-1 line-clamp-2">{v.description}</span>
                      )}
                      <span className="font-semibold mt-4 block text-[#171717]">{formatPrice(v.price || 0)}</span>
                    </label>
                  ))}
                </>
              )}
              {pmuVouchers.length > 0 && (
                <>
                  <div className="md:col-span-2 text-xs uppercase tracking-widest text-[#A3A3A3] mb-4 mt-8">
                    Permanentní make-up (PMU)
                  </div>
                  {pmuVouchers.map((v) => (
                    <label
                      key={v.id}
                      className={`block border cursor-pointer p-5 transition-colors ${selectedVoucher?.id === v.id
                        ? 'border-2 border-[#171717] bg-[#FAFAFA] p-[19px]'
                        : 'border border-[#E5E5E5] bg-white hover:border-[#A3A3A3]'
                        } ${CTA_ROUNDING}`}
                    >
                      <input
                        type="radio"
                        name="voucher"
                        value={v.id}
                        checked={selectedVoucher?.id === v.id}
                        onChange={() => setSelectedVoucher(v)}
                        className="sr-only"
                        aria-checked={selectedVoucher?.id === v.id}
                      />
                      <span className="font-medium text-lg text-[#171717] block">{v.name}</span>
                      {v.description && (
                        <span className="text-sm text-[#737373] block mt-1 line-clamp-2">{v.description}</span>
                      )}
                      <span className="font-semibold mt-4 block text-[#171717]">{formatPrice(v.price || 0)}</span>
                    </label>
                  ))}
                </>
              )}
            </fieldset>
          </section>

          {/* Step 2: Packaging */}
          <section className="mb-8" aria-labelledby="step-packaging">
            <h2 id="step-packaging" className="text-xs uppercase tracking-widest text-[#A3A3A3] mb-4">
              Dárkové balení
            </h2>
            <fieldset className="flex flex-col gap-4">
              <legend className="sr-only">Vyberte balení</legend>
              <label
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border cursor-pointer p-5 transition-colors ${packaging === 'envelope'
                  ? 'border-2 border-[#171717] bg-[#FAFAFA] p-[19px]'
                  : 'border border-[#E5E5E5] bg-white hover:border-[#A3A3A3]'
                  } ${CTA_ROUNDING}`}
              >
                <input
                  type="radio"
                  name="packaging"
                  value="envelope"
                  checked={packaging === 'envelope'}
                  onChange={() => setPackaging('envelope')}
                  className="sr-only"
                  aria-checked={packaging === 'envelope'}
                />
                <div>
                  <span className="font-medium text-lg text-[#171717]">Dárková obálka</span>
                  <p className="text-sm text-[#737373] mt-1">Zdobená sušenými květinami a stuhou.</p>
                </div>
                <span className="font-semibold text-[#171717] shrink-0">V ceně</span>
              </label>
              <label
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border cursor-pointer p-5 transition-colors ${packaging === 'box'
                  ? 'border-2 border-[#171717] bg-[#FAFAFA] p-[19px]'
                  : 'border border-[#E5E5E5] bg-white hover:border-[#A3A3A3]'
                  } ${CTA_ROUNDING}`}
              >
                <input
                  type="radio"
                  name="packaging"
                  value="box"
                  checked={packaging === 'box'}
                  onChange={() => setPackaging('box')}
                  className="sr-only"
                  aria-checked={packaging === 'box'}
                />
                <div>
                  <span className="font-medium text-lg text-[#171717]">Luxusní dárková krabička</span>
                  <p className="text-sm text-[#737373] mt-1">S elegantní výplní, zdobením a stuhou.</p>
                </div>
                <span className="font-semibold text-[#171717] shrink-0">+ 100 Kč</span>
              </label>
            </fieldset>
          </section>

          {/* Step 3: Fulfillment & contact */}
          <section className="mt-8 mb-8" aria-labelledby="step-fulfillment">
            <h2 id="step-fulfillment" className="text-xl font-medium text-[#171717] mb-4">
              Kdy si přejete poukaz vyzvednout?
            </h2>

            <fieldset className="flex flex-col md:flex-row md:gap-6 gap-4 mb-5">
              <legend className="sr-only">Datum vyzvednutí</legend>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pickup"
                  value="tomorrow"
                  checked={pickupDateType === 'tomorrow'}
                  onChange={() => setPickupDateType('tomorrow')}
                  className="w-4 h-4 border-[#E5E5E5] text-[#171717] focus:ring-[#171717]"
                />
                <span className="text-[#171717]">Zítra</span>
                <span className="text-sm text-[#737373]">({tomorrowLabel})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pickup"
                  value="later"
                  checked={pickupDateType === 'later'}
                  onChange={() => setPickupDateType('later')}
                  className="w-4 h-4 border-[#E5E5E5] text-[#171717] focus:ring-[#171717]"
                />
                <span className="text-[#171717]">Vybrat jiné datum</span>
              </label>
            </fieldset>

            {pickupDateType === 'later' && (
              <div className="mb-5">
                <label htmlFor="custom-pickup-date" className="block text-sm font-medium text-[#171717] mb-1.5">
                  Datum vyzvednutí
                </label>
                <input
                  id="custom-pickup-date"
                  type="date"
                  min={minLaterDate}
                  value={customPickupDate}
                  onChange={(e) => setCustomPickupDate(e.target.value)}
                  className="w-full max-w-xs p-3 border border-[#E5E5E5] text-[#171717] bg-white focus:outline-none focus:ring-2 focus:ring-[#171717] focus:ring-offset-0"
                  style={{ borderRadius: '4px' }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label htmlFor="contact-phone" className="block text-sm font-medium text-[#171717] mb-1.5">
                  Telefonní číslo <span className="text-[#737373] font-normal">(+420)</span>
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  inputMode="tel"
                  value={contactPhone}
                  onChange={handlePhoneChange}
                  onKeyDown={handlePhoneKeyDown}
                  onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                  placeholder="+420 123 456 789"
                  className={`w-full p-3 border bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717] focus:ring-offset-0 ${touched.phone && !phoneValid ? 'border-red-500' : 'border-[#E5E5E5]'
                    }`}
                  style={{ borderRadius: '4px' }}
                  aria-required="true"
                  aria-invalid={touched.phone && !phoneValid}
                />
                {touched.phone && !phoneValid && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    Zadejte platné české číslo (+420 a 9 číslic).
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-[#171717] mb-1.5">
                  E-mail
                </label>
                <input
                  id="contact-email"
                  type="email"
                  inputMode="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  placeholder="vas@email.cz"
                  className={`w-full p-3 border bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717] focus:ring-offset-0 ${touched.email && !emailValid ? 'border-red-500' : 'border-[#E5E5E5]'
                    }`}
                  style={{ borderRadius: '4px' }}
                  aria-required="true"
                  aria-invalid={touched.email && !emailValid}
                />
                {touched.email && !emailValid && contactEmail.trim() && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    Zadejte platnou e-mailovou adresu.
                  </p>
                )}
              </div>
            </div>

            <div
              className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-md py-3 px-4 flex gap-3 text-sm text-[#4B5563]"
              role="status"
            >
              <Info size={20} className="shrink-0 mt-0.5 text-[#737373]" aria-hidden />
              <p>
                {packaging === 'box'
                  ? 'Vaši dárkovou krabičku začneme pečlivě připravovat. Jakmile bude hotová, pošleme vám na uvedené číslo SMS s potvrzením a adresou pro flexibilní vyzvednutí v Uherském Brodě.'
                  : 'Vaši dárkovou obálku začneme pečlivě připravovat. Jakmile bude hotová, pošleme vám na uvedené číslo SMS s potvrzením a adresou pro flexibilní vyzvednutí v Uherském Brodě.'}
              </p>
            </div>
          </section>
        </div>

        {/* Step 4: Footer – absolute within right column so it spans exactly 50% width on desktop */}
        {showFooter && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute bottom-0 left-0 w-full z-50 bg-white border-t border-gray-200 py-4 px-6 lg:px-8 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
          >
            {submitError && (
              <p className="text-xs text-red-600 mb-2" role="alert">
                {submitError}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-full">
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#737373] text-sm shrink-0">Celkem k úhradě</span>
                  <span className="font-semibold text-lg text-[#171717] shrink-0" aria-live="polite" aria-atomic="true">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <p className="text-xs text-[#737373] flex items-center gap-2">
                  <Banknote size={14} className="shrink-0" aria-hidden />
                  Platba proběhne v hotovosti při osobním převzetí.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="w-full sm:w-auto shrink-0 bg-[#171717] text-white font-medium px-8 py-2.5 rounded-md hover:bg-black transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Odesílám…' : 'Závazně objednat'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

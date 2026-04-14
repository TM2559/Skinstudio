import { VOUCHER_VALUE_CUSTOM_MIN_KC } from '../../constants/config';

export function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function getMinLaterDate() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}

export function formatPrice(n) {
  return new Intl.NumberFormat('cs-CZ').format(n) + ' Kč';
}

/** Číslo s mezerami jako v ceně, bez „Kč“ (pro nadpis „Poukaz na …“). */
export function formatKcDigits(n) {
  return new Intl.NumberFormat('cs-CZ').format(n);
}

export function minVoucherPrice(vouchers) {
  if (!vouchers?.length) return 0;
  return Math.min(...vouchers.map((v) => v.price || 0));
}

export function valueCategoryMinDisplay(vouchers) {
  const tMin = vouchers?.length ? minVoucherPrice(vouchers) : null;
  return tMin ?? 0;
}

/** Minimální částka pro šablonu „vlastní hodnota“. */
export function templateAmountMinKc(v) {
  if (!v?.is_custom_amount) return 0;
  return Math.max(VOUCHER_VALUE_CUSTOM_MIN_KC, v.price || 0);
}

export const PHONE_PREFIX = '+420';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePhone(value) {
  const normalized = value.replace(/\s/g, '');
  if (!normalized.startsWith('+420')) return false;
  const rest = normalized.slice(4).replace(/\s/g, '');
  return /^\d{9}$/.test(rest);
}

export function validateEmail(value) {
  return EMAIL_REGEX.test((value || '').trim());
}

/** Okamžité zarovnání kotvy bez plynulého scrollu (`behavior: 'auto'`). */
export function scrollVoucherStepIntoView(elementId) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    });
  });
}

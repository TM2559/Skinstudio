import { VOUCHER_TYPES } from '../constants/config';

/** Sjednocení typu z Firestore (různá velikost písmen / legacy zápisy). */
export function normalizeVoucherType(type) {
  const t = String(type ?? '').toLowerCase();
  if (t === 'service') return VOUCHER_TYPES.SERVICE;
  return VOUCHER_TYPES.VALUE;
}

/**
 * Skupina pro výpis na webu (hodnota / kosmetika / PMU).
 * Hodnotové poukazy musí mít typ value i bez pole category.
 */
export function voucherDisplayCategory(v) {
  if (v.category) return v.category;
  if (normalizeVoucherType(v.type) === VOUCHER_TYPES.VALUE) return 'value';
  return 'cosmetics';
}

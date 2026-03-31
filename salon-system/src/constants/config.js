/**
 * Centralized app configuration – all magic numbers, thresholds, and
 * business-logic constants live here instead of being scattered in components.
 */

export const BOOKING = {
  DAYS_AHEAD: 60,
  TIME_STEP_MIN: 30,
  DEFAULT_DURATION: 60,
};

export const ADMIN = {
  LOGIN_CLICK_COUNT: 7,
  LOGIN_CLICK_TIMEOUT_MS: 2000,
};

export const CONTACT = {
  PHONE: '+420 724 875 558',
  PHONE_LINK: 'tel:+420724875558',
  EMAIL_PUBLIC: 'info@skinstudio.cz',
  EMAIL_RESERVATIONS: 'rezervace@skinstudio.cz',
};

export const THEME = {
  ROSE_ACCENT: '#daa59c',
  ROSE_ACCENT_DARK: '#B37E76',
  GOLD_DARK: 'var(--skin-gold-dark)',
  PMU_BG: '#0F0F0F',
  PMU_ACCENT: '#C48F83',
};

export const BREAKPOINTS = {
  MOBILE: 767,
};

/** Hero 21:9 nad formulářem — vložte `public/voucher-checkout-hero.jpg` nebo `VITE_VOUCHER_CHECKOUT_HERO_URL`. */
export const VOUCHER_CHECKOUT_HERO_URL =
  import.meta.env.VITE_VOUCHER_CHECKOUT_HERO_URL || '/voucher-checkout-hero.jpg';

export const PMU_DURATIONS = [180, 210, 240, 270];

export const COLLECTIONS = {
  RESERVATIONS: 'reservations',
  SERVICES: 'services',
  ADDONS: 'addons',
  SERVICE_ADDON_LINKS: 'service_addon_links',
  SCHEDULE: 'schedule',
  SCHEDULE_PMU: 'schedule_pmu',
  GALLERY: 'gallery',
  TRANSFORMATIONS: 'transformations',
  VOUCHER_TEMPLATES: 'voucher_templates',
  VOUCHER_ORDERS: 'voucher_orders',
};

/** Voucher template type: fixed amount or tied to a service */
export const VOUCHER_TYPES = {
  VALUE: 'value',
  SERVICE: 'service',
};

/** Minimální částka u „vlastní hodnoty“ v administraci dárkových poukazů */
export const VOUCHER_VALUE_CUSTOM_MIN_KC = 500;

/** Display category for voucher grouping (value / cosmetics / pmu) */
export const VOUCHER_CATEGORIES = {
  VALUE: 'value',
  COSMETICS: 'cosmetics',
  PMU: 'pmu',
};

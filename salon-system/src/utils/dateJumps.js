/**
 * Práce s ISO datem (YYYY-MM-DD) v lokálním čase + „skoky o N týdnů“,
 * aby se termín typu „za 6 týdnů“ nemusel ručně odpočítávat v kalendáři.
 */

/** Nabízené skoky v týdnech (tlačítka „+N týdnů“). */
export const WEEK_JUMPS = [1, 2, 4, 6, 8];

/** Skoky pro „Objednat znovu za …“ – typické intervaly mezi ošetřeními. */
export const REBOOK_WEEK_JUMPS = [3, 4, 6, 8];

const WEEKDAYS_SHORT = ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'];

export function isoFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dateFromISO(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysISO(iso, days) {
  const d = dateFromISO(iso);
  d.setDate(d.getDate() + days);
  return isoFromDate(d);
}

export function addWeeksISO(iso, weeks) {
  return addDaysISO(iso, weeks * 7);
}

/** Pondělí týdne, do kterého datum patří. */
export function mondayOfISO(iso) {
  const d = dateFromISO(iso);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return isoFromDate(d);
}

/** Pozdější ze dvou ISO dat (ISO řetězce jdou porovnávat lexikálně). */
export function laterISO(a, b) {
  return a > b ? a : b;
}

/** 1 → „1 týden“, 2–4 → „N týdny“, 5+ → „N týdnů“. */
export function weeksLabel(n) {
  if (n === 1) return '1 týden';
  if (n >= 2 && n <= 4) return `${n} týdny`;
  return `${n} týdnů`;
}

/** „pá 30. 10.“ */
export function shortDateCs(iso) {
  const d = dateFromISO(iso);
  return `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}.`;
}

/** „pá 30. 10. 2026“ */
export function longDateCs(iso) {
  return `${shortDateCs(iso)} ${dateFromISO(iso).getFullYear()}`;
}

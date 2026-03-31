/**
 * SMS šablony – texty na jednom místě pro snadnou úpravu.
 * Pro doručení přes BulkGate používejte text bez diakritiky (GSM 03.38, max 160 znaků na SMS).
 */

/** Fyzická adresa studia (bez diakritiky pro SMS). Před nasazením doplňte správnou adresu. */
const STUDIO_ADDRESS = 'Masarykovo nam. 72, Uhersky Brod';

/**
 * SMS zákazníkovi hned po vytvoření objednávky poukazu (potvrzení objednávky).
 * @param {number} totalPrice - Celková cena v Kč (k úhradě v hotovosti).
 * @returns {string} Text SMS bez diakritiky (max 160 znaků).
 */
function buildVoucherOrderConfirmationSms(totalPrice) {
  const priceStr = typeof totalPrice === 'number' ? String(totalPrice) : String(Number(totalPrice) || 0);
  return `Skin Studio: Dekujeme za objednavku. Poukaz pro Vas prave balime. Pripravte si prosim ${priceStr} Kc v hotovosti. Az bude pripraven, posleme adresu.`;
}

/**
 * SMS zákazníkovi při přechodu objednávky poukazu do stavu „Připraveno“ (ready).
 * @param {number} totalPrice - Celková cena v Kč (k úhradě v hotovosti).
 * @returns {string} Text SMS bez diakritiky.
 */
function buildVoucherReadySms(totalPrice) {
  const priceStr = typeof totalPrice === 'number' ? String(totalPrice) : String(Number(totalPrice) || 0);
  return `Skin Studio: Vas poukaz je krasne zabaleny a pripraveny. Adresa: ${STUDIO_ADDRESS}. K uhrade: ${priceStr} Kc v hotovosti. Napiste, v kolik dorazite.`;
}

export { STUDIO_ADDRESS, buildVoucherOrderConfirmationSms, buildVoucherReadySms };

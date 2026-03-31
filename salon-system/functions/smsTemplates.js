/**
 * Texty SMS pro dárkové poukazy (BulkGate; před odesláním se volá removeDiacritics).
 */

export function buildVoucherOrderConfirmationSms(totalPrice) {
  const price =
    typeof totalPrice === 'number'
      ? totalPrice
      : parseInt(totalPrice, 10) || 0;
  return `Skin Studio: Objednávka poukazu přijata (${price} Kč). Brzy vás budeme informovat. Děkujeme!`;
}

export function buildVoucherReadySms(totalPrice) {
  const price =
    typeof totalPrice === 'number'
      ? totalPrice
      : parseInt(totalPrice, 10) || 0;
  return `Skin Studio: Váš poukaz (${price} Kč) je připraven k vyzvednutí. Těšíme se na vás!`;
}

/**
 * První neplatný krok ve formuláři (sekvenční validace po kliknutí na CTA).
 * @returns {{ step: string, message: string } | null}
 */
export function getFirstInvalidStep({
  expandedCategory,
  selectedVoucher,
  customAmountValid,
  dateValid,
  phoneValid,
  emailValid,
}) {
  if (!expandedCategory) {
    return { step: 'type', message: 'Vyberte typ dárkového poukazu.' };
  }
  if (!selectedVoucher) {
    return { step: 'voucher', message: 'Vyberte konkrétní poukaz ze seznamu.' };
  }
  if (selectedVoucher.is_custom_amount && !customAmountValid) {
    return { step: 'amount', message: 'Zadejte platnou částku v korunách.' };
  }
  if (!dateValid) {
    return { step: 'date', message: 'Nastavte platné datum vyzvednutí.' };
  }
  if (!phoneValid) {
    return { step: 'phone', message: 'Zadejte platné telefonní číslo (+420).' };
  }
  if (!emailValid) {
    return { step: 'email', message: 'Zadejte platnou e-mailovou adresu.' };
  }
  return null;
}

export const VOUCHER_SCROLL_IDS = {
  type: 'voucher-step-type',
  voucher: 'voucher-step-specific',
  amount: 'voucher-step-specific',
  date: 'voucher-step-pickup-date',
  phone: 'voucher-step-contact',
  email: 'voucher-step-contact',
};

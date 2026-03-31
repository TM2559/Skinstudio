/**
 * Text „další krok“ pro sticky footer + popisek primárního CTA (progressive disclosure).
 */
export function getNextStepMessage({
  expandedCategory,
  selectedVoucher,
  customAmountValid,
  dateValid,
  phoneValid,
  emailValid,
}) {
  if (!expandedCategory) return 'Další krok: zvolte typ dárkového poukazu.';
  if (!selectedVoucher) return 'Další krok: vyberte konkrétní poukaz ze seznamu.';
  if (selectedVoucher.is_custom_amount && !customAmountValid) {
    return 'Další krok: zadejte platnou částku (minimálně dle pravidel poukazu).';
  }
  if (!dateValid) return 'Další krok: nastavte datum vyzvednutí.';
  if (!phoneValid || !emailValid) return 'Další krok: vyplňte telefon a e-mail.';
  return 'Další krok: odešlete objednávku tlačítkem níže.';
}


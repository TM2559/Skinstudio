/**
 * Minimalist GDPR disclaimer below the booking form submit button.
 * Opens privacy modal/slide-over on click (no navigation).
 */
export function BookingLegalText({ onOpenPrivacyModal, isDark = false }) {
  const baseClass = 'text-[11px] leading-tight mt-3 text-center';
  const textClass = isDark ? 'text-stone-500' : 'text-stone-400';
  const buttonClass = [
    'underline underline-offset-[3px] rounded-sm transition-colors duration-200',
    isDark
      ? 'text-stone-400 decoration-stone-600 hover:text-stone-300 hover:decoration-stone-500 focus-visible:ring-stone-600'
      : 'text-stone-500 decoration-stone-300 hover:text-stone-600 hover:decoration-stone-400 focus-visible:ring-stone-300',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  ].join(' ');

  return (
    <div className={`${baseClass} ${textClass}`}>
      Pro dokončení rezervace zpracováváme vaše osobní údaje dle{' '}
      <button
        type="button"
        onClick={onOpenPrivacyModal}
        className={buttonClass}
        aria-label="Otevřít Zásady soukromí"
      >
        Zásad soukromí.
      </button>
    </div>
  );
}

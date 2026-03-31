import React from 'react';
import SectionHeading from './SectionHeading';
import TypeSelectionGrid from './TypeSelectionGrid';

export default function StepOneType({
  categoryGroups,
  expandedCategory,
  onOpenCategory,
  validationHint,
  shakeStep,
}) {
  const showTypeIssue = validationHint?.step === 'type';
  const shake = shakeStep === 'type';

  return (
    <section className="mb-0" aria-label="Krok 1 — typ poukazu">
      <fieldset>
        <legend className="sr-only">Vyberte typ dárkového poukazu</legend>
        <SectionHeading>Typ poukazu</SectionHeading>
        <div
          id="voucher-step-type"
          className={`scroll-mt-24 ${showTypeIssue ? 'ring-1 ring-[#EF4444]' : ''} ${shake ? 'animate-voucher-form-shake' : ''}`.trim()}
        >
          <TypeSelectionGrid
            categoryGroups={categoryGroups}
            expandedCategory={expandedCategory}
            onOpenCategory={onOpenCategory}
          />
        </div>
        {showTypeIssue && (
          <p className="text-[11px] font-medium text-[#EF4444] mt-1.5" role="status">
            {validationHint.message}
          </p>
        )}
      </fieldset>
    </section>
  );
}

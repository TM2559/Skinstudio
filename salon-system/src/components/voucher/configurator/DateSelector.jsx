import React from 'react';

export default function DateSelector({
  pickupDateType,
  onPickupDateType,
  tomorrowLabel,
  customPickupDate,
  onCustomPickupDate,
  minLaterDate,
  validationHint,
  shakeStep,
}) {
  const showDateIssue = validationHint?.step === 'date';
  const shake = shakeStep === 'date';

  return (
    <div
      id="voucher-step-pickup-date"
      className={`scroll-mt-24 mb-12 ${showDateIssue ? 'ring-1 ring-[#EF4444] p-px' : ''} ${shake ? 'animate-voucher-form-shake' : ''}`.trim()}
    >
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#9c9590] mb-6">Datum vyzvednutí</p>
      <fieldset className="border-0 p-0 m-0">
        <legend className="sr-only">Datum vyzvednutí</legend>
        <div className="flex flex-col gap-3">
          <label
            className={`relative overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-wrap items-baseline justify-between gap-4 px-6 py-5 cursor-pointer border border-[#E4E4E7] bg-[#FFFFFF] ${
              pickupDateType === 'tomorrow'
                ? 'border-[#C5A880] ring-1 ring-inset ring-[#C5A880] bg-[#FAFAFA]'
                : 'hover:bg-[#FAFAFA]'
            }`}
          >
            <input
              type="radio"
              name="pickup"
              value="tomorrow"
              checked={pickupDateType === 'tomorrow'}
              onChange={() => onPickupDateType('tomorrow')}
              className="sr-only"
            />
            <span className="text-[#2a2624] font-medium">Zítra</span>
            <span className="text-sm text-[#6b6560]">({tomorrowLabel})</span>
          </label>
          <label
            className={`relative overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-wrap items-baseline justify-between gap-4 px-6 py-5 cursor-pointer border border-[#E4E4E7] bg-[#FFFFFF] ${
              pickupDateType === 'later'
                ? 'border-[#C5A880] ring-1 ring-inset ring-[#C5A880] bg-[#FAFAFA]'
                : 'hover:bg-[#FAFAFA]'
            }`}
          >
            <input
              type="radio"
              name="pickup"
              value="later"
              checked={pickupDateType === 'later'}
              onChange={() => onPickupDateType('later')}
              className="sr-only"
            />
            <span className="text-[#2a2624] font-medium">Vybrat jiné datum</span>
          </label>
        </div>
      </fieldset>

      {pickupDateType === 'later' && (
        <div className="mt-8">
          <label htmlFor="custom-pickup-date" className="sr-only">
            Datum vyzvednutí
          </label>
          <input
            id="custom-pickup-date"
            type="date"
            min={minLaterDate}
            value={customPickupDate}
            onChange={(e) => onCustomPickupDate(e.target.value)}
            className={`w-full max-w-xs bg-transparent border-0 border-b rounded-none py-3 px-0 text-base focus:outline-none [color-scheme:light] ${
              showDateIssue && !customPickupDate
                ? 'border-[#EF4444] text-[#EF4444] focus:border-[#EF4444]'
                : 'border-[#EDE8E0] text-[#2a2624] focus:border-[#c5aa80]'
            }`}
          />
        </div>
      )}
      {showDateIssue && (
        <p className="text-[11px] font-medium text-[#EF4444] mt-1.5" role="status">
          {validationHint.message}
        </p>
      )}
    </div>
  );
}

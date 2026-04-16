import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { cs } from 'date-fns/locale';
import { format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('cs', cs);

export default function DateSelector({
  customPickupDate,
  onCustomPickupDate,
  minLaterDate,
  validationHint,
}) {
  const showDateIssue = validationHint?.step === 'date';
  const selectedDate = customPickupDate ? new Date(`${customPickupDate}T12:00:00`) : null;
  const minDate = minLaterDate ? new Date(`${minLaterDate}T12:00:00`) : null;

  return (
    <div
      id="voucher-step-pickup-date"
      className={`scroll-mt-24 mb-12 ${showDateIssue ? 'ring-1 ring-[#EF4444] p-px' : ''}`.trim()}
    >
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#9c9590] mb-6">Datum vyzvednutí</p>
      <div className="border border-[#E4E4E7] bg-white px-6 py-5">
        <label htmlFor="custom-pickup-date" className="block text-sm font-medium text-[#2a2624] mb-3">
          Vyberte datum převzetí
        </label>
        <DatePicker
          id="custom-pickup-date"
          selected={selectedDate}
          onChange={(date) => onCustomPickupDate(date ? format(date, 'yyyy-MM-dd') : '')}
          minDate={minDate}
          dateFormat="dd.MM.yyyy"
          locale="cs"
          placeholderText="DD.MM.YYYY"
          className={`w-full max-w-xs bg-transparent border-0 border-b rounded-none py-3 px-0 text-base focus:outline-none [color-scheme:light] ${
            showDateIssue && !customPickupDate
              ? 'border-[#EF4444] text-[#EF4444] focus:border-[#EF4444]'
              : 'border-[#EDE8E0] text-[#2a2624] focus:border-[#c5aa80]'
          }`}
          calendarClassName="border border-[#E4E4E7] shadow-lg"
          popperClassName="z-[70]"
          showPopperArrow={false}
        />
      </div>
      {showDateIssue && (
        <p className="text-[11px] font-medium text-[#EF4444] mt-1.5" role="status">
          {validationHint.message}
        </p>
      )}
    </div>
  );
}

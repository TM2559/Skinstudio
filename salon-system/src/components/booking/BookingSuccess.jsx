import React from 'react';
import { CheckCircle, AlertCircle, Calendar as CalendarIcon, CalendarPlus } from 'lucide-react';
import { Utils } from '../../utils/helpers';

export default function BookingSuccess({ isDark, reservationDetails, onReset }) {
  const { date, time, duration, serviceName, price } = reservationDetails;

  const calendarTitle = `Skin Studio: ${serviceName}`;
  const calendarDesc = `Rezervace ošetření: ${serviceName}. Těšíme se na vás!`;
  const googleCalendarUrl = Utils.createGoogleCalendarLink(date, time, duration, calendarTitle, calendarDesc);

  const handleAppleCalendar = () => {
    Utils.downloadICSFile(date, time, duration, calendarTitle, calendarDesc);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8 mt-4">
        <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-[#daa59c]/10' : 'bg-[#a3803d]/10'}`}>
          <CheckCircle size={32} className={isDark ? 'text-[#daa59c]' : 'text-[var(--skin-gold-dark)]'} />
        </div>
        <h2 className={`font-display text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-[var(--skin-charcoal)]'}`}>
          Vaše rezervace je potvrzena
        </h2>
        <p className={`text-sm mt-3 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          Potvrzení s detaily jsme právě odeslali na váš e-mail.
        </p>
      </div>

      <div className={`p-6 rounded-xl border mb-6 ${isDark ? 'bg-white/5 border-stone-800' : 'bg-white border-[var(--skin-beige-muted)] shadow-sm'}`}>
        <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-4 border-b pb-3 ${isDark ? 'text-stone-400 border-stone-800' : 'text-stone-400 border-stone-100'}`}>
          Shrnutí termínu
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Služba</span>
            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[var(--skin-charcoal)]'}`}>{serviceName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Kdy</span>
            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[var(--skin-charcoal)]'}`}>
              {Utils.formatDateDisplay(date)} v {time}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Cena</span>
            <span className={`text-sm font-semibold ${isDark ? 'text-[#daa59c]' : 'text-[var(--skin-gold-dark)]'}`}>{price} Kč</span>
          </div>
        </div>
      </div>

      {isDark && (
        <div className="p-5 rounded-xl border border-[#daa59c]/30 bg-[#daa59c]/5 mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#daa59c] flex items-center gap-2 mb-3">
            <AlertCircle size={16} /> Důležité před zákrokem
          </h3>
          <ul className="text-sm text-stone-300 space-y-2 list-disc pl-4">
            <li>24 hodin před zákrokem nepijte kávu, energetické nápoje ani alkohol.</li>
            <li>Neberte léky na ředění krve (např. Ibalgin, Aspirin).</li>
            <li>V případě těhotenství či nemoci nás obratem kontaktujte pro přesun termínu.</li>
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <h3 className={`text-[10px] font-bold uppercase tracking-widest text-center mb-3 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
          Uložit termín do kalendáře
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleAppleCalendar}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${
              isDark
                ? 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300'
            }`}
          >
            <CalendarIcon size={16} /> Apple Kalendář
          </button>
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${
              isDark
                ? 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300'
            }`}
          >
            <CalendarPlus size={16} /> Google Kalendář
          </a>
        </div>
      </div>

      <div className="mt-8 text-center border-t pt-6" style={{ borderColor: isDark ? '#292524' : 'var(--skin-beige-muted)' }}>
        <button
          type="button"
          onClick={onReset}
          className={`text-xs uppercase tracking-widest font-semibold hover:underline ${isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-[var(--skin-charcoal)]'}`}
        >
          Zpět na nabídku služeb
        </button>
      </div>
    </div>
  );
}

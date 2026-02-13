import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { addDoc } from "firebase/firestore";
import { Utils } from '../utils/helpers';
import { getCollectionPath, EMAILJS_CONFIG } from '../firebaseConfig';

const CustomerView = ({ services, schedule, reservations, onBookingSuccess, initialServiceId, theme = 'light' }) => {
  const ADMIN_EMAIL = "info@skinstudio.cz";
  const isDark = theme === 'dark';

  const [selectedService, setSelectedService] = useState(null);
  const hasAppliedInitialService = useRef(false);

  useEffect(() => {
    if (hasAppliedInitialService.current || !initialServiceId || !services.length) return;
    const svc = services.find((s) => s.id === initialServiceId);
    if (svc) {
      setSelectedService(svc);
      hasAppliedInitialService.current = true;
    }
  }, [initialServiceId, services]);
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedUpsells, setSelectedUpsells] = useState([]);

  const handleUpsellToggle = (service, isActive) => {
    setSelectedUpsells(prev =>
      isActive ? [...prev, service] : prev.filter(u => u.id !== service.id)
    );
  };

  const clientDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = Utils.formatDateKey(d);
      const dayData = schedule[key];
      if (dayData && (dayData.periods?.length > 0 || dayData.start)) dates.push(d);
    }
    return dates;
  }, [schedule]);

  const activeDateStr = selectedDateStr || (clientDates.length > 0 ? Utils.formatDateKey(clientDates[0]) : null);

  /** Počet volných slotů pro každý den (pro vybranou službu) – pro zakázání dnů s 0 volných */
  const slotsPerDate = useMemo(() => {
    const map = new Map();
    if (!selectedService) return map;
    const duration = parseInt(selectedService.duration);
    clientDates.forEach((d) => {
      const key = Utils.formatDateKey(d);
      const dayData = schedule[key];
      if (!dayData) return;
      const periods = dayData.periods || (dayData.start ? [{ start: dayData.start, end: dayData.end }] : []);
      const bookedIntervals = reservations
        .filter((r) => r.date === key)
        .map((r) => ({ start: Utils.timeToMinutes(r.time), end: Utils.timeToMinutes(r.time) + (r.duration || 60) }));
      const slots = Utils.getSmartSlots(periods, duration, bookedIntervals);
      map.set(key, slots.length);
    });
    return map;
  }, [clientDates, selectedService, schedule, reservations]);

  // --- ZMĚNA: Použití chytré logiky (getSmartSlots) ---
  const availableSlots = useMemo(() => {
    if (!activeDateStr || !selectedService) return [];
    const dayData = schedule[activeDateStr];
    if (!dayData) return [];

    // 1. Získáme pracovní bloky
    const periods = dayData.periods || (dayData.start ? [{ start: dayData.start, end: dayData.end }] : []);
    
    // 2. Získáme obsazené intervaly ten den
    const bookedIntervals = reservations
      .filter(r => r.date === activeDateStr)
      .map(r => ({ start: Utils.timeToMinutes(r.time), end: Utils.timeToMinutes(r.time) + (r.duration || 60) }));

    // 3. Zavoláme naši novou funkci "Magnet"
    return Utils.getSmartSlots(
      periods, 
      parseInt(selectedService.duration), 
      bookedIntervals
    );

  }, [activeDateStr, selectedService, schedule, reservations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTime || !selectedService || !formData.email) return;
    setIsSending(true);

    try {
      const calendarLink = Utils.createGoogleCalendarLink(
        activeDateStr, selectedTime, parseInt(selectedService.duration),
        `REZERVACE: ${selectedService.name} (${formData.name})`, `Klient: ${formData.name}, Tel: ${formData.phone}`
      );

      await addDoc(getCollectionPath("reservations"), {
        date: activeDateStr,
        time: selectedTime,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        serviceName: selectedService.name,
        duration: parseInt(selectedService.duration),
        price: selectedService.price || 0,
        created: new Date().toISOString(),
        reminderSent: false,
        source: 'web'
      });

      if (EMAILJS_CONFIG.PUBLIC_KEY) {
        // Klient
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: EMAILJS_CONFIG.SERVICE_ID,
            template_id: EMAILJS_CONFIG.CONFIRM_TEMPLATE,
            user_id: EMAILJS_CONFIG.PUBLIC_KEY,
            template_params: {
              name: formData.name,
              to_email: formData.email,
              date: Utils.formatDateDisplay(activeDateStr),
              time: selectedTime,
              service: selectedService.name,
              reply_to: ADMIN_EMAIL 
            }
          })
        });

        // Admin
        if (EMAILJS_CONFIG.ADMIN_TEMPLATE) {
            await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: EMAILJS_CONFIG.SERVICE_ID,
                template_id: EMAILJS_CONFIG.ADMIN_TEMPLATE,
                user_id: EMAILJS_CONFIG.PUBLIC_KEY,
                template_params: {
                name: formData.name,
                to_email: ADMIN_EMAIL,
                date: Utils.formatDateDisplay(activeDateStr),
                time: selectedTime,
                service: selectedService.name,
                phone: formData.phone,
                reply_to: formData.email,
                calendar_link: calendarLink 
                }
            })
            });
        }
      }

      setIsSuccess(true);
      if (onBookingSuccess) onBookingSuccess();
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ name: '', phone: '', email: '' });
        setSelectedTime(null);
        setSelectedService(null);
        setSelectedUpsells([]);
      }, 5000);

    } catch (err) {
      console.error(err);
      alert("Chyba při rezervaci.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 md:grid md:grid-cols-2 md:gap-12">
      <div className="flex flex-col gap-10">
        <div>
          <h2 className={`text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2 border-b pb-2 ${isDark ? 'text-stone-300 border-stone-800' : 'text-stone-500 border-stone-100'}`}>
            <span
              className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-[8px] ${isDark ? 'bg-[#daa59c]' : ''}`}
              style={!isDark ? { backgroundColor: 'var(--skin-gold-dark)' } : undefined}
            >
              1
            </span>
            1. Výběr procedury
          </h2>
          <div className="grid gap-3">
            {services.map(s => {
              const isSelected = selectedService?.id === s.id;
              const addons = s.available_addons ?? [];
              return (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => { setSelectedService(s); setSelectedTime(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedService(s); setSelectedTime(null); } }}
                  className={`p-4 rounded-xl border transition-all text-left relative shadow-sm cursor-pointer ${
                    isDark
                      ? isSelected
                        ? 'bg-stone-900 border-[#daa59c]/70 border-l-4 border-l-[#daa59c]'
                        : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                      : isSelected
                        ? 'bg-[#F9F7F2] border border-stone-200 border-l-2'
                        : 'bg-white border-gray-100 hover:border-stone-200'
                  }`}
                  style={!isDark && isSelected ? { borderLeftColor: 'var(--skin-gold-dark)' } : undefined}
                >
                  <div className="flex justify-between items-start gap-4">
                    <span className={`text-sm leading-tight ${isDark ? (isSelected ? 'font-bold text-white' : 'font-medium text-stone-200') : isSelected ? 'font-bold text-stone-900' : 'font-medium text-stone-800'}`}>{s.name}</span>
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg shrink-0 whitespace-nowrap ${isDark ? 'text-[#daa59c] bg-stone-800' : 'text-stone-700 bg-stone-100'}`}>
                      {s.price} Kč
                    </span>
                  </div>
                  {isSelected && addons.length > 0 && (
                    <div className={`mt-4 pt-3 border-t space-y-2 ${isDark ? 'border-stone-800' : 'border-stone-100'}`}>
                      {addons.map((upsell) => {
                        const isUpsellActive = selectedUpsells.some((u) => u.id === upsell.id);
                        const hasPrice = upsell.price != null && upsell.price !== '';
                        return (
                          <div
                            key={upsell.id}
                            className={`flex justify-between items-center rounded-lg py-1 -mx-1 px-1 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-col justify-center min-w-0">
                              <span className={`text-sm font-medium ${isDark ? (isUpsellActive ? 'text-white' : 'text-stone-300') : isUpsellActive ? 'text-stone-900' : 'text-stone-700'}`}>
                                {upsell.name}
                              </span>
                              {hasPrice && (
                                <span className={`text-[10px] font-light tracking-wide uppercase mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                                  zvýhodněná cena k ošetření
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpsellToggle(upsell, !isUpsellActive);
                              }}
                              className={`ml-4 rounded-full px-3 py-1 text-xs font-semibold transition-colors border flex-shrink-0 ${
                                isDark
                                  ? isUpsellActive
                                    ? 'bg-[#daa59c]/90 text-white border-[#daa59c]/50'
                                    : 'bg-stone-800 text-stone-200 border-stone-700 hover:border-stone-600'
                                  : isUpsellActive
                                    ? 'bg-stone-800 text-white border-stone-800'
                                    : 'bg-white text-stone-800 border-stone-200 hover:border-stone-300'
                              }`}
                              aria-label={isUpsellActive ? 'Odebrat' : 'Přidat'}
                            >
                              {isUpsellActive ? '✓' : (hasPrice ? `+ ${upsell.price} Kč` : '+')}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Krok 2: Datum */}
        <div className={!selectedService ? 'opacity-20 pointer-events-none' : ''}>
          <h2 className={`text-[10px] font-bold uppercase tracking-widest mb-6 border-b pb-2 ${isDark ? 'text-stone-300 border-stone-800' : 'text-stone-500 border-stone-100'}`}>2. Termín</h2>
          <div className="mobile-carousel-strip flex gap-3 pb-4">
            {clientDates.length === 0 && <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>Momentálně nejsou vypsány žádné termíny.</p>}
            {clientDates.map(d => {
              const key = Utils.formatDateKey(d);
              const isActive = activeDateStr === key;
              const slotCount = slotsPerDate.get(key) ?? -1;
              const hasNoSlots = selectedService && slotCount === 0;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { if (!hasNoSlots) { setSelectedDateStr(key); setSelectedTime(null); } }}
                  disabled={hasNoSlots}
                  className={`mobile-carousel-strip-item flex flex-col items-center justify-center w-16 h-24 rounded-xl border transition-all shadow-sm ${
                    hasNoSlots ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''
                  } ${
                    isDark
                      ? isActive ? 'bg-[#daa59c]/90 text-white border-[#daa59c]/60' : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700'
                      : isActive ? 'text-white border-[var(--skin-gold-dark)]' : 'bg-white text-stone-500 border-gray-100'
                  }`}
                  style={!isDark && isActive ? { backgroundColor: 'var(--skin-gold-dark)' } : undefined}
                >
                  <span className="text-[10px] font-bold uppercase tracking-tighter">
                    {d.toLocaleDateString('cs-CZ', { weekday: 'short' })}
                  </span>
                  <span className="text-xl font-serif leading-none my-1">
                    {d.getDate()}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest opacity-80">
                    {d.toLocaleDateString('cs-CZ', { month: 'short' })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Krok 3: Čas */}
        <div className={!activeDateStr ? 'opacity-20 pointer-events-none' : ''}>
          <h2 className={`text-[10px] font-bold uppercase tracking-widest mb-6 border-b pb-2 ${isDark ? 'text-stone-300 border-stone-800' : 'text-stone-500 border-stone-100'}`}>3. Čas</h2>
          {availableSlots.length > 0 && <p className="text-[10px] text-stone-400 mb-3 italic" />}

          <div className="grid grid-cols-3 gap-3">
            {availableSlots.map(t => {
              const isTimeSelected = selectedTime === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTime(t)}
                  className={`py-3 rounded-lg text-sm border transition-all ${
                    isDark
                      ? isTimeSelected ? 'text-white border-[#daa59c]/60 bg-[#daa59c]/90' : 'bg-stone-900 border-stone-800 text-stone-200 hover:border-stone-700'
                      : isTimeSelected ? 'text-white border-[var(--skin-gold-dark)]' : 'bg-white border-stone-200 text-stone-700 hover:bg-[#F9F7F2] hover:border-stone-300'
                  }`}
                  style={!isDark && isTimeSelected ? { backgroundColor: 'var(--skin-gold-dark)' } : undefined}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Permanentní kontaktní CTA (PMU i Kosmetika – vždy viditelný, bez rámečku) */}
          <div style={{ marginTop: '30px' }}>
            <p className="mb-1.5 text-[14px]" style={{ color: '#cccccc' }}>
              Nenašli jste vhodný termín? Zavolejte a najdeme řešení společně.
            </p>
            <a
              href="tel:+420724875558"
              className="text-[#a88a7d] hover:underline hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-[#a88a7d]/50 rounded"
              style={{ fontSize: '16px', fontWeight: 600 }}
            >
              +420 724 875 558
            </a>
          </div>
        </div>
      </div>

      <div className={`p-8 rounded-2xl border shadow-lg h-fit md:sticky md:top-4 ${isDark ? 'bg-stone-950 border-stone-800' : 'border-stone-100 bg-white'}`}>
        <h2 className={`text-lg font-display font-semibold mb-6 border-b pb-4 ${isDark ? 'text-[#daa59c] border-stone-800' : 'text-stone-800 border-stone-100'}`}>
          <Sparkles className={`inline-block mr-2 ${isDark ? 'text-[#daa59c]' : 'text-stone-400'}`} size={16} /> Rezervace
        </h2>

        {isSuccess ? (
          <div className="text-center py-10 animate-in zoom-in">
            <CheckCircle size={32} className={`mx-auto mb-3 ${isDark ? 'text-[#daa59c]' : 'text-green-600'}`} />
            <p className={`font-bold text-xl font-display ${isDark ? 'text-white' : 'text-stone-900'}`}>Potvrzeno</p>
            <p className={`text-xs mt-2 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Detaily byly odeslány na váš e-mail.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={`space-y-4 ${!selectedTime ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className={`text-xs space-y-1 mb-4 border-b pb-4 font-medium ${isDark ? 'border-stone-800 text-stone-400' : 'border-stone-100 text-stone-600'}`}>
              <div className="flex justify-between"><span>Služba:</span><span className={isDark ? 'font-bold text-stone-100' : 'font-bold text-stone-900'}>{selectedService?.name || '-'}</span></div>
              <div className="flex justify-between"><span>Cena:</span><span className={isDark ? 'font-bold text-stone-100' : 'font-bold text-stone-900'}>{selectedService?.price ? `${selectedService.price} Kč` : '-'}</span></div>
              {selectedUpsells.length > 0 && (
                <>
                  {selectedUpsells.map((u) => (
                    <div key={u.id} className="flex justify-between">
                      <span>+ {u.name}:</span>
                      <span className={isDark ? 'font-bold text-stone-100' : 'font-bold text-stone-900'}>{u.price} Kč</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium">
                    <span>Celkem (+ doplňky):</span>
                    <span className={isDark ? 'font-bold text-stone-100' : 'font-bold text-stone-900'}>
                      {(selectedService?.price || 0) + selectedUpsells.reduce((sum, u) => sum + (u.price || 0), 0)} Kč
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between"><span>Termín:</span><span className={isDark ? 'font-bold text-stone-100' : 'font-bold text-stone-900'}>{Utils.formatDateDisplay(activeDateStr)} v {selectedTime || '-'}</span></div>
            </div>

            <input
              required
              type="text"
              placeholder="Vaše jméno"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={`w-full p-3 rounded-lg border text-sm font-medium ${isDark ? 'bg-stone-900 border-stone-800 text-stone-200 placeholder-stone-500 focus:ring-[#daa59c]/50 focus:border-[#daa59c]' : 'input-focus border-stone-200 bg-white'}`}
            />
            <input
              required
              type="tel"
              placeholder="Telefon"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full p-3 rounded-lg border text-sm font-medium ${isDark ? 'bg-stone-900 border-stone-800 text-stone-200 placeholder-stone-500 focus:ring-[#daa59c]/50 focus:border-[#daa59c]' : 'input-focus border-stone-200 bg-white'}`}
            />
            <input
              required
              type="email"
              placeholder="E-mail pro potvrzení"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className={`w-full p-3 rounded-lg border text-sm font-medium ${isDark ? 'bg-stone-900 border-stone-800 text-stone-200 placeholder-stone-500 focus:ring-[#daa59c]/50 focus:border-[#daa59c]' : 'input-focus border-stone-200 bg-white'}`}
            />

            <button
              type="submit"
              disabled={isSending}
              className={`w-full py-4 rounded-full font-sans font-semibold text-xs uppercase tracking-widest text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${isDark ? 'bg-gradient-to-b from-[#B37E76] via-[#D49A91] to-[#B37E76] hover:brightness-95 border border-[#D49A91]/20 shadow-[0_4px_20px_rgba(179,126,118,0.3)] hover:shadow-[0_6px_25px_rgba(179,126,118,0.45)]' : 'bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)]'}`}
            >
              {isSending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={14} /> Odesílám...
                </span>
              ) : (
                'Potvrdit termín'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomerView;
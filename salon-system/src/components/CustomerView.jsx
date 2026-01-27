import React, { useState, useMemo } from 'react';
import { CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { addDoc } from "firebase/firestore";
import { Utils } from '../utils/helpers';
import { getCollectionPath, EMAILJS_CONFIG } from '../firebaseConfig';

const CustomerView = ({ services, schedule, reservations, onBookingSuccess }) => {
  const ADMIN_EMAIL = "info@skinstudio.cz"; 

  const [selectedService, setSelectedService] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
      }, 5000);

    } catch (err) {
      console.error(err);
      alert("Chyba při rezervaci.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 md:grid md:grid-cols-2 md:gap-16">
      <div className="flex flex-col gap-10">
        <div>
          <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-stone-100 pb-2">
            <span className="w-5 h-5 rounded-full bg-stone-800 text-white flex items-center justify-center text-[8px]">1</span>
            Výběr procedury
          </h2>
          <div className="grid gap-3">
            {services.map(s => (
              <button 
                key={s.id} 
                onClick={() => { setSelectedService(s); setSelectedTime(null); }}
                className={`p-4 rounded-xl border transition-all text-left relative ${selectedService?.id === s.id ? 'border-stone-800 bg-stone-50 shadow-sm' : 'border-stone-100 hover:border-stone-300'}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <span className="font-medium text-sm text-stone-900 leading-tight">{s.name}</span>
                  <span className="text-[11px] text-stone-800 font-bold bg-stone-100 px-2 py-1 rounded-lg shrink-0 whitespace-nowrap">
                    {s.price} Kč
                  </span>
                </div>
                {selectedService?.id === s.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-stone-800"></div>}
              </button>
            ))}
          </div>
        </div>

        {/* Krok 2: Datum */}
        <div className={!selectedService ? 'opacity-20 pointer-events-none' : ''}>
          <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6 border-b border-stone-100 pb-2">2. Termín</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {clientDates.length === 0 && <p className="text-xs text-stone-400">Momentálně nejsou vypsány žádné termíny.</p>}
            {clientDates.map(d => {
              const key = Utils.formatDateKey(d);
              return (
                <button 
                  key={key} 
                  onClick={() => { setSelectedDateStr(key); setSelectedTime(null); }}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-24 rounded-xl border transition-all ${activeDateStr === key ? 'bg-stone-800 text-white border-stone-800 shadow-md' : 'bg-white text-stone-500 border-stone-100'}`}
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
          <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6 border-b border-stone-100 pb-2">3. Čas</h2>
          
          {/* INFO BOX PRO UŽIVATELE */}
          {availableSlots.length > 0 && (
             <p className="text-[10px] text-stone-400 mb-3 italic">
          
             </p>
          )}

          <div className="grid grid-cols-3 gap-3">
            {availableSlots.length === 0 && <p className="col-span-3 text-xs text-stone-400">Pro tento den už není volno.</p>}
            {availableSlots.map(t => (
              <button 
                key={t} 
                onClick={() => setSelectedTime(t)}
                className={`py-3 rounded-lg text-sm border transition-all ${selectedTime === t ? 'bg-stone-800 text-white shadow-md' : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 h-fit sticky top-4">
        <h2 className="text-lg font-serif mb-6 border-b border-stone-200 pb-4 flex items-center gap-2 text-stone-800">
          <Sparkles className="text-stone-400" size={16} /> Rezervace
        </h2>
        
        {isSuccess ? (
          <div className="text-center py-10 animate-in zoom-in">
            <CheckCircle size={32} className="mx-auto text-green-600 mb-3" />
            <p className="font-bold text-xl font-serif text-stone-900">Potvrzeno</p>
            <p className="text-xs text-stone-500 mt-2">Detaily byly odeslány na váš e-mail.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={`space-y-4 ${!selectedTime ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            <div className="text-xs space-y-1 mb-4 border-b pb-4 border-stone-200 text-stone-600 font-medium">
              <div className="flex justify-between"><span>Služba:</span><span className="font-bold text-stone-900">{selectedService?.name || '-'}</span></div>
              <div className="flex justify-between"><span>Cena:</span><span className="font-bold text-stone-900">{selectedService?.price ? `${selectedService.price} Kč` : '-'}</span></div>
              <div className="flex justify-between"><span>Termín:</span><span className="font-bold text-stone-900">{Utils.formatDateDisplay(activeDateStr)} v {selectedTime || '-'}</span></div>
            </div>
            
            <input required type="text" placeholder="Vaše jméno" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 rounded-lg border border-stone-200 text-sm font-medium outline-none" />
            <input required type="tel" placeholder="Telefon" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 rounded-lg border border-stone-200 text-sm font-medium outline-none" />
            <input required type="email" placeholder="E-mail pro potvrzení" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 rounded-lg border border-stone-200 text-sm font-medium outline-none" />
            
            <button type="submit" disabled={isSending} className="w-full bg-stone-800 text-white py-4 rounded-lg font-bold uppercase text-[10px] tracking-widest shadow-lg hover:bg-black transition-all disabled:opacity-50">
              {isSending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={14} /> Odesílám...
                </span>
              ) : 'Potvrdit termín'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomerView;
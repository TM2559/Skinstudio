import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, Trash2, Shield, CalendarDays, Plus, X, Lock, LogOut, Scissors, Sparkles, Mail, Send, AlertCircle, Loader2, Edit2 } from 'lucide-react';

// --- 1. FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  setDoc,
  updateDoc,
  query
} from "firebase/firestore";

// --- 2. KONFIGURACE (Načítaná bezpečně z .env) ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 📧 ÚDAJE Z EMAILJS (Načítané z .env):
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID; 
const EMAILJS_CONFIRM_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_CONFIRM_TEMPLATE_ID; 
const EMAILJS_REMINDER_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_REMINDER_TEMPLATE_ID; 
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY; 

// Inicializace Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- POMOCNÉ FUNKCE ---
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const generateTimeOptions = () => {
  const options = [];
  for (let i = 6; i <= 22; i++) {
    const hour = i.toString().padStart(2, '0');
    options.push(`${hour}:00`, `${hour}:30`);
  }
  return options;
};
const timeOptions = generateTimeOptions();

const formatDateKey = (dateObj) => {
  const d = dateObj.getDate().toString().padStart(2, '0');
  const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const y = dateObj.getFullYear();
  return `${d}-${m}-${y}`; 
};

const formatDateDisplay = (dateKey) => {
  if (!dateKey) return "";
  return dateKey.replace(/-/g, '/');
};

const getDateKeyFromISO = (isoDate) => {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d.toString().padStart(2, '0')}-${m.toString().padStart(2, '0')}-${y}`;
};

const getLocalISODate = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

const App = () => {
  const [activeTab, setActiveTab] = useState('customer');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Logika pro tajný vstup (7x klik na logo)
  const [logoClicks, setLogoClicks] = useState(0);
  const [clickTimeout, setClickTimeout] = useState(null);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [isBooked, setIsBooked] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Stavy pro připomínky
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [remindersToProcess, setRemindersToProcess] = useState([]);

  // Služby a jejich správa
  const [reservations, setReservations] = useState([]);
  const [schedule, setSchedule] = useState({}); 
  const [services, setServices] = useState([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('60');
  const [editingServiceId, setEditingServiceId] = useState(null);
  
  const [adminDateInput, setAdminDateInput] = useState(getLocalISODate());
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');

  useEffect(() => {
    document.title = "Skin Studio";
  }, []);

  // --- NAČÍTÁNÍ DAT ---
  useEffect(() => {
    const q = query(collection(db, "reservations"));
    return onSnapshot(q, (snapshot) => {
      setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Firestore Error:", error));
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "schedule"), (snapshot) => {
      const scheduleData = {};
      snapshot.docs.forEach(doc => { scheduleData[doc.id] = doc.data(); });
      setSchedule(scheduleData);
    }, (error) => console.error("Firestore Error:", error));
  }, []);

  useEffect(() => {
    const q = query(collection(db, "services"));
    return onSnapshot(q, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Firestore Error:", error));
  }, []);

  // --- LOGIKA KALENDÁŘE ---
  const clientDates = (() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = formatDateKey(d);
      if (schedule[key] && schedule[key].start) dates.push(d);
    }
    return dates;
  })();

  const activeDateStr = selectedDateStr || (clientDates.length > 0 ? formatDateKey(clientDates[0]) : null);

  const calculateAvailableSlots = (dateStr, serviceDuration = 60) => {
    const daySchedule = schedule[dateStr];
    if (!daySchedule) return [];
    const startMin = timeToMinutes(daySchedule.start);
    const endMin = timeToMinutes(daySchedule.end);
    const dayReservations = reservations
      .filter(r => r.date === dateStr)
      .map(r => ({ start: timeToMinutes(r.time), end: timeToMinutes(r.time) + (r.duration || 60) }))
      .sort((a, b) => a.start - b.start);

    let slots = [];
    for (let t = startMin; t <= endMin - serviceDuration; t += 30) {
      const isFree = !dayReservations.some(r => (t < r.end && t + serviceDuration > r.start));
      if (isFree) slots.push(minutesToTime(t));
    }
    return slots;
  };

  // --- TAJNÝ VSTUP DO ADMINA ---
  const handleLogoClick = () => {
    if (clickTimeout) clearTimeout(clickTimeout);
    const newCount = logoClicks + 1;
    if (newCount >= 7) {
      setActiveTab('admin');
      setLogoClicks(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setLogoClicks(newCount);
      setClickTimeout(setTimeout(() => setLogoClicks(0), 2000));
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginPassword === 'salon123') { 
      setIsAdminLoggedIn(true); 
      setLoginError(''); 
    }
    else { 
      setLoginError('Chybné heslo.'); 
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setActiveTab('customer');
    setLogoClicks(0);
    setLoginPassword('');
    setLoginError('');
  };

  // --- REZERVACE A ODESLÁNÍ EMAILU ---
  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedTime || !selectedService || !formData.email) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, "reservations"), {
        date: activeDateStr,
        time: selectedTime,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        serviceName: selectedService.name,
        duration: parseInt(selectedService.duration),
        created: new Date().toISOString(),
        reminderSent: false
      });

      const emailParams = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_CONFIRM_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          name: formData.name,
          phone: formData.phone,
          to_email: formData.email,
          date: formatDateDisplay(activeDateStr),
          time: selectedTime,
          service: selectedService.name,
          from_name: "Skin Studio",
          reply_to: "rezervace@skinstudio.cz"
        }
      };

      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailParams)
      });

      setIsBooked(true);
      setFormData({ name: '', phone: '', email: '' });
      setSelectedTime(null);
      setTimeout(() => setIsBooked(false), 5000);
    } catch (err) { console.error("Error:", err); } finally { setIsSending(false); }
  };

  // --- LOGIKA PŘIPOMÍNEK ---
  const prepareReminders = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = formatDateKey(tomorrow);
    const toNotify = reservations.filter(r => r.date === tomorrowKey && !r.reminderSent && r.email);
    setRemindersToProcess(toNotify);
    setShowReminderModal(true);
  };

  const processReminders = async () => {
    setIsSending(true);
    let count = 0;
    for (const res of remindersToProcess) {
      try {
        const emailParams = {
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_REMINDER_TEMPLATE_ID || EMAILJS_CONFIRM_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            name: res.name,
            to_email: res.email,
            date: formatDateDisplay(res.date),
            time: res.time,
            service: res.serviceName,
            from_name: "Skin Studio",
            reply_to: "rezervace@skinstudio.cz"
          }
        };
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailParams)
        });
        await updateDoc(doc(db, "reservations", res.id), { reminderSent: true });
        count++;
      } catch (err) { console.error("Reminder error:", err); }
    }
    setIsSending(false);
    setShowReminderModal(false);
    if (count > 0) alert(`Odesláno ${count} připomínek.`);
  };

  // --- SPRÁVA SLUŽEB ---
  const handleAddOrUpdateService = async () => {
    if (!newServiceName) return;
    if (editingServiceId) {
      await updateDoc(doc(db, "services", editingServiceId), {
        name: newServiceName,
        duration: parseInt(newServiceDuration)
      });
      setEditingServiceId(null);
    } else {
      await addDoc(collection(db, "services"), {
        name: newServiceName,
        duration: parseInt(newServiceDuration)
      });
    }
    setNewServiceName('');
    setNewServiceDuration('60');
  };

  const startEditService = (service) => {
    setEditingServiceId(service.id);
    setNewServiceName(service.name);
    setNewServiceDuration(service.duration.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentSlots = activeDateStr && selectedService ? calculateAvailableSlots(activeDateStr, selectedService.duration) : [];

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 pb-10 w-full overflow-x-hidden">
      
      {/* MODAL PŘIPOMÍNKY */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95">
            <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2 text-stone-900"><Send size={20} /> Připomínky</h3>
            {remindersToProcess.length > 0 ? (
              <>
                <p className="text-stone-500 text-sm mb-6">Chcete odeslat {remindersToProcess.length} připomínek na zítřek?</p>
                <div className="flex gap-3">
                  <button onClick={processReminders} disabled={isSending} className="flex-1 bg-stone-800 text-white py-3 rounded-xl font-bold text-xs uppercase disabled:opacity-50">{isSending ? <Loader2 className="animate-spin mx-auto" size={14} /> : 'Ano, odeslat'}</button>
                  <button onClick={() => setShowReminderModal(false)} className="px-6 py-3 border border-stone-200 rounded-xl text-xs font-bold uppercase text-stone-400">Zrušit</button>
                </div>
              </>
            ) : (
              <button onClick={() => setShowReminderModal(false)} className="w-full py-3 bg-stone-100 rounded-xl font-bold">Zavřít</button>
            )}
          </div>
        </div>
      )}

      {/* NAVIGACE - JEN ADMIN */}
      {activeTab === 'admin' && (
        <div className="bg-white shadow-sm mb-4 sticky top-0 z-20 border-b border-stone-200 p-4 flex justify-between items-center animate-in slide-in-from-top">
          <span className="font-serif font-bold uppercase tracking-widest text-[10px] text-stone-400">Skin Studio Administrace</span>
          <button onClick={handleLogout} className="text-stone-400 hover:text-stone-800 flex items-center gap-1 text-[10px] font-bold uppercase bg-stone-50 px-3 py-1.5 rounded-full"><LogOut size={14} /> Odhlásit</button>
        </div>
      )}

      <div className={`${activeTab === 'customer' ? 'mt-10' : ''} max-w-4xl mx-auto px-3 sm:px-4`}>
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-stone-100 overflow-hidden">
          
          {/* HEADER LOGO */}
          <div className="bg-white p-10 text-center border-b border-stone-50">
            <div className="mx-auto cursor-default inline-block select-none" onClick={handleLogoClick}>
                <img src="/skinstudio_logo.jpg" alt="Skin Studio" className="h-40 w-auto mx-auto object-contain mix-blend-multiply opacity-95 active:scale-95 transition-transform" />
            </div>
          </div>

          <div className="p-4 sm:p-10 bg-white">
            {activeTab === 'customer' ? (
              <div className="flex flex-col gap-10 md:grid md:grid-cols-2 md:gap-16">
                
                {/* ZÁKAZNICKÁ ČÁST */}
                <div className="flex flex-col gap-10">
                  <div>
                    <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-stone-100 pb-2"><span className="w-5 h-5 rounded-full bg-stone-800 text-white flex items-center justify-center text-[8px]">1</span>Procedura</h2>
                    <div className="grid gap-3">
                      {services.map(s => (
                        <button key={s.id} onClick={() => { setSelectedService(s); setSelectedTime(null); }} className={`p-4 rounded-xl border transition-all text-left relative overflow-hidden ${selectedService?.id === s.id ? 'border-stone-800 bg-stone-50 shadow-sm' : 'border-stone-100 hover:border-stone-300'}`}>
                          <div className="flex justify-between items-center"><span className="font-medium text-sm text-stone-900">{s.name}</span><span className="text-[10px] text-stone-400 font-bold uppercase">{s.duration} min</span></div>
                          {selectedService?.id === s.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-stone-800"></div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={!selectedService ? 'opacity-20 pointer-events-none' : ''}>
                    <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6 border-b border-stone-100 pb-2">2. Termín</h2>
                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                      {clientDates.map(d => (
                        <button key={formatDateKey(d)} onClick={() => { setSelectedDateStr(formatDateKey(d)); setSelectedTime(null); }} className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl border transition-all ${activeDateStr === formatDateKey(d) ? 'bg-stone-800 text-white border-stone-800 shadow-md' : 'bg-white text-stone-500 border-stone-100'}`}>
                          <span className="text-[10px] font-bold uppercase tracking-tighter">{d.toLocaleDateString('cs-CZ', { weekday: 'short' })}</span>
                          <span className="text-xl font-serif">{d.getDate()}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={!activeDateStr ? 'opacity-20 pointer-events-none' : ''}>
                    <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6 border-b border-stone-100 pb-2">3. Čas</h2>
                    <div className="grid grid-cols-3 gap-3">
                      {currentSlots.map(t => <button key={t} onClick={() => setSelectedTime(t)} className={`py-3 rounded-lg text-sm border transition-all ${selectedTime === t ? 'bg-stone-800 text-white shadow-md' : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'}`}>{t}</button>)}
                    </div>
                  </div>
                </div>

                {/* FORMULÁŘ */}
                <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 h-fit sticky top-4">
                  <h2 className="text-lg font-serif mb-6 border-b border-stone-200 pb-4 flex items-center gap-2 text-stone-800"><Sparkles className="text-stone-400" size={16} /> Rezervace</h2>
                  {isBooked ? (
                    <div className="text-center py-10 animate-in zoom-in"><CheckCircle size={40} className="mx-auto text-green-600 mb-3" /><p className="font-bold text-xl font-serif text-stone-900">Potvrzeno</p><p className="text-xs text-stone-500 mt-2">Detaily byly odeslány na váš e-mail.</p></div>
                  ) : (
                    <form onSubmit={handleBooking} className={`space-y-4 ${!selectedTime ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                      <div className="text-xs space-y-1 mb-4 border-b pb-4 border-stone-200 text-stone-600 font-medium">
                        <div className="flex justify-between"><span>Služba:</span><span className="font-bold text-stone-900">{selectedService?.name || '-'}</span></div>
                        <div className="flex justify-between"><span>Termín:</span><span className="font-bold text-stone-900">{formatDateDisplay(activeDateStr)} v {selectedTime || '-'}</span></div>
                      </div>
                      <input type="text" required placeholder="Vaše jméno" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 rounded-lg border border-stone-200 focus:ring-1 focus:ring-stone-400 outline-none text-sm font-medium" />
                      <input type="tel" required placeholder="Telefon" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 rounded-lg border border-stone-200 focus:ring-1 focus:ring-stone-400 outline-none text-sm font-medium" />
                      <input type="email" required placeholder="E-mail pro potvrzení" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 rounded-lg border border-stone-200 focus:ring-1 focus:ring-stone-400 outline-none text-sm font-medium" />
                      <button type="submit" disabled={isSending} className="w-full bg-stone-800 text-white py-4 rounded-lg font-bold uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-black transition-all disabled:opacity-50">{isSending ? 'Odesílám...' : 'Potvrdit termín'}</button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              // --- ADMIN ROZHRANÍ ---
              !isAdminLoggedIn ? (
                <div className="max-w-sm mx-auto py-20 text-center"><Lock className="mx-auto mb-4 text-stone-200" size={48} /><h2 className="font-serif text-2xl mb-6 text-stone-800 font-bold">Přihlášení</h2>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <input type="password" placeholder="Heslo" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-4 rounded-xl border border-stone-200 text-center text-lg outline-none focus:ring-1 focus:ring-stone-400" autoFocus />
                    {loginError && <p className="text-red-500 text-xs font-bold mt-2 animate-pulse">{loginError}</p>}
                    <button type="submit" className="w-full bg-stone-800 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all mt-2">Vstoupit</button>
                  </form>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-12">
                   <div className="space-y-10">
                      <section><h2 className="font-serif text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800"><Clock size={18} className="text-stone-400" /> Pracovní doba</h2>
                        <div className="bg-stone-50 p-6 rounded-xl space-y-4 shadow-inner">
                          <input type="date" value={adminDateInput} onChange={e => setAdminDateInput(e.target.value)} className="w-full p-3 border border-stone-200 rounded-lg outline-none font-medium" />
                          <div className="flex gap-2 items-center"><select value={workStart} onChange={e => setWorkStart(e.target.value)} className="p-3 border border-stone-200 rounded-lg w-full bg-white font-medium">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select><span className="text-stone-300">-</span><select value={workEnd} onChange={e => setWorkEnd(e.target.value)} className="p-3 border border-stone-200 rounded-lg w-full bg-white font-medium">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                          <div className="flex gap-2"><button onClick={async () => { const key = getDateKeyFromISO(adminDateInput); await setDoc(doc(db, "schedule", key), { start: workStart, end: workEnd }); alert("Uloženo!"); }} className="flex-1 bg-stone-800 text-white py-3 rounded-lg font-bold text-[10px] uppercase shadow-md hover:bg-black transition-all">Otevřít den</button><button onClick={async () => { if(window.confirm("Opravdu zavřít?")) { const key = getDateKeyFromISO(adminDateInput); await deleteDoc(doc(db, "schedule", key)); } }} className="px-4 bg-white text-red-500 border border-stone-200 rounded-lg hover:bg-red-50"><Trash2 size={18}/></button></div>
                        </div>
                      </section>
                      <section><h2 className="font-serif text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800"><Scissors size={18} className="text-stone-400" /> Služby</h2>
                        <div className="space-y-4">
                          <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3 shadow-sm">
                            <h3 className="text-[10px] font-bold uppercase text-stone-400 tracking-widest">{editingServiceId ? 'Upravit službu' : 'Nová procedura'}</h3>
                            <div className="flex gap-2"><input type="text" placeholder="Název" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="w-full p-3 border border-stone-200 rounded-lg text-sm outline-none font-medium" /><select value={newServiceDuration} onChange={(e) => setNewServiceDuration(e.target.value)} className="p-3 border border-stone-200 rounded-lg text-sm bg-white font-medium"><option value="30">30 min</option><option value="60">60 min</option><option value="90">90 min</option><option value="120">120 min</option></select></div>
                            <div className="flex gap-2">
                                <button onClick={handleAddOrUpdateService} className="flex-1 bg-stone-800 text-white py-3 rounded-lg font-bold text-[10px] uppercase hover:bg-black transition-all shadow-md">
                                    {editingServiceId ? 'Uložit změny' : '+ Přidat službu'}
                                </button>
                                {editingServiceId && (
                                    <button onClick={() => { setEditingServiceId(null); setNewServiceName(''); }} className="px-4 bg-stone-100 text-stone-500 rounded-lg text-[10px] font-bold uppercase">Zrušit</button>
                                )}
                            </div>
                          </div>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scroll">
                            {services.map(s => (
                              <div key={s.id} className="flex justify-between items-center bg-stone-50 p-3 rounded-lg group border border-stone-100">
                                <span className="text-sm font-medium text-stone-700">{s.name} <span className="text-[9px] text-stone-400 font-bold uppercase">({s.duration} min)</span></span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={() => startEditService(s)} className="p-2 text-stone-400 hover:text-stone-800"><Edit2 size={14} /></button>
                                  <button onClick={async () => { if(window.confirm("Opravdu smazat?")) await deleteDoc(doc(db, "services", s.id)) }} className="p-2 text-stone-300 hover:text-red-500"><Trash2 size={14} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>
                   </div>
                   <section><div className="flex justify-between items-end mb-4 border-b border-stone-100 pb-2"><h2 className="font-serif text-lg flex items-center gap-2 text-stone-800"><Calendar size={18} className="text-stone-400" /> Objednávky</h2><button onClick={prepareReminders} className="bg-stone-100 hover:bg-stone-800 hover:text-white text-stone-600 px-3 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 transition-all"><Send size={12} /> Připomínky na zítra</button></div>
                     <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scroll">
                        {reservations.length === 0 ? <p className="italic text-stone-300 py-10 text-center text-sm font-medium">Zatím žádné rezervace.</p> : 
                          [...new Set(reservations.map(r => r.date))].sort((a,b) => {
                             const [da, ma, ya] = a.split('-').map(Number);
                             const [db, mb, yb] = b.split('-').map(Number);
                             return new Date(ya, ma-1, da) - new Date(yb, mb-1, db);
                          }).map(d => (
                            <div key={d} className="space-y-2"><div className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em]">{formatDateDisplay(d)}</div>
                              {reservations.filter(r => r.date === d).sort((a,b) => a.time.localeCompare(b.time)).map(res => (
                                <div key={res.id} className="flex justify-between items-center p-4 bg-white border border-stone-50 rounded-xl shadow-sm group hover:border-stone-200 transition-all">
                                  <div className="flex-1">
                                    <div className="font-serif text-sm font-bold flex items-center gap-2 text-stone-900">{res.time} - {res.name} {res.reminderSent && <div className="p-1 bg-green-50 rounded-full" title="Připomínka odeslána"><Mail size={10} className="text-green-500" /></div>}</div>
                                    <div className="text-[10px] text-stone-500 uppercase tracking-tight font-medium">{res.serviceName} • {res.phone}</div>
                                    <div className="text-[9px] text-stone-300 italic lowercase">{res.email}</div>
                                  </div>
                                  <button onClick={async () => { if(window.confirm("Opravdu smazat rezervaci?")) await deleteDoc(doc(db, "reservations", res.id)) }} className="text-stone-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"><Trash2 size={16} /></button>
                                </div>
                              ))}
                            </div>
                          ))
                        }
                     </div>
                   </section>
                </div>
              )
            )}
          </div>
        </div>
        <p className="text-center text-stone-300 text-[10px] mt-10 tracking-[0.3em] uppercase">© 2026 Skin Studio</p>
      </div>
    </div>
  );
};

export default App;
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, Trash2, Shield, CalendarDays, Plus, X, Lock, LogOut, Scissors, Sparkles, Mail, Send, AlertCircle, Loader2 } from 'lucide-react';

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

// --- 2. CONFIGURATION (Loaded safely from .env via Vite) ---
// Note: In your local Vite project, these variables must start with VITE_
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 📧 EMAILJS CONFIGURATION (Loaded from .env):
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID; 
const EMAILJS_CONFIRM_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_CONFIRM_TEMPLATE_ID; 
const EMAILJS_REMINDER_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_REMINDER_TEMPLATE_ID; 
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY; 

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- HELPER FUNCTIONS ---
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

  // Secret access logic via logo clicks
  const [logoClicks, setLogoClicks] = useState(0);
  const [clickTimeout, setClickTimeout] = useState(null);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [isBooked, setIsBooked] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // States for bulk reminders
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [remindersToProcess, setRemindersToProcess] = useState([]);

  const [reservations, setReservations] = useState([]);
  const [schedule, setSchedule] = useState({}); 
  const [services, setServices] = useState([]);
  
  const [adminDateInput, setAdminDateInput] = useState(getLocalISODate());
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('60');

  useEffect(() => {
    document.title = "Skin Studio";
  }, []);

  // --- LOADING DATA FROM FIREBASE ---
  useEffect(() => {
    const q = query(collection(db, "reservations"));
    return onSnapshot(q, (snapshot) => {
      setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "schedule"), (snapshot) => {
      const scheduleData = {};
      snapshot.docs.forEach(doc => { scheduleData[doc.id] = doc.data(); });
      setSchedule(scheduleData);
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, "services"));
    return onSnapshot(q, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  // --- CALENDAR LOGIC ---
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

  // --- SECRET ADMIN ENTRY ---
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
    if (loginPassword === 'salon123') { setIsAdminLoggedIn(true); setLoginError(''); }
    else { setLoginError('Chybné heslo.'); }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setActiveTab('customer');
    setLogoClicks(0);
  };

  // --- BOOKING AND EMAIL SENDING ---
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
    } catch (err) {
      console.error("Booking error:", err);
    } finally {
      setIsSending(false);
    }
  };

  // --- REMINDER LOGIC ---
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
      } catch (err) {
        console.error("Reminder error:", err);
      }
    }

    setIsSending(false);
    setShowReminderModal(false);
    if (count > 0) alert(`Odesláno ${count} připomínek.`);
  };

  // --- ADMIN ACTIONS ---
  const saveWorkHours = async () => {
    const key = getDateKeyFromISO(adminDateInput);
    await setDoc(doc(db, "schedule", key), { start: workStart, end: workEnd });
    alert("Pracovní doba uložena!");
  };

  const deleteWorkHours = async () => {
    const key = getDateKeyFromISO(adminDateInput);
    await deleteDoc(doc(db, "schedule", key));
    alert("Zavřeno.");
  };

  const deleteReservation = async (id) => {
    if (window.confirm("Opravdu chcete smazat tuto rezervaci?")) {
      try { await deleteDoc(doc(db, "reservations", id)); } 
      catch (err) { console.error(err); }
    }
  };

  const handleAddService = async () => {
    if (!newServiceName) return;
    await addDoc(collection(db, "services"), { name: newServiceName, duration: parseInt(newServiceDuration) });
    setNewServiceName('');
  };

  const handleDeleteService = async (id) => { 
    if (window.confirm("Opravdu smazat tuto proceduru?")) {
        await deleteDoc(doc(db, "services", id)); 
    }
  };

  const currentSlots = activeDateStr && selectedService ? calculateAvailableSlots(activeDateStr, selectedService.duration) : [];

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 pb-10 w-full overflow-x-hidden">
      
      {/* REMINDER MODAL */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 text-stone-800 mb-4">
                    <div className="p-2 bg-stone-100 rounded-full"><Send size={20} className="text-stone-600" /></div>
                    <h3 className="font-serif text-xl font-bold">Odeslat připomínky</h3>
                </div>
                
                {remindersToProcess.length > 0 ? (
                    <>
                        <p className="text-stone-500 text-sm mb-6">
                            Nalezeno <span className="font-bold text-stone-800">{remindersToProcess.length} termínů</span> na zítra bez připomínky. Chcete je nyní hromadně rozeslat?
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={processReminders}
                                disabled={isSending}
                                className="flex-1 bg-stone-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                            >
                                {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                {isSending ? 'Odesílám...' : 'Ano, odeslat'}
                            </button>
                            <button 
                                onClick={() => setShowReminderModal(false)}
                                className="px-6 py-3 border border-stone-200 rounded-xl text-xs font-bold uppercase tracking-widest text-stone-400 hover:bg-stone-50"
                            >
                                Zrušit
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-stone-500 text-sm mb-6">Na zítřek nejsou žádné nové termíny k připomenutí.</p>
                        <button 
                            onClick={() => setShowReminderModal(false)}
                            className="w-full py-3 bg-stone-100 rounded-xl text-xs font-bold uppercase tracking-widest text-stone-600 hover:bg-stone-200 transition-all"
                        >
                            Rozumím
                        </button>
                    </>
                )}
            </div>
        </div>
      )}

      {/* NAVIGATION - VISIBLE ONLY IN ADMIN MODE */}
      {activeTab === 'admin' && (
        <div className="bg-white shadow-sm mb-4 sticky top-0 z-20 border-b border-stone-200 animate-in slide-in-from-top duration-300">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="font-serif text-xl font-bold text-stone-800 tracking-wider uppercase">Skin Studio Admin</div>
            <button 
              onClick={handleLogout} 
              className="text-stone-400 text-sm flex items-center gap-1 hover:text-stone-800 transition-colors bg-stone-50 px-3 py-1.5 rounded-full"
            >
              <LogOut size={14} /> {isAdminLoggedIn ? 'Odhlásit' : 'Zavřít'}
            </button>
          </div>
        </div>
      )}

      <div className={`${activeTab === 'customer' ? 'mt-6 sm:mt-10' : ''} max-w-4xl mx-auto px-3 sm:px-4`}>
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100">
          
          {/* LOGO WITH SECRET CLICKING */}
          <div className="bg-white p-10 text-center border-b border-stone-50">
            <div className="mx-auto cursor-default select-none inline-block relative" onClick={handleLogoClick}>
                <img 
                  src="/skinstudio_logo.jpg" 
                  alt="Skin Studio Logo" 
                  className="h-40 w-auto mx-auto object-contain mix-blend-multiply opacity-95 active:scale-95 transition-transform" 
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} 
                />
                <div className="hidden w-24 h-24 bg-stone-100 rounded-full mx-auto flex items-center justify-center font-serif text-3xl text-stone-400">S</div>
            </div>
          </div>

          <div className="p-4 sm:p-10 bg-white">
            {activeTab === 'customer' ? (
              <div className="flex flex-col gap-10 md:grid md:grid-cols-2 md:gap-16">
                
                {/* CUSTOMER BOOKING FORM */}
                <div className="flex flex-col gap-10">
                  <div className="w-full">
                    <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-stone-100 pb-2">
                      <span className="w-5 h-5 rounded-full bg-stone-800 text-white flex items-center justify-center text-[8px]">1</span>
                      Výběr procedury
                    </h2>
                    <div className="grid grid-cols-1 gap-3">
                      {services.length > 0 ? services.map(service => (
                        <button
                          key={service.id}
                          onClick={() => { setSelectedService(service); setSelectedTime(null); }}
                          className={`p-4 rounded-xl border transition-all text-left relative overflow-hidden group
                            ${selectedService?.id === service.id ? 'border-stone-800 bg-stone-50 shadow-sm' : 'border-stone-100 bg-white hover:border-stone-300'}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`font-medium ${selectedService?.id === service.id ? 'text-stone-900' : 'text-stone-600'}`}>{service.name}</span>
                            <span className="text-[10px] font-bold text-stone-400">{service.duration} min</span>
                          </div>
                          {selectedService?.id === service.id && <div className="absolute inset-y-0 left-0 w-1 bg-stone-800"></div>}
                        </button>
                      )) : (
                        <div className="p-8 text-center border border-dashed border-stone-200 rounded-xl">
                          <p className="text-stone-400 text-sm italic">Nabídka služeb se připravuje.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`transition-all duration-500 ${!selectedService ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                    <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-stone-100 pb-2"><span className="w-5 h-5 rounded-full bg-stone-800 text-white flex items-center justify-center text-[8px]">2</span>Termín</h2>
                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                      {clientDates.length > 0 ? clientDates.map(dateObj => {
                        const dateStr = formatDateKey(dateObj);
                        const isSelected = activeDateStr === dateStr;
                        return (
                          <button
                            key={dateStr}
                            onClick={() => { setSelectedDateStr(dateStr); setSelectedTime(null); }}
                            className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl border transition-all
                              ${isSelected ? 'bg-stone-800 border-stone-800 text-white shadow-lg scale-105' : 'bg-white border-stone-200 text-stone-500 hover:text-stone-800'}`}
                          >
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{dateObj.toLocaleDateString('cs-CZ', { weekday: 'short' })}</span>
                            <span className="text-xl font-serif mt-1">{dateObj.getDate()}</span>
                            <span className="text-[9px] opacity-60">{dateObj.getMonth() + 1}.</span>
                          </button>
                        );
                      }) : (
                        <p className="text-stone-400 text-xs italic">Aktuálně nejsou volné termíny online.</p>
                      )}
                    </div>
                  </div>

                  <div className={`transition-all duration-500 ${!selectedService || !activeDateStr ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                    <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-stone-100 pb-2"><span className="w-5 h-5 rounded-full bg-stone-800 text-white flex items-center justify-center text-[8px]">3</span>Čas</h2>
                    <div className="grid grid-cols-3 gap-3">
                      {currentSlots.map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-3 rounded-lg text-sm border transition-all
                            ${selectedTime === time ? 'bg-stone-800 border-stone-800 text-white shadow-md' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 h-fit sticky top-4">
                  <h2 className="text-lg font-serif mb-6 flex items-center gap-2 text-stone-800 border-b border-stone-200 pb-4">
                     <Sparkles className="text-stone-400" size={16} /> Rezervace
                  </h2>
                  
                  {isBooked ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-300">
                      <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mb-4"><CheckCircle size={32} /></div>
                      <p className="text-green-900 font-serif font-bold text-xl mb-2">Potvrzeno</p>
                      <p className="text-stone-500 text-xs">Potvrzení vám právě odesíláme na e-mail.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleBooking} className={`space-y-4 ${!selectedTime ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                      <div className="space-y-2 mb-6 text-sm">
                         <div className="flex justify-between border-b border-stone-200 pb-2"><span className="text-stone-400">Procedura:</span><span className="font-bold">{selectedService?.name || '-'}</span></div>
                         <div className="flex justify-between border-b border-stone-200 pb-2"><span className="text-stone-400">Termín:</span><span className="font-bold">{activeDateStr ? formatDateDisplay(activeDateStr) : '-'} v {selectedTime || '-'}</span></div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 text-stone-300" size={16} />
                          <input type="text" required placeholder="Vaše jméno" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full pl-10 p-3 rounded-lg border border-stone-200 focus:ring-1 focus:ring-stone-400 outline-none bg-white font-serif" />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3.5 text-stone-300" size={16} />
                          <input type="tel" required placeholder="Telefon" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 p-3 rounded-lg border border-stone-200 focus:ring-1 focus:ring-stone-400 outline-none bg-white font-serif" />
                        </div>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 text-stone-300" size={16} />
                          <input type="email" required placeholder="E-mail pro potvrzení" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-10 p-3 rounded-lg border border-stone-200 focus:ring-1 focus:ring-stone-400 outline-none bg-white font-serif" />
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSending}
                        className="w-full bg-stone-800 text-white py-4 rounded-lg font-bold hover:bg-black active:scale-95 transition-all tracking-widest text-[10px] uppercase mt-4 disabled:opacity-50"
                      >
                        {isSending ? <Loader2 size={16} className="animate-spin inline mr-2" /> : null}
                        {isSending ? 'Odesílám...' : 'Potvrdit termín'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              // --- ADMIN INTERFACE ---
              !isAdminLoggedIn ? (
                <div className="max-w-sm mx-auto py-20 text-center">
                  <Lock className="mx-auto mb-4 text-stone-300" size={32} /><h2 className="font-serif text-2xl mb-6">Administrace</h2>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <input type="password" placeholder="Heslo" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full p-4 rounded-xl border border-stone-200 text-center focus:ring-1 focus:ring-stone-500 outline-none" autoFocus />
                    {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
                    <button type="submit" className="w-full bg-stone-800 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px]">Vstoupit</button>
                  </form>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-12 w-full">
                  <div className="space-y-10">
                    <section>
                      <h2 className="font-serif text-lg mb-4 flex items-center gap-2 border-b border-stone-100 pb-2"><Clock size={18} className="text-stone-400" /> Pracovní doba</h2>
                      <div className="bg-stone-50 p-6 rounded-xl space-y-4">
                        <input type="date" value={adminDateInput} onChange={(e) => setAdminDateInput(e.target.value)} className="w-full p-3 border border-stone-200 rounded-lg" />
                        <div className="flex gap-2 items-center">
                          <select value={workStart} onChange={(e) => setWorkStart(e.target.value)} className="p-3 border border-stone-200 rounded-lg w-full bg-white">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                          <span>-</span>
                          <select value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className="p-3 border border-stone-200 rounded-lg w-full bg-white">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveWorkHours} className="flex-1 bg-stone-800 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-black transition-all">Uložit</button>
                          <button onClick={deleteWorkHours} className="px-4 bg-white text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-all"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    </section>
                    
                    <section>
                      <h2 className="font-serif text-lg mb-4 flex items-center gap-2 border-b border-stone-100 pb-2"><Scissors size={18} className="text-stone-400" /> Služby</h2>
                      <div className="space-y-4">
                        <div className="flex gap-2"><input type="text" placeholder="Název" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} className="w-full p-3 border border-stone-200 rounded-lg text-sm" /><select value={newServiceDuration} onChange={(e) => setNewServiceDuration(e.target.value)} className="p-3 border border-stone-200 rounded-lg text-sm bg-white"><option value="30">30 min</option><option value="60">60 min</option><option value="90">90 min</option><option value="120">120 min</option></select></div>
                        <button onClick={handleAddService} className="w-full bg-white border border-stone-200 py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:border-stone-800 transition-all">+ Přidat službu</button>
                        <div className="space-y-2">{services.map(s => <div key={s.id} className="flex justify-between items-center bg-stone-50 p-3 rounded-lg"><span className="text-sm">{s.name}</span><button onClick={() => handleDeleteService(s.id)} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button></div>)}</div>
                      </div>
                    </section>
                  </div>

                  <section>
                    <div className="flex justify-between items-end mb-4 border-b border-stone-100 pb-2">
                        <h2 className="font-serif text-lg flex items-center gap-2"><Calendar size={18} className="text-stone-400" /> Objednávky</h2>
                        <button 
                          onClick={prepareReminders}
                          className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-800 hover:text-white text-stone-600 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all"
                        >
                           <Send size={12} /> Připomínky na zítra
                        </button>
                    </div>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scroll">
                      {reservations.length === 0 ? <p className="text-stone-400 italic text-center py-10">Žádné rezervace.</p> : 
                        [...new Set(reservations.map(r => r.date))].sort().map(date => {
                          const dayRes = reservations.filter(r => r.date === date).sort((a,b) => a.time.localeCompare(b.time));
                          return (
                            <div key={date} className="space-y-2">
                              <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center justify-between">
                                {formatDateDisplay(date)}
                                {date === formatDateKey(new Date(new Date().setDate(new Date().getDate() + 1))) && (
                                  <span className="bg-stone-800 text-white px-2 py-0.5 rounded text-[8px]">Zítra</span>
                                )}
                              </div>
                              {dayRes.map(res => (
                                <div key={res.id} className="flex justify-between items-center p-4 bg-white border border-stone-100 rounded-xl shadow-sm mb-2 group">
                                  <div className="flex-1 pr-4">
                                    <div className="font-serif text-stone-900 font-bold flex items-center gap-2">
                                      {res.time} - {res.name}
                                      {res.reminderSent && <div className="p-1 bg-green-50 rounded-full" title="Připomínka odeslána"><Mail size={10} className="text-green-500" /></div>}
                                    </div>
                                    <div className="text-[10px] text-stone-500 uppercase tracking-tight">{res.serviceName} • {res.phone}</div>
                                    {res.email && <div className="text-[9px] text-stone-400 lowercase italic">{res.email}</div>}
                                  </div>
                                  <button onClick={() => deleteReservation(res.id)} className="text-stone-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                                </div>
                              ))}
                            </div>
                          )
                        })
                      }
                    </div>
                  </section>
                </div>
              )
            )}
          </div>
        </div>
        <p className="text-center text-stone-300 text-[10px] mt-10 tracking-[0.2em] uppercase">© 2026 Skin Studio</p>
      </div>
    </div>
  );
};

export default App;
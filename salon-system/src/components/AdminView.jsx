import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, Phone, Trash2, Plus, X, LogOut, Scissors, Mail, Send, 
  Loader2, Edit2, CalendarDays, PlusCircle, GripVertical, CalendarPlus 
} from 'lucide-react';
import { addDoc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { Utils } from '../utils/helpers';
import { getCollectionPath, getDocPath, EMAILJS_CONFIG } from '../firebaseConfig';

const AdminView = ({ services, schedule, reservations, onLogout }) => {
  // Stavy pro dashboard
  const [adminDateInput, setAdminDateInput] = useState(Utils.getLocalISODate());
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceForm, setServiceForm] = useState({ name: '', price: '', duration: '60' });
  
  // Stavy pro připomínky a detail rezervace
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [remindersList, setRemindersList] = useState([]);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Stavy pro manuální rezervaci
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [manualForm, setManualForm] = useState({ 
    serviceId: '', 
    date: Utils.getLocalISODate(), 
    time: '', 
    name: '', 
    phone: '', 
    email: '' 
  });
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);

  // Drag & Drop stav
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  // Získání dat pro aktuální den
  const currentDayKey = Utils.getDateKeyFromISO(adminDateInput);
  const dayData = schedule[currentDayKey];
  const periods = dayData?.periods || (dayData?.start ? [{ start: dayData.start, end: dayData.end }] : []);

  // --- HANDLERS: SMĚNY ---
  const handleShift = async (action, index) => {
    if (action === 'add') {
      const newP = [...periods, { start: workStart, end: workEnd }].sort((a,b) => Utils.timeToMinutes(a.start) - Utils.timeToMinutes(b.start));
      await setDoc(getDocPath("schedule", currentDayKey), { periods: newP });
    } else if (action === 'remove') {
      const newP = periods.filter((_, i) => i !== index);
      const ref = getDocPath("schedule", currentDayKey);
      newP.length === 0 ? await deleteDoc(ref) : await setDoc(ref, { periods: newP });
    }
  };

  // --- HANDLERS: SLUŽBY ---
  const handleService = async () => {
    if (!serviceForm.name) return;
    const data = {
      name: serviceForm.name,
      price: parseInt(serviceForm.price) || 0,
      duration: parseInt(serviceForm.duration),
      order: editingServiceId ? undefined : services.length 
    };
    
    const updateData = { ...data };
    if (updateData.order === undefined) delete updateData.order;

    if (editingServiceId) {
      await updateDoc(getDocPath("services", editingServiceId), updateData);
      setEditingServiceId(null);
    } else {
      await addDoc(getCollectionPath("services"), data);
    }
    setServiceForm({ name: '', price: '', duration: '60' });
  };

  const handleDeleteService = async (id) => {
    if (confirm("Smazat tuto proceduru?")) await deleteDoc(getDocPath("services", id));
  };

  const startEdit = (s) => {
    setEditingServiceId(s.id);
    setServiceForm({ name: s.name, price: s.price, duration: s.duration });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItemIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;

    const newServices = [...services];
    const [movedItem] = newServices.splice(draggedItemIndex, 1);
    newServices.splice(dropIndex, 0, movedItem);

    const updatePromises = newServices.map((service, index) => {
      if (service.order !== index) {
        return updateDoc(getDocPath("services", service.id), { order: index });
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);
  };

  // --- HANDLERS: REZERVACE A PŘIPOMÍNKY ---
  const handleDeleteRes = async (id) => {
    if (confirm("Smazat rezervaci?")) {
      await deleteDoc(getDocPath("reservations", id));
      setSelectedOrder(null);
    }
  };

  // Export do kalendáře z detailu
  const handleExportCalendar = (order) => {
    Utils.downloadICSFile(
      order.date,
      order.time,
      order.duration || 60,
      `Skin Studio: ${order.serviceName} (${order.name})`,
      `Klient: ${order.name}\nTel: ${order.phone}\nEmail: ${order.email}`
    );
  };

  const handleReminders = async () => {
    setIsSendingReminders(true);
    let count = 0;
    for (const res of remindersList) {
      try {
        if (EMAILJS_CONFIG.PUBLIC_KEY) {
           await fetch('https://api.emailjs.com/api/v1.0/email/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                service_id: EMAILJS_CONFIG.SERVICE_ID,
                template_id: EMAILJS_CONFIG.REMINDER_TEMPLATE,
                user_id: EMAILJS_CONFIG.PUBLIC_KEY,
                template_params: {
                  name: res.name,
                  to_email: res.email,
                  date: Utils.formatDateDisplay(res.date),
                  time: res.time,
                  service: res.serviceName,
                  reply_to: "rezervace@skinstudio.cz"
                }
              })
           });
        }
        await updateDoc(getDocPath("reservations", res.id), { reminderSent: true });
        count++;
      } catch (e) { console.error(e); }
    }
    setIsSendingReminders(false);
    setShowReminderModal(false);
    alert(`Odesláno ${count} připomínek.`);
  };

  const openReminders = () => {
    const tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
    const key = Utils.formatDateKey(tmr);
    setRemindersList(reservations.filter(r => r.date === key && !r.reminderSent && r.email));
    setShowReminderModal(true);
  };

  // --- LOGIKA MANUÁLNÍ REZERVACE ---
  const manualDateKey = Utils.getDateKeyFromISO(manualForm.date);
  const manualDaySchedule = schedule[manualDateKey];
  const hasShifts = manualDaySchedule && (manualDaySchedule.periods?.length > 0 || manualDaySchedule.start);

  const manualAvailableSlots = useMemo(() => {
    if (!hasShifts || !manualForm.serviceId) return [];
    
    const srv = services.find(s => s.id === manualForm.serviceId);
    if (!srv) return [];

    const periods = manualDaySchedule.periods || (manualDaySchedule.start ? [{ start: manualDaySchedule.start, end: manualDaySchedule.end }] : []);
    const dayRes = reservations
      .filter(r => r.date === manualDateKey)
      .map(r => ({ start: Utils.timeToMinutes(r.time), end: Utils.timeToMinutes(r.time) + (r.duration || 60) }));

    let slots = [];
    const dur = parseInt(srv.duration);

    periods.forEach(p => {
      const startMin = Utils.timeToMinutes(p.start);
      const endMin = Utils.timeToMinutes(p.end);
      for (let t = startMin; t <= endMin - dur; t += 30) {
        if (!dayRes.some(r => (t < r.end && t + dur > r.start))) {
          const timeStr = Utils.minutesToTime(t);
          if (!slots.includes(timeStr)) slots.push(timeStr);
        }
      }
    });
    return slots.sort();
  }, [manualDateKey, manualForm.serviceId, manualDaySchedule, reservations, services, hasShifts]);

  const arbitraryTimeSlots = useMemo(() => {
    const opts = [];
    for (let i = 6; i <= 22; i++) {
      const h = i.toString().padStart(2, '0');
      opts.push(`${h}:00`, `${h}:15`, `${h}:30`, `${h}:45`);
    }
    return opts;
  }, []);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.serviceId || !manualForm.time || !manualForm.email) return;
    
    setIsManualSubmitting(true);
    const selectedSrv = services.find(s => s.id === manualForm.serviceId);

    try {
      await addDoc(getCollectionPath("reservations"), {
        date: manualDateKey,
        time: manualForm.time,
        name: manualForm.name,
        phone: manualForm.phone,
        email: manualForm.email,
        serviceName: selectedSrv?.name || 'Manual Booking',
        duration: parseInt(selectedSrv?.duration || 60),
        price: selectedSrv?.price || 0,
        created: new Date().toISOString(),
        reminderSent: false,
        source: 'admin'
      });

      if (EMAILJS_CONFIG.PUBLIC_KEY) {
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: EMAILJS_CONFIG.SERVICE_ID,
            template_id: EMAILJS_CONFIG.CONFIRM_TEMPLATE,
            user_id: EMAILJS_CONFIG.PUBLIC_KEY,
            template_params: {
              name: manualForm.name,
              to_email: manualForm.email,
              date: Utils.formatDateDisplay(manualDateKey),
              time: manualForm.time,
              service: selectedSrv?.name,
              reply_to: "rezervace@skinstudio.cz"
            }
          })
        });
      }

      if (confirm("Rezervace uložena. Chcete ji přidat do svého kalendáře?")) {
        Utils.downloadICSFile(
          manualDateKey,
          manualForm.time,
          parseInt(selectedSrv?.duration || 60),
          `Skin Studio: ${selectedSrv?.name} (${manualForm.name})`,
          `Klient: ${manualForm.name}\nTel: ${manualForm.phone}`
        );
      }

      setShowManualBooking(false);
      setManualForm({ serviceId: '', date: Utils.getLocalISODate(), time: '', name: '', phone: '', email: '' });

    } catch (err) {
      console.error(err);
      alert("Chyba při ukládání.");
    } finally {
      setIsManualSubmitting(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-12 relative">
      
      {/* HEADER */}
      <div className="md:col-span-2 bg-white sticky top-0 z-20 border-b border-stone-200 p-4 flex justify-between items-center -mx-4 px-8 md:mx-0 md:px-0">
        <span className="font-serif font-bold uppercase tracking-widest text-xs">Admin Panel</span>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowManualBooking(true)} 
            className="bg-stone-800 hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all"
          >
            <PlusCircle size={14} /> Nová rezervace
          </button>
          <button onClick={onLogout} className="text-stone-400 hover:text-stone-800 flex items-center gap-1 text-xs">
            <LogOut size={14} /> Odhlásit
          </button>
        </div>
      </div>

      {/* MODAL: MANUÁLNÍ REZERVACE */}
      {showManualBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-xl font-bold text-stone-900">Manuální rezervace</h3>
              <button onClick={() => setShowManualBooking(false)} className="text-stone-400 hover:text-stone-800"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {/* Služba */}
              <div>
                <label className="text-[10px] font-bold uppercase text-stone-400">Služba</label>
                <select 
                  required 
                  className="w-full p-3 border rounded-lg text-sm bg-white"
                  value={manualForm.serviceId}
                  onChange={e => setManualForm({...manualForm, serviceId: e.target.value, time: ''})}
                >
                  <option value="">Vyberte proceduru...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>)}
                </select>
              </div>

              {/* Datum */}
              <div>
                <label className="text-[10px] font-bold uppercase text-stone-400">Datum</label>
                <input 
                  type="date" 
                  required
                  className="w-full p-3 border rounded-lg text-sm"
                  value={manualForm.date}
                  onChange={e => setManualForm({...manualForm, date: e.target.value, time: ''})}
                />
              </div>

              {/* Čas */}
              <div>
                <label className="text-[10px] font-bold uppercase text-stone-400 flex justify-between">
                  Čas {hasShifts ? <span className="text-green-600">Dle směn</span> : <span className="text-orange-500">Bez omezení</span>}
                </label>
                {hasShifts ? (
                  <select 
                    required 
                    className="w-full p-3 border rounded-lg text-sm bg-white"
                    value={manualForm.time}
                    onChange={e => setManualForm({...manualForm, time: e.target.value})}
                    disabled={!manualForm.serviceId}
                  >
                    <option value="">Vyberte čas...</option>
                    {manualAvailableSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <select 
                    required 
                    className="w-full p-3 border rounded-lg text-sm bg-white"
                    value={manualForm.time}
                    onChange={e => setManualForm({...manualForm, time: e.target.value})}
                  >
                    <option value="">Vyberte čas...</option>
                    {arbitraryTimeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
              </div>

              {/* Osobní údaje */}
              <div className="border-t border-stone-100 my-4 pt-4 space-y-4">
                <input required type="text" placeholder="Jméno klienta" className="w-full p-3 border rounded-lg text-sm" value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} />
                <input required type="tel" placeholder="Telefon" className="w-full p-3 border rounded-lg text-sm" value={manualForm.phone} onChange={e => setManualForm({...manualForm, phone: e.target.value})} />
                <input required type="email" placeholder="Email (pro potvrzení)" className="w-full p-3 border rounded-lg text-sm" value={manualForm.email} onChange={e => setManualForm({...manualForm, email: e.target.value})} />
              </div>

              <button type="submit" disabled={isManualSubmitting} className="w-full bg-stone-800 text-white py-3 rounded-lg font-bold text-xs uppercase hover:bg-black transition-all disabled:opacity-50">
                {isManualSubmitting ? 'Ukládám...' : 'Vytvořit rezervaci'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: PŘIPOMÍNKY --- */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95">
            <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2 text-stone-900"><Send size={20} /> Připomínky</h3>
            {remindersList.length > 0 ? (
              <>
                <p className="text-stone-500 text-sm mb-6">Odeslat {remindersList.length} připomínek?</p>
                <div className="flex gap-3">
                  <button onClick={handleReminders} disabled={isSendingReminders} className="flex-1 bg-stone-800 text-white py-3 rounded-xl font-bold text-xs uppercase disabled:opacity-50">{isSendingReminders ? <Loader2 className="animate-spin mx-auto" size={14} /> : 'Odeslat'}</button>
                  <button onClick={() => setShowReminderModal(false)} className="px-6 py-3 border border-stone-200 rounded-xl text-xs font-bold uppercase text-stone-400">Zrušit</button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-stone-500 text-sm mb-4">Žádné připomínky k odeslání.</p>
                <button onClick={() => setShowReminderModal(false)} className="w-full py-3 bg-stone-100 rounded-xl font-bold">Zavřít</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL: DETAIL REZERVACE (S novými tlačítky) --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
             
             {/* Header */}
             <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-serif text-xl font-bold text-stone-900">{selectedOrder.name}</h3>
                    <p className="text-xs font-bold text-stone-400 mt-1">{selectedOrder.serviceName}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 bg-stone-50 rounded-full text-stone-400 hover:text-stone-900"><X size={20}/></button>
             </div>

             {/* Info List */}
             <div className="space-y-4 text-sm text-stone-600 mb-6">
                <div className="flex gap-3 items-center"><CalendarDays size={16}/> <span>{Utils.formatDateDisplay(selectedOrder.date)}, {selectedOrder.time}</span></div>
                <div className="flex gap-3 items-center"><Phone size={16}/> <a href={`tel:${selectedOrder.phone}`} className="hover:underline">{selectedOrder.phone}</a></div>
                <div className="flex gap-3 items-center"><Mail size={16}/> <a href={`mailto:${selectedOrder.email}`} className="hover:underline truncate w-48 block">{selectedOrder.email}</a></div>
             </div>
             
             {/* Akce: Zavolat / E-mail */}
             <div className="flex gap-3 mb-3">
                <a href={`tel:${selectedOrder.phone}`} className="flex-1 bg-stone-800 text-white py-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors">
                  <Phone size={14} /> Zavolat
                </a>
                <a href={`mailto:${selectedOrder.email}`} className="flex-1 bg-white border border-stone-200 text-stone-800 py-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors">
                  <Mail size={14} /> E-mail
                </a>
             </div>

             {/* Akce: Kalendář */}
             <button 
               onClick={() => handleExportCalendar(selectedOrder)}
               className="w-full mb-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-widest py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
             >
               <CalendarPlus size={14} /> Uložit do kalendáře
             </button>

             {/* Akce: Smazat */}
             <button onClick={() => handleDeleteRes(selectedOrder.id)} className="w-full text-red-400 hover:text-red-600 text-xs font-bold uppercase tracking-widest flex justify-center gap-2 py-3">
               <Trash2 size={14} /> Smazat objednávku
             </button>
          </div>
        </div>
      )}

      {/* --- LEVÝ SLOUPEC --- */}
      <div className="space-y-10">
        {/* Správa směn */}
        <section>
          <h2 className="font-serif text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800"><Clock size={18} className="text-stone-400" /> Pracovní doba</h2>
          <div className="bg-stone-50 p-6 rounded-xl space-y-6 shadow-inner">
            <input type="date" value={adminDateInput} onChange={e => setAdminDateInput(e.target.value)} className="w-full p-3 border border-stone-200 rounded-lg outline-none bg-white font-medium" />
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Směny:</p>
              {periods.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-stone-100 shadow-sm">
                  <span className="text-sm font-bold">{p.start} — {p.end}</span>
                  <button onClick={() => handleShift('remove', idx)} className="text-red-300 hover:text-red-500"><X size={16} /></button>
                </div>
              ))}
              {periods.length === 0 && <p className="text-xs text-stone-400 italic">Tento den je zavřeno.</p>}
            </div>
            <div className="pt-4 border-t border-stone-200">
              <div className="flex gap-2 items-center mb-4">
                <select value={workStart} onChange={e => setWorkStart(e.target.value)} className="p-3 border rounded-lg w-full bg-white text-sm">{Utils.generateTimeOptions().map(t => <option key={t} value={t}>{t}</option>)}</select>
                <span>-</span>
                <select value={workEnd} onChange={e => setWorkEnd(e.target.value)} className="p-3 border rounded-lg w-full bg-white text-sm">{Utils.generateTimeOptions().map(t => <option key={t} value={t}>{t}</option>)}</select>
              </div>
              <button onClick={() => handleShift('add')} className="w-full bg-stone-800 text-white py-3 rounded-lg font-bold text-[10px] uppercase shadow-md flex items-center justify-center gap-2 hover:bg-black transition-all"><Plus size={14} /> Přidat blok času</button>
            </div>
          </div>
        </section>

        {/* Správa služeb (Drag & Drop) */}
        <section>
          <h2 className="font-serif text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800"><Scissors size={18} className="text-stone-400" /> Správa produktů</h2>
          <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3 shadow-sm mb-4">
             <h3 className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">{editingServiceId ? 'Upravit produkt' : 'Nový produkt / Služba'}</h3>
             <input type="text" placeholder="Název" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} className="w-full p-3 border rounded-lg text-sm" />
             <div className="flex gap-2">
               <input type="number" placeholder="Cena" value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: e.target.value})} className="flex-1 p-3 border rounded-lg text-sm" />
               <select value={serviceForm.duration} onChange={e => setServiceForm({...serviceForm, duration: e.target.value})} className="flex-1 p-3 border rounded-lg text-sm bg-white">
                 <option value="30">30 min</option><option value="60">60 min</option><option value="90">90 min</option><option value="120">120 min</option>
               </select>
             </div>
             <div className="flex gap-2">
               <button onClick={handleService} className="flex-1 bg-stone-800 text-white py-3 rounded-lg font-bold text-[10px] uppercase shadow-md">{editingServiceId ? 'Uložit změny' : '+ Přidat'}</button>
               {editingServiceId && <button onClick={() => { setEditingServiceId(null); setServiceForm({name:'', price:'', duration:'60'}) }} className="px-4 bg-stone-100 text-stone-500 rounded-lg font-bold text-[10px] uppercase">Zrušit</button>}
             </div>
          </div>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scroll">
            {services.map((s, index) => (
              <div 
                key={s.id} 
                className={`flex justify-between items-center bg-stone-50 p-3 rounded-lg group border border-stone-100 transition-all ${draggedItemIndex === index ? 'opacity-50' : 'opacity-100'}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                style={{ cursor: 'move' }}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="text-stone-300 cursor-move" size={16} />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-stone-800">{s.name}</span>
                    <div className="flex gap-2 mt-1">
                       <span className="text-[10px] font-bold text-stone-500">{s.price} Kč</span>
                       <span className="text-[10px] text-stone-300">{s.duration} min</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(s)} className="p-2 text-stone-400 hover:text-stone-800"><Edit2 size={14}/></button>
                  <button onClick={() => handleDeleteService(s.id)} className="p-2 text-stone-300 hover:text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* --- PRAVÝ SLOUPEC --- */}
      <section>
        <div className="flex justify-between items-end mb-4 border-b border-stone-100 pb-2">
          <h2 className="font-serif text-lg flex items-center gap-2 text-stone-800"><Calendar size={18} className="text-stone-400" /> Objednávky</h2>
          <button onClick={openReminders} className="bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1.5 rounded-lg text-[9px] uppercase font-bold flex items-center gap-2 transition-all"><Send size={12} /> Připomínky</button>
        </div>
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scroll">
          {reservations.length === 0 && <p className="text-center text-stone-300 italic py-10">Žádné rezervace.</p>}
          {[...new Set(reservations.map(r => r.date))].sort((a,b) => { 
             const [da,ma,ya]=a.split('-').map(Number); const [db,mb,yb]=b.split('-').map(Number); 
             return new Date(ya,ma-1,da)-new Date(yb,mb-1,db); 
          }).map(d => (
             <div key={d} className="space-y-2">
               <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{Utils.formatDateDisplay(d)}</div>
               {reservations.filter(r => r.date === d).sort((a,b) => a.time.localeCompare(b.time)).map(res => (
                 <div key={res.id} onClick={() => setSelectedOrder(res)} className="flex justify-between items-center p-4 bg-white border border-stone-50 rounded-xl shadow-sm hover:border-stone-400 cursor-pointer transition-all">
                   <div className="flex-1">
                     <div className="font-serif text-sm font-bold flex items-center gap-2 text-stone-900">{res.time} - {res.name} {res.reminderSent && <div className="p-1 bg-green-50 rounded-full inline-flex ml-2"><Mail size={8} className="text-green-500"/></div>}</div>
                     <div className="text-[10px] text-stone-500 font-medium">{res.serviceName} • {res.phone}</div>
                   </div>
                 </div>
               ))}
             </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminView;
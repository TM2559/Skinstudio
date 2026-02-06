# PROJEKT: Skin Studio (Rezervační systém)
Stack: React + Vite + Firebase + Tailwind + EmailJS + Vitest
Date: Wed Feb  4 21:01:43 CET 2026
--------------------------------------------------

🔴 INSTRUKCE PRO AI (SYSTEM PROMPT):
Jsi Lead React Developer a Architekt projektu Skin Studio. Tento soubor obsahuje kompletní a aktuální stav naší codebase.

TVA ROLE A CHOVÁNÍ:
1. Kontext: Všechny odpovědi musí vycházet POUZE z přiloženého kódu. Pokud něco v kódu chybí, upozorni na to.
2. Architektura: Dodržuj rozdělení na 'components/AdminView', 'components/CustomerView' a 'utils'.
3. Bezpečnost: Nikdy nenavrhuj hardcodování hesel. Vždy používej environment variables.
4. Styl: Udržuj konzistenci Tailwind CSS tříd a designu (Stone/Rose colors).
5. Jazyk: Komunikuj stručně, technicky přesně a v češtině.
6. Testování: Projekt používá Vitest. Udržuj testy funkční při změnách v 'utils'.
7. Logika: V utils/helpers.js je implementována 'Hybridní logika' (Smart Slots). 30min služby mají 'Magnet' režim, delší jsou volné. NEMĚNIT bezdůvodně.

POKYN PRO TEĎ:
Analyzuj přiložené soubory, sestav si mentální mapu závislostí a potvrď, že jsi připraven pracovat.
--------------------------------------------------

--- SOUBOR: package.json ---
```json
{
  "name": "salon-system",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "npm run test run && vite build",
    "test": "vitest",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@emailjs/browser": "^4.4.1",
    "firebase": "^12.8.0",
    "lucide-react": "^0.563.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.23",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "jsdom": "^26.0.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.18",
    "vite": "^7.2.4",
    "vite-plugin-pwa": "^1.2.0",
    "vitest": "^3.0.4"
  }
}
```


--- SOUBOR: vite.config.js ---
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Skin Studio',
        short_name: 'SkinStudio',
        description: 'Rezervační systém Skin Studio',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    // PŘIDÁNO: Zvýšíme limit a použijeme stabilnější pool pro Mac
    testTimeout: 10000,
    pool: 'vmThreads' 
  },
})
```


--- SOUBOR: src/App.css ---
```css
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaa);
}

@keyframes logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  a:nth-of-type(2) .logo {
    animation: logo-spin infinite 20s linear;
  }
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}

```


--- SOUBOR: src/App.jsx ---
```javascript
/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import { Loader2, Scissors, Lock } from 'lucide-react';
import { query, onSnapshot } from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";

// --- DŮLEŽITÉ: Tady propojujeme nové soubory ---
import CustomerView from './components/CustomerView';
import AdminView from './components/AdminView'; // <--- Toto načte vaši úpravu!
import { auth, getCollectionPath } from './firebaseConfig';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [reservations, setReservations] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [services, setServices] = useState([]);

  // View State
  const [view, setView] = useState('customer');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [clicks, setClicks] = useState(0);

  // Reset klikání
  useEffect(() => {
    if (clicks > 0) {
      const t = setTimeout(() => setClicks(0), 2000);
      return () => clearTimeout(t);
    }
  }, [clicks]);

  const handleLogoClick = () => {
    const newCount = clicks + 1;
    if (newCount >= 7) {
      setView('login');
      setClicks(0);
    } else {
      setClicks(newCount);
    }
  };

  // Auth & Data
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth error:", e); }
    };
    init();
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub1 = onSnapshot(query(getCollectionPath("reservations")), s => setReservations(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsub2 = onSnapshot(getCollectionPath("schedule"), s => { const data = {}; s.forEach(d => data[d.id] = d.data()); setSchedule(data); });
    
    // OPRAVA: Přidali jsme .sort() na konec načítání služeb
    const unsub3 = onSnapshot(query(getCollectionPath("services")), s => {
      const loadedServices = s.docs.map(d => ({id: d.id, ...d.data()}));
      // Seřadíme je podle 'order' (pokud order chybí, použije se 0)
      setServices(loadedServices.sort((a, b) => (a.order || 0) - (b.order || 0)));
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'salon123') { setView('admin'); setLoginError(''); }
    else setLoginError('Chybné heslo');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><Loader2 className="animate-spin text-stone-400"/></div>;

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 pb-10 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 mt-10">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-stone-100 overflow-hidden">
          
          <div className="bg-white p-10 text-center border-b border-stone-50">
            <div className="mx-auto cursor-default inline-block select-none" onClick={handleLogoClick}>
               <img src="/skinstudio_logo.jpg" alt="Skin Studio" className="h-40 w-auto mx-auto object-contain mix-blend-multiply opacity-95 active:scale-95 transition-transform" />
            </div>
          </div>

          <div className="p-4 sm:p-10 bg-white">
            {view === 'customer' && (
              <CustomerView services={services} schedule={schedule} reservations={reservations} />
            )}

            {view === 'login' && (
              <div className="max-w-sm mx-auto py-20 text-center animate-in zoom-in">
                <Lock className="mx-auto mb-4 text-stone-200" size={48} />
                <h2 className="font-serif text-2xl mb-6 text-stone-800 font-bold">Admin Vstup</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <input autoFocus type="password" placeholder="Heslo" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full p-4 rounded-xl border border-stone-200 text-center text-lg outline-none focus:ring-1 focus:ring-stone-400" />
                  {loginError && <p className="text-red-500 text-xs font-bold animate-pulse">{loginError}</p>}
                  <button type="submit" className="w-full bg-stone-800 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all">Přihlásit</button>
                  <button type="button" onClick={() => setView('customer')} className="text-xs text-stone-400 hover:underline">Zpět na web</button>
                </form>
              </div>
            )}

            {view === 'admin' && (
              <AdminView 
                services={services} 
                schedule={schedule} 
                reservations={reservations} 
                onLogout={() => { setView('customer'); setAdminPassword(''); }}
              />
            )}
          </div>

        </div>
        <p className="text-center text-stone-300 text-[10px] mt-10 tracking-[0.3em] uppercase">© 2026 Skin Studio v1.3.6</p>
      </div>
    </div>
  );
}
```


--- SOUBOR: src/components/AdminView.jsx ---
```javascript
import React, { useState, useMemo } from 'react';
import { Calendar, Clock, LogOut, PlusCircle, Archive } from 'lucide-react';
import { addDoc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { Utils } from '../utils/helpers';
import { getCollectionPath, getDocPath, EMAILJS_CONFIG } from '../firebaseConfig';

import AdminBookingsTab from './admin/AdminBookingsTab';
import AdminHistoryTab from './admin/AdminHistoryTab';
import AdminSettingsTab from './admin/AdminSettingsTab';
import ManualBookingModal from './admin/ManualBookingModal';
import RemindersModal from './admin/RemindersModal';
import OrderDetailModal from './admin/OrderDetailModal';

const AdminView = ({ services, schedule, reservations, onLogout }) => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [searchTerm, setSearchTerm] = useState('');
  const [adminDateInput, setAdminDateInput] = useState(Utils.getLocalISODate());
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceForm, setServiceForm] = useState({ name: '', price: '', duration: '60' });
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [remindersList, setRemindersList] = useState([]);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [manualForm, setManualForm] = useState({
    serviceId: '',
    date: Utils.getLocalISODate(),
    time: '',
    name: '',
    phone: '',
    email: '',
  });
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  const getComparableDate = (dateStr) => {
    if (!dateStr) return 0;
    const [d, m, y] = dateStr.split('-');
    return parseInt(`${y}${m}${d}`);
  };

  const todayKey = Utils.formatDateKey(new Date());
  const todayComparable = getComparableDate(todayKey);

  const { dailyReservations, historyReservations } = useMemo(() => {
    const sorted = [...reservations].sort((a, b) => {
      const dateDiff = getComparableDate(a.date) - getComparableDate(b.date);
      if (dateDiff !== 0) return dateDiff;
      return a.time.localeCompare(b.time);
    });
    const filtered = sorted.filter(
      (r) =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone.includes(searchTerm) ||
        (r.email && r.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const selectedDateKey = Utils.getDateKeyFromISO(adminDateInput);
    const daily = filtered.filter((r) => r.date === selectedDateKey);
    const history = filtered
      .filter((r) => getComparableDate(r.date) < todayComparable)
      .reverse();
    return { dailyReservations: daily, historyReservations: history };
  }, [reservations, searchTerm, adminDateInput, todayComparable]);

  const currentDayKey = Utils.getDateKeyFromISO(adminDateInput);
  const dayData = schedule[currentDayKey];
  const periods = dayData?.periods || (dayData?.start ? [{ start: dayData.start, end: dayData.end }] : []);

  const handleShift = async (action, index) => {
    if (action === 'add') {
      const newP = [...periods, { start: workStart, end: workEnd }].sort(
        (a, b) => Utils.timeToMinutes(a.start) - Utils.timeToMinutes(b.start)
      );
      await setDoc(getDocPath('schedule', currentDayKey), { periods: newP });
    } else if (action === 'remove') {
      const newP = periods.filter((_, i) => i !== index);
      const ref = getDocPath('schedule', currentDayKey);
      newP.length === 0 ? await deleteDoc(ref) : await setDoc(ref, { periods: newP });
    }
  };

  const handleService = async () => {
    if (!serviceForm.name) return;
    const data = {
      name: serviceForm.name,
      price: parseInt(serviceForm.price) || 0,
      duration: parseInt(serviceForm.duration),
      order: editingServiceId ? undefined : services.length,
    };
    const updateData = { ...data };
    if (updateData.order === undefined) delete updateData.order;
    if (editingServiceId) {
      await updateDoc(getDocPath('services', editingServiceId), updateData);
      setEditingServiceId(null);
    } else {
      await addDoc(getCollectionPath('services'), data);
    }
    setServiceForm({ name: '', price: '', duration: '60' });
  };

  const handleDeleteService = async (id) => {
    if (confirm('Smazat tuto proceduru?')) await deleteDoc(getDocPath('services', id));
  };

  const startEdit = (s) => {
    setActiveTab('settings');
    setEditingServiceId(s.id);
    setServiceForm({ name: s.name, price: s.price, duration: s.duration });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const moveService = async (index, direction) => {
    const newServices = [...services];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newServices.length) return;
    const [movedItem] = newServices.splice(index, 1);
    newServices.splice(targetIndex, 0, movedItem);
    const updatePromises = newServices.map((service, idx) =>
      updateDoc(getDocPath('services', service.id), { order: idx })
    );
    await Promise.all(updatePromises);
  };

  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItemIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;
    const newServices = [...services];
    const [movedItem] = newServices.splice(draggedItemIndex, 1);
    newServices.splice(dropIndex, 0, movedItem);
    const updatePromises = newServices.map((service, index) =>
      updateDoc(getDocPath('services', service.id), { order: index })
    );
    await Promise.all(updatePromises);
  };

  const handleDeleteRes = async (id) => {
    if (confirm('Smazat rezervaci?')) {
      await deleteDoc(getDocPath('reservations', id));
      setSelectedOrder(null);
    }
  };

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
                reply_to: 'rezervace@skinstudio.cz',
              },
            }),
          });
        }
        await updateDoc(getDocPath('reservations', res.id), { reminderSent: true });
        count++;
      } catch (e) {
        console.error(e);
      }
    }
    setIsSendingReminders(false);
    setShowReminderModal(false);
    alert(`Odesláno ${count} připomínek.`);
  };

  const openReminders = () => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const key = Utils.formatDateKey(tmr);
    setRemindersList(reservations.filter((r) => r.date === key && !r.reminderSent && r.email));
    setShowReminderModal(true);
  };

  const manualDateKey = Utils.getDateKeyFromISO(manualForm.date);
  const manualDaySchedule = schedule[manualDateKey];
  const hasShifts =
    manualDaySchedule && (manualDaySchedule.periods?.length > 0 || manualDaySchedule.start);

  const manualAvailableSlots = useMemo(() => {
    if (!hasShifts || !manualForm.serviceId) return [];
    const srv = services.find((s) => s.id === manualForm.serviceId);
    if (!srv) return [];
    const periods =
      manualDaySchedule.periods ||
      (manualDaySchedule.start ? [{ start: manualDaySchedule.start, end: manualDaySchedule.end }] : []);
    const booked = reservations
      .filter((r) => r.date === manualDateKey)
      .map((r) => ({
        start: Utils.timeToMinutes(r.time),
        end: Utils.timeToMinutes(r.time) + (r.duration || 60),
      }));
    return Utils.getSmartSlots(periods, parseInt(srv.duration), booked);
  }, [manualDateKey, manualForm.serviceId, manualDaySchedule, reservations, services, hasShifts]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.serviceId || !manualForm.time || !manualForm.email) return;
    setIsManualSubmitting(true);
    const selectedSrv = services.find((s) => s.id === manualForm.serviceId);
    try {
      await addDoc(getCollectionPath('reservations'), {
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
        source: 'admin',
      });
      setShowManualBooking(false);
      setManualForm({
        serviceId: '',
        date: Utils.getLocalISODate(),
        time: '',
        name: '',
        phone: '',
        email: '',
      });
      setActiveTab('bookings');
      if (manualForm.date !== adminDateInput) {
        setAdminDateInput(manualForm.date);
      }
    } catch (err) {
      console.error(err);
      alert('Chyba při ukládání.');
    } finally {
      setIsManualSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[80vh]">
      <div className="bg-white sticky top-0 z-30 border-b border-stone-200 -mx-4 px-4 sm:px-8 pt-4 pb-0 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="font-serif font-bold uppercase tracking-widest text-xs text-stone-400">
            Admin Panel
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setShowManualBooking(true)}
              className="bg-stone-800 hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all shadow-lg shadow-stone-200"
            >
              <PlusCircle size={14} /> <span className="hidden sm:inline">Nová rezervace</span>
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-6 text-sm font-medium overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setActiveTab('bookings');
              setSearchTerm('');
            }}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'bookings' ? 'border-stone-800 text-stone-900 font-bold' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
          >
            <Calendar size={16} /> Rezervace
          </button>
          <button
            onClick={() => {
              setActiveTab('settings');
              setSearchTerm('');
            }}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'settings' ? 'border-stone-800 text-stone-900 font-bold' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
          >
            <Clock size={16} /> Směny a Služby
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setSearchTerm('');
            }}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'border-stone-800 text-stone-900 font-bold' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
          >
            <Archive size={16} /> Archiv
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'bookings' && (
          <AdminBookingsTab
            adminDateInput={adminDateInput}
            setAdminDateInput={setAdminDateInput}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dailyReservations={dailyReservations}
            onOpenReminders={openReminders}
            onSelectOrder={setSelectedOrder}
            todayKey={todayKey}
          />
        )}
        {activeTab === 'history' && (
          <AdminHistoryTab
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            historyReservations={historyReservations}
            onSelectOrder={setSelectedOrder}
            todayKey={todayKey}
          />
        )}
        {activeTab === 'settings' && (
          <AdminSettingsTab
            adminDateInput={adminDateInput}
            setAdminDateInput={setAdminDateInput}
            workStart={workStart}
            setWorkStart={setWorkStart}
            workEnd={workEnd}
            setWorkEnd={setWorkEnd}
            periods={periods}
            onShift={handleShift}
            services={services}
            editingServiceId={editingServiceId}
            serviceForm={serviceForm}
            setServiceForm={setServiceForm}
            onService={handleService}
            onDeleteService={handleDeleteService}
            onStartEdit={startEdit}
            moveService={moveService}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            draggedItemIndex={draggedItemIndex}
            onCancelEdit={() => {
              setEditingServiceId(null);
              setServiceForm({ name: '', price: '', duration: '60' });
            }}
          />
        )}
      </div>

      <ManualBookingModal
        open={showManualBooking}
        onClose={() => setShowManualBooking(false)}
        services={services}
        manualForm={manualForm}
        setManualForm={setManualForm}
        manualAvailableSlots={manualAvailableSlots}
        hasShifts={hasShifts}
        onSubmit={handleManualSubmit}
        isSubmitting={isManualSubmitting}
      />

      <RemindersModal
        open={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        remindersList={remindersList}
        onSend={handleReminders}
        isSending={isSendingReminders}
      />

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onExportCalendar={handleExportCalendar}
          onDelete={handleDeleteRes}
        />
      )}
    </div>
  );
};

export default AdminView;

```


--- SOUBOR: src/components/CustomerView.jsx ---
```javascript
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
```


--- SOUBOR: src/components/admin/AdminBookingsTab.jsx ---
```javascript
import React from 'react';
import { Search, Send } from 'lucide-react';
import { Utils } from '../../utils/helpers';
import ReservationList from './ReservationList';

const AdminBookingsTab = ({
  adminDateInput,
  setAdminDateInput,
  searchTerm,
  setSearchTerm,
  dailyReservations,
  onOpenReminders,
  onSelectOrder,
  todayKey,
}) => (
  <div className="max-w-2xl mx-auto space-y-6">
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative">
        <input
          type="date"
          value={adminDateInput}
          onChange={(e) => setAdminDateInput(e.target.value)}
          className="w-full sm:w-auto p-3 bg-stone-800 text-white rounded-xl text-sm font-bold shadow-md outline-none cursor-pointer"
        />
      </div>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 text-stone-400" size={16} />
        <input
          type="text"
          placeholder="Filtrovat den..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 p-3 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-800 outline-none transition-all"
        />
      </div>
      <button
        onClick={onOpenReminders}
        className="bg-white border border-stone-200 text-stone-600 px-4 py-3 sm:py-0 rounded-xl text-xs font-bold uppercase hover:bg-stone-50 flex items-center justify-center gap-2 transition-all"
      >
        <Send size={14} /> <span className="hidden sm:inline">Připomínky</span>
      </button>
    </div>

    <div className="flex justify-between items-end mt-4 mb-2">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">
        {Utils.formatDateKey(new Date()) === Utils.getDateKeyFromISO(adminDateInput)
          ? 'Dnešní agenda'
          : `Agenda: ${Utils.formatDateDisplay(Utils.getDateKeyFromISO(adminDateInput))}`}
      </h3>
      <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-1 rounded-lg font-bold">
        {dailyReservations.length} rezervací
      </span>
    </div>

    <ReservationList
      data={dailyReservations}
      emptyMsg={`Pro datum ${Utils.formatDateDisplay(Utils.getDateKeyFromISO(adminDateInput))} nejsou žádné rezervace.`}
      onSelectOrder={onSelectOrder}
      todayKey={todayKey}
    />
  </div>
);

export default AdminBookingsTab;

```


--- SOUBOR: src/components/admin/AdminHistoryTab.jsx ---
```javascript
import React from 'react';
import { Search } from 'lucide-react';
import ReservationList from './ReservationList';

const AdminHistoryTab = ({
  searchTerm,
  setSearchTerm,
  historyReservations,
  onSelectOrder,
  todayKey,
}) => (
  <div className="max-w-2xl mx-auto space-y-6">
    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 mb-6">
      <p className="text-xs text-stone-500 font-medium">
        Zde najdete všechny proběhlé rezervace. Můžete vyhledávat podle jména, emailu nebo telefonu.
      </p>
    </div>

    <div className="relative">
      <Search className="absolute left-3 top-3 text-stone-400" size={16} />
      <input
        type="text"
        placeholder="Vyhledat v archivu..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        autoFocus
        className="w-full pl-10 p-3 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-stone-800 outline-none transition-all shadow-sm"
      />
    </div>

    <ReservationList
      data={historyReservations}
      emptyMsg={searchTerm ? 'V archivu nic nenalezeno.' : 'Archiv je prázdný.'}
      onSelectOrder={onSelectOrder}
      todayKey={todayKey}
    />
  </div>
);

export default AdminHistoryTab;

```


--- SOUBOR: src/components/admin/AdminSettingsTab.jsx ---
```javascript
import React from 'react';
import {
  Clock,
  Scissors,
  X,
  Plus,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Utils } from '../../utils/helpers';

const AdminSettingsTab = ({
  adminDateInput,
  setAdminDateInput,
  workStart,
  setWorkStart,
  workEnd,
  setWorkEnd,
  periods,
  onShift,
  services,
  editingServiceId,
  serviceForm,
  setServiceForm,
  onService,
  onDeleteService,
  onStartEdit,
  moveService,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  draggedItemIndex,
  onCancelEdit,
}) => (
  <div className="grid md:grid-cols-2 gap-10">
    <section>
      <h2 className="font-serif text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800">
        <Clock size={18} className="text-stone-400" /> Pracovní doba
      </h2>
      <div className="bg-stone-50 p-6 rounded-xl space-y-6 shadow-inner">
        <input
          type="date"
          value={adminDateInput}
          onChange={(e) => setAdminDateInput(e.target.value)}
          className="w-full p-3 border border-stone-200 rounded-lg outline-none bg-white font-medium"
        />
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Směny:</p>
          {periods.map((p, idx) => (
            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-stone-100 shadow-sm">
              <span className="text-sm font-bold">{p.start} — {p.end}</span>
              <button onClick={() => onShift('remove', idx)} className="text-red-300 hover:text-red-500">
                <X size={16} />
              </button>
            </div>
          ))}
          {periods.length === 0 && <p className="text-xs text-stone-400 italic">Tento den je zavřeno.</p>}
        </div>
        <div className="pt-4 border-t border-stone-200">
          <div className="flex gap-2 items-center mb-4">
            <select
              value={workStart}
              onChange={(e) => setWorkStart(e.target.value)}
              className="p-3 border rounded-lg w-full bg-white text-sm"
            >
              {Utils.generateTimeOptions().map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span>-</span>
            <select
              value={workEnd}
              onChange={(e) => setWorkEnd(e.target.value)}
              className="p-3 border rounded-lg w-full bg-white text-sm"
            >
              {Utils.generateTimeOptions().map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => onShift('add')}
            className="w-full bg-stone-800 text-white py-3 rounded-lg font-bold text-[10px] uppercase shadow-md flex items-center justify-center gap-2 hover:bg-black transition-all"
          >
            <Plus size={14} /> Přidat blok času
          </button>
        </div>
      </div>
    </section>

    <section>
      <h2 className="font-serif text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800">
        <Scissors size={18} className="text-stone-400" /> Správa produktů
      </h2>
      <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3 shadow-sm mb-4">
        <h3 className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">
          {editingServiceId ? 'Upravit produkt' : 'Nový produkt / Služba'}
        </h3>
        <input
          type="text"
          placeholder="Název"
          value={serviceForm.name}
          onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
          className="w-full p-3 border rounded-lg text-sm"
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Cena"
            value={serviceForm.price}
            onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
            className="flex-1 p-3 border rounded-lg text-sm"
          />
          <select
            value={serviceForm.duration}
            onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
            className="flex-1 p-3 border rounded-lg text-sm bg-white"
          >
            <option value="30">30 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
            <option value="120">120 min</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onService}
            className="flex-1 bg-stone-800 text-white py-3 rounded-lg font-bold text-[10px] uppercase shadow-md"
          >
            {editingServiceId ? 'Uložit změny' : '+ Přidat'}
          </button>
          {editingServiceId && (
            <button
              onClick={onCancelEdit}
              className="px-4 bg-stone-100 text-stone-500 rounded-lg font-bold text-[10px] uppercase"
            >
              Zrušit
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scroll">
        {services.map((s, index) => (
          <div
            key={s.id}
            className={`flex justify-between items-center bg-stone-50 p-3 rounded-lg group border border-stone-100 transition-all ${draggedItemIndex === index ? 'opacity-50' : 'opacity-100'}`}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDrop={(e) => onDrop(e, index)}
            style={{ cursor: 'move' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1 mr-1 md:hidden">
                <button
                  onClick={() => moveService(index, -1)}
                  disabled={index === 0}
                  className="text-stone-400 hover:text-stone-800 disabled:opacity-20 bg-white p-1 rounded-full border border-stone-200 shadow-sm"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => moveService(index, 1)}
                  disabled={index === services.length - 1}
                  className="text-stone-400 hover:text-stone-800 disabled:opacity-20 bg-white p-1 rounded-full border border-stone-200 shadow-sm"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="hidden md:block">
                <GripVertical className="text-stone-300" size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-stone-800">{s.name}</span>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] font-bold text-stone-500">{s.price} Kč</span>
                  <span className="text-[10px] text-stone-300">{s.duration} min</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onStartEdit(s)} className="p-2 text-stone-400 hover:text-stone-800">
                <Edit2 size={14} />
              </button>
              <button onClick={() => onDeleteService(s.id)} className="p-2 text-stone-300 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

export default AdminSettingsTab;

```


--- SOUBOR: src/components/admin/ManualBookingModal.jsx ---
```javascript
import React from 'react';
import { X } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const ManualBookingModal = ({
  open,
  onClose,
  services,
  manualForm,
  setManualForm,
  manualAvailableSlots,
  hasShifts,
  onSubmit,
  isSubmitting,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-xl font-bold text-stone-900">Manuální rezervace</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-stone-400">Služba</label>
            <select
              required
              className="w-full p-3 border rounded-lg text-sm bg-white"
              value={manualForm.serviceId}
              onChange={(e) => setManualForm({ ...manualForm, serviceId: e.target.value, time: '' })}
            >
              <option value="">Vyberte proceduru...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-stone-400">Datum</label>
            <input
              type="date"
              required
              className="w-full p-3 border rounded-lg text-sm"
              value={manualForm.date}
              onChange={(e) => setManualForm({ ...manualForm, date: e.target.value, time: '' })}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-stone-400 flex justify-between">
              Čas {hasShifts ? <span className="text-green-600">Dle směn</span> : <span className="text-orange-500">Bez omezení</span>}
            </label>
            {hasShifts ? (
              <select
                required
                className="w-full p-3 border rounded-lg text-sm bg-white"
                value={manualForm.time}
                onChange={(e) => setManualForm({ ...manualForm, time: e.target.value })}
                disabled={!manualForm.serviceId}
              >
                <option value="">Vyberte čas...</option>
                {manualAvailableSlots.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            ) : (
              <select
                required
                className="w-full p-3 border rounded-lg text-sm bg-white"
                value={manualForm.time}
                onChange={(e) => setManualForm({ ...manualForm, time: e.target.value })}
              >
                <option value="">Vyberte čas...</option>
                {Utils.generateTimeOptions().map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>

          <div className="border-t border-stone-100 my-4 pt-4 space-y-4">
            <input
              required
              type="text"
              placeholder="Jméno klienta"
              className="w-full p-3 border rounded-lg text-sm"
              value={manualForm.name}
              onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
            />
            <input
              required
              type="tel"
              placeholder="Telefon"
              className="w-full p-3 border rounded-lg text-sm"
              value={manualForm.phone}
              onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
            />
            <input
              required
              type="email"
              placeholder="Email (pro potvrzení)"
              className="w-full p-3 border rounded-lg text-sm"
              value={manualForm.email}
              onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-stone-800 text-white py-3 rounded-lg font-bold text-xs uppercase hover:bg-black transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Ukládám...' : 'Vytvořit rezervaci'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManualBookingModal;

```


--- SOUBOR: src/components/admin/OrderDetailModal.jsx ---
```javascript
import React from 'react';
import { X, Phone, Mail, CalendarDays, CalendarPlus, Trash2 } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const OrderDetailModal = ({ order, onClose, onExportCalendar, onDelete }) => {
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-serif text-xl font-bold text-stone-900">{order.name}</h3>
            <p className="text-xs font-bold text-stone-400 mt-1">{order.serviceName}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-stone-50 rounded-full text-stone-400 hover:text-stone-900">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-sm text-stone-600 mb-6">
          <div className="flex gap-3 items-center">
            <CalendarDays size={16} /> <span>{Utils.formatDateDisplay(order.date)}, {order.time}</span>
          </div>
          <div className="flex gap-3 items-center">
            <Phone size={16} /> <a href={`tel:${order.phone}`} className="hover:underline">{order.phone}</a>
          </div>
          <div className="flex gap-3 items-center">
            <Mail size={16} /> <a href={`mailto:${order.email}`} className="hover:underline truncate w-48 block">{order.email}</a>
          </div>
        </div>

        <div className="flex gap-3 mb-3">
          <a href={`tel:${order.phone}`} className="flex-1 bg-stone-800 text-white py-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors">
            <Phone size={14} /> Zavolat
          </a>
          <a href={`mailto:${order.email}`} className="flex-1 bg-white border border-stone-200 text-stone-800 py-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors">
            <Mail size={14} /> E-mail
          </a>
        </div>

        <button
          onClick={() => onExportCalendar(order)}
          className="w-full mb-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-widest py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <CalendarPlus size={14} /> Uložit do kalendáře
        </button>

        <button onClick={() => onDelete(order.id)} className="w-full text-red-400 hover:text-red-600 text-xs font-bold uppercase tracking-widest flex justify-center gap-2 py-3">
          <Trash2 size={14} /> Smazat objednávku
        </button>
      </div>
    </div>
  );
};

export default OrderDetailModal;

```


--- SOUBOR: src/components/admin/RemindersModal.jsx ---
```javascript
import React from 'react';
import { Send, Loader2 } from 'lucide-react';

const RemindersModal = ({ open, onClose, remindersList, onSend, isSending }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95">
        <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2 text-stone-900">
          <Send size={20} /> Připomínky
        </h3>
        {remindersList.length > 0 ? (
          <>
            <p className="text-stone-500 text-sm mb-6">Odeslat {remindersList.length} připomínek?</p>
            <div className="flex gap-3">
              <button
                onClick={onSend}
                disabled={isSending}
                className="flex-1 bg-stone-800 text-white py-3 rounded-xl font-bold text-xs uppercase disabled:opacity-50"
              >
                {isSending ? <Loader2 className="animate-spin mx-auto" size={14} /> : 'Odeslat'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 border border-stone-200 rounded-xl text-xs font-bold uppercase text-stone-400"
              >
                Zrušit
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-stone-500 text-sm mb-4">Žádné připomínky k odeslání.</p>
            <button onClick={onClose} className="w-full py-3 bg-stone-100 rounded-xl font-bold">
              Zavřít
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemindersModal;

```


--- SOUBOR: src/components/admin/ReservationList.jsx ---
```javascript
import React from 'react';
import { Mail } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const ReservationList = ({ data, emptyMsg, onSelectOrder, todayKey }) => (
  <div className="space-y-3">
    {data.length === 0 && (
      <div className="text-center py-10 bg-stone-50 rounded-xl border border-stone-100">
        <p className="text-stone-400 italic text-sm">{emptyMsg}</p>
      </div>
    )}

    {data.map((res) => {
      const isToday = res.date === todayKey;
      return (
        <div
          key={res.id}
          onClick={() => onSelectOrder(res)}
          className={`group relative p-4 bg-white border rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md ${isToday ? 'border-l-4 border-l-stone-800 border-stone-200' : 'border-stone-100 hover:border-stone-300'}`}
        >
          <div className="flex justify-between items-start">
            <div className="flex gap-4 items-center">
              <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${isToday ? 'bg-stone-800 text-white' : 'bg-stone-50 text-stone-500'}`}>
                <span className="text-lg font-bold leading-none">{res.time}</span>
              </div>
              <div>
                <h4 className="font-bold text-stone-900 flex items-center gap-2">
                  {res.name}
                  {isToday && (
                    <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                      Dnes
                    </span>
                  )}
                </h4>
                <div className="text-xs text-stone-500 flex items-center gap-2 mt-1">
                  <span className="font-medium">{Utils.formatDateDisplay(res.date)}</span>
                  <span>•</span>
                  <span>{res.serviceName}</span>
                </div>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-stone-400">{res.phone}</div>
              {res.reminderSent && (
                <div className="text-[9px] text-green-500 font-bold mt-1 flex items-center justify-end gap-1">
                  <Mail size={10} /> Odesláno
                </div>
              )}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default ReservationList;

```


--- SOUBOR: src/firebase.js ---
```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tady jsou tvoje klíče hezky bokem
const firebaseConfig = {
  apiKey: "AIzaSyBkT5mnInO0VPWGHurdCMkcm5kCPa_L4ss",
  authDomain: "tm-reservations.firebaseapp.com",
  projectId: "tm-reservations",
  storageBucket: "tm-reservations.firebasestorage.app",
  messagingSenderId: "831805384532",
  appId: "1:831805384532:web:db46c66d5866250d458ac1",
  measurementId: "G-PGJV1DWTL6"
};

// Inicializace
const app = initializeApp(firebaseConfig);

// Exportujeme databázi, aby ji mohl používat zbytek aplikace
export const db = getFirestore(app);
```


--- SOUBOR: src/firebaseConfig.js ---
```javascript
/* eslint-disable no-undef */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Bezpečný přístup k ENV
const getEnv = (key) => {
  try { return import.meta.env[key] || ""; } catch { return ""; }
};

// Detekce prostředí (Canvas vs Lokální Vite)
// V lokálním prostředí tyto proměnné neexistují, proto je kontrolujeme přes typeof
const isCanvas = typeof __firebase_config !== 'undefined';

const firebaseConfig = isCanvas
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: getEnv('VITE_FIREBASE_API_KEY'),
      authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: getEnv('VITE_FIREBASE_APP_ID'),
    };

export const EMAILJS_CONFIG = {
  SERVICE_ID: getEnv('VITE_EMAILJS_SERVICE_ID'),
  CONFIRM_TEMPLATE: getEnv('VITE_EMAILJS_CONFIRM_TEMPLATE_ID'),
  REMINDER_TEMPLATE: getEnv('VITE_EMAILJS_REMINDER_TEMPLATE_ID'),
  PUBLIC_KEY: getEnv('VITE_EMAILJS_PUBLIC_KEY')
};

// Inicializace
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Pokud jsme v Canvasu, použijeme injektované ID, jinak defaultní nebo prázdné
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Helpery pro cesty
export const getCollectionPath = (colName) => 
  isCanvas 
    ? collection(db, 'artifacts', appId, 'public', 'data', colName)
    : collection(db, colName);

export const getDocPath = (colName, docId) => 
  isCanvas 
    ? doc(db, 'artifacts', appId, 'public', 'data', colName, docId)
    : doc(db, colName, docId);
```


--- SOUBOR: src/index.css ---
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

```


--- SOUBOR: src/main.jsx ---
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  )
```


--- SOUBOR: src/setupTests.js ---
```javascript
import '@testing-library/jest-dom';
```


--- SOUBOR: src/utils/helpers.js ---
```javascript
export const Utils = {
  timeToMinutes: (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  },
  
  minutesToTime: (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  },
  
  formatDateKey: (dateObj) => {
    const d = dateObj.getDate().toString().padStart(2, '0');
    const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}-${m}-${y}`;
  },
  
  formatDateDisplay: (dateKey) => dateKey ? dateKey.replace(/-/g, '/') : "",
  
  getDateKeyFromISO: (isoDate) => {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split('-').map(Number);
    return `${d.toString().padStart(2, '0')}-${m.toString().padStart(2, '0')}-${y}`;
  },
  
  getLocalISODate: () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  },
  
  generateTimeOptions: () => {
    const opts = [];
    for (let i = 6; i <= 22; i++) {
      const h = i.toString().padStart(2, '0');
      opts.push(`${h}:00`, `${h}:30`);
    }
    return opts;
  },

  // --- HYBRIDNÍ LOGIKA (CLUSTERING v2) ---
  getSmartSlots: (periods, duration, bookedIntervals, step = 30) => {
    let slots = [];
    
    // Zjistíme, jestli už je ten den někdo objednaný
    const hasBookings = bookedIntervals.length > 0;

    // ZMĚNA: Přísný "Magnet" režim zapínáme JEN PRO KRÁTKÉ SLUŽBY a JEN POKUD UŽ NĚKDO JE OBJEDNANÝ.
    // Pokud je den prázdný (!hasBookings), chováme se "Free" i pro krátké služby.
    const isStrict = (duration <= 30) && hasBookings;
    
    periods.forEach(p => {
      const startMin = Utils.timeToMinutes(p.start);
      const endMin = Utils.timeToMinutes(p.end);

      for (let t = startMin; t <= endMin - duration; t += step) {
        const tEnd = t + duration;
        const timeStr = Utils.minutesToTime(t);

        const isCollision = bookedIntervals.some(r => (t < r.end && tEnd > r.start));
        
        if (!isCollision) {
          if (!isStrict) {
            // VOLNÝ REŽIM (buď je to dlouhá služba, NEBO je den prázdný) -> Bereme vše
            if (!slots.includes(timeStr)) slots.push(timeStr);
          } else {
            // PŘÍSNÝ MAGNET REŽIM (krátká služba A den už má rezervace)
            
            // Lepíme se JEN k existujícím rezervacím
            const touchesPrevRes = bookedIntervals.some(r => r.end === t);
            const touchesNextRes = bookedIntervals.some(r => r.start === tEnd);

            if (touchesPrevRes || touchesNextRes) {
               if (!slots.includes(timeStr)) slots.push(timeStr);
            }
          }
        }
      }
    });

    return slots.sort();
  },

  // ... (Kalendářové funkce) ...
  createGoogleCalendarLink: (dateStr, timeStr, durationMinutes, title, description) => {
    let year, month, day;
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) { [year, month, day] = parts; } 
        else { [day, month, year] = parts; }
    }
    const startDate = new Date(`${year}-${month}-${day}T${timeStr}:00`);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const format = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const url = new URL("https://www.google.com/calendar/render");
    url.searchParams.append("action", "TEMPLATE");
    url.searchParams.append("text", title);
    url.searchParams.append("dates", `${format(startDate)}/${format(endDate)}`);
    url.searchParams.append("details", description);
    url.searchParams.append("location", "Skin Studio");
    return url.toString();
  },

  downloadICSFile: (dateStr, timeStr, durationMinutes, title, description) => {
    let year, month, day;
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) { [year, month, day] = parts; } 
        else { [day, month, year] = parts; }
    }
    const startDate = new Date(`${year}-${month}-${day}T${timeStr}:00`);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const formatICSDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const icsContent = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}`, `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${title}`, `DESCRIPTION:${description}`, 'LOCATION:Skin Studio',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'rezervace_skinstudio.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
```


--- SOUBOR: src/utils/helpers.test.js ---
```javascript
import { describe, it, expect } from 'vitest';
import { Utils } from './helpers';

describe('Utils Helper Functions', () => {
  
  // Základní testy
  it('correctly converts time string to minutes', () => {
    expect(Utils.timeToMinutes('01:00')).toBe(60);
  });
  it('correctly converts minutes to time string', () => {
    expect(Utils.minutesToTime(60)).toBe('01:00');
  });
  it('formats date key for display', () => {
    expect(Utils.formatDateDisplay('2026-01-26')).toBe('2026/01/26');
  });
  it('generates correct time options', () => {
    expect(Utils.generateTimeOptions()).toContain('06:00');
  });

  // --- TESTY PRO CLUSTERING (v2) ---

  it('Strict Clustering: 30 min service sticks ONLY to existing reservation', () => {
    // SCÉNÁŘ: Den MÁ rezervaci (16:00-16:30).
    // Hledáme 30 min službu.
    const periods = [{ start: '09:00', end: '17:00' }];
    const duration = 30;
    const booked = [{ start: 960, end: 990 }]; // 16:00 - 16:30

    const slots = Utils.getSmartSlots(periods, duration, booked);

    // OČEKÁVÁNÍ:
    // 09:00 (Start směny) -> NE (Den už má rezervace, nechceme drobit)
    expect(slots).not.toContain('09:00');

    // 15:30 (Hned PŘED rezervací) -> ANO
    expect(slots).toContain('15:30');

    // 16:30 (Hned PO rezervaci) -> ANO
    expect(slots).toContain('16:30');
  });

  it('Empty Day: 30 min service can be ANYWHERE (First come, first served)', () => {
    // SCÉNÁŘ: Den je úplně PRÁZDNÝ.
    // Hledáme 30 min službu.
    const periods = [{ start: '09:00', end: '17:00' }];
    const duration = 30;
    const booked = [];

    const slots = Utils.getSmartSlots(periods, duration, booked);

    // OČEKÁVÁNÍ:
    // ZMĚNA: Klient má absolutní svobodu.
    
    // 09:00 (Start) -> ANO
    expect(slots).toContain('09:00');
    
    // 13:00 (Uprostřed) -> ANO (Toto dříve nešlo, teď už ano!)
    expect(slots).toContain('13:00');
    
    // 16:30 (Konec) -> ANO
    expect(slots).toContain('16:30');
  });

  it('Free Logic: 60 min service can be anywhere', () => {
    const periods = [{ start: '09:00', end: '17:00' }];
    const duration = 60;
    const booked = [{ start: 960, end: 990 }]; // 16:00-16:30

    const slots = Utils.getSmartSlots(periods, duration, booked);

    expect(slots).toContain('09:00');
    expect(slots).toContain('10:00');
  });
});
```



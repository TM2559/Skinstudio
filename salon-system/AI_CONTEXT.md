# PROJEKT: Skin Studio (Rezervační systém)
Stack: React + Vite + Firebase + Tailwind + EmailJS + Vitest
Date: Mon Feb 23 18:49:39 CET 2026
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
    "build": "npm run test && vite build",
    "test": "vitest",
    "lint": "eslint .",
    "preview": "vite preview",
    "server": "node server/index.js",
    "deploy": "npm run build && firebase deploy"
  },
  "dependencies": {
    "@emailjs/browser": "^4.4.1",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "firebase": "^12.8.0",
    "lucide-react": "^0.563.0",
    "react": "^19.2.0",
    "react-compare-slider": "^3.1.0",
    "react-dom": "^19.2.0",
    "react-markdown": "^10.1.0",
    "react-router-dom": "^7.13.0",
    "remark-breaks": "^4.0.0"
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
import { writeFileSync } from 'fs'
import { join } from 'path'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const BASE = 'https://www.skinstudio.cz'
const today = () => new Date().toISOString().slice(0, 10)

/** Generates sitemap.xml at build time with current date (for SEO). */
function sitemapPlugin() {
  return {
    name: 'sitemap',
    closeBundle() {
      const outDir = join(process.cwd(), 'dist')
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE}/</loc><lastmod>${today()}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE}/kosmetika</loc><lastmod>${today()}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE}/pmu</loc><lastmod>${today()}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE}/rezervace</loc><lastmod>${today()}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
</urlset>`
      writeFileSync(join(outDir, 'sitemap.xml'), sitemap.trim(), 'utf8')
    },
  }
}

export default defineConfig({
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  plugins: [
    react(),
    sitemapPlugin(),
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
    testTimeout: 10000,
    pool: 'vmThreads',
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
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { query, onSnapshot } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

import Layout from './components/Layout';
import ReservationApp from './components/ReservationApp';
import CosmeticsPage from './components/CosmeticsPage';
import PMUPage from './components/PMUPage';
import { filterCosmeticsServices } from './utils/helpers';
import { auth, getCollectionPath } from './firebaseConfig';

export default function App() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [schedulePmu, setSchedulePmu] = useState({});
  const [services, setServices] = useState([]);
  const [addons, setAddons] = useState([]);
  const [serviceAddonLinks, setServiceAddonLinks] = useState([]);
  const [view, setView] = useState('customer');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [clicks, setClicks] = useState(0);

  // Na stránce /rezervace vždy zobrazit rezervační formulář (ne admin) a scroll nahoru
  useEffect(() => {
    if (location.pathname === '/rezervace') {
      setView('customer');
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

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

  useEffect(() => {
    const init = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error('Auth error:', e);
      }
    };
    init();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub1 = onSnapshot(query(getCollectionPath('reservations')), (s) =>
      setReservations(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsub2 = onSnapshot(getCollectionPath('schedule'), (s) => {
      const data = {};
      s.forEach((d) => (data[d.id] = d.data()));
      setSchedule(data);
    });
    const unsub2b = onSnapshot(getCollectionPath('schedule_pmu'), (s) => {
      const data = {};
      s.forEach((d) => (data[d.id] = d.data()));
      setSchedulePmu(data);
    });
    const unsub3 = onSnapshot(query(getCollectionPath('services')), (s) => {
      const loadedServices = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      setServices([...loadedServices].sort((a, b) => (a.order || 0) - (b.order || 0)));
    });
    const unsub4 = onSnapshot(query(getCollectionPath('addons')), (s) =>
      setAddons(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsub5 = onSnapshot(query(getCollectionPath('service_addon_links')), (s) =>
      setServiceAddonLinks(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsub1();
      unsub2();
      unsub2b();
      unsub3();
      unsub4();
      unsub5();
    };
  }, [user]);

  const servicesStandardOnly = useMemo(
    () => filterCosmeticsServices(services),
    [services]
  );

  const servicesWithAddons = useMemo(() => {
    return services.map((service) => {
      const links = serviceAddonLinks.filter((l) => l.main_service_id === service.id);
      const available_addons = links
        .map((link) => {
          const addon = addons.find((a) => a.id === link.addon_id);
          if (!addon || addon.is_active === false) return null;
          const final_price = link.custom_price != null ? link.custom_price : addon.default_price;
          return {
            id: addon.id,
            name: addon.name,
            price: final_price,
            duration_minutes: addon.duration_minutes,
            is_recommended: !!link.is_recommended,
            price_behavior: addon.price_behavior === 'REPLACE' ? 'REPLACE' : 'ADD',
          };
        })
        .filter(Boolean);
      return { ...service, available_addons };
    });
  }, [services, addons, serviceAddonLinks]);

  /** Služby s addony pouze pro kosmetiku (STANDARD) – pro stránky, kde zobrazujeme jen kosmetiku. */
  const servicesStandardWithAddons = useMemo(
    () => filterCosmeticsServices(servicesWithAddons),
    [servicesWithAddons]
  );

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'salon123') {
      setView('admin');
      setLoginError('');
    } else {
      setLoginError('Chybné heslo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-stone-400" size={32} />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout setView={setView}>
            <CosmeticsPage services={servicesStandardOnly} />
          </Layout>
        }
      />
      <Route
        path="/kosmetika"
        element={
          <Layout setView={setView}>
            <CosmeticsPage services={servicesStandardOnly} />
          </Layout>
        }
      />
      <Route
        path="/pmu"
        element={
          <PMUPage
            services={servicesWithAddons}
            schedule={schedulePmu}
            reservations={reservations}
          />
        }
      />
      <Route
        path="/rezervace"
        element={
          <Layout setView={setView}>
            <ReservationApp
              loading={false}
              view={view}
              setView={setView}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              loginError={loginError}
              setLoginError={setLoginError}
              handleLogoClick={handleLogoClick}
              handleLogin={handleLogin}
              services={servicesWithAddons}
              schedule={schedule}
              schedulePmu={schedulePmu}
              reservations={reservations}
              addons={addons}
              serviceAddonLinks={serviceAddonLinks}
            />
          </Layout>
        }
      />
    </Routes>
  );
}

```


--- SOUBOR: src/components/AdminView.jsx ---
```javascript
import React, { useState, useMemo } from 'react';
import { Calendar, Clock, LogOut, PlusCircle, Archive, Instagram, Package, Image as ImageIcon, Scissors } from 'lucide-react';
import { addDoc, deleteDoc, updateDoc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { Utils } from '../utils/helpers';
import { getCollectionPath, getDocPath, EMAILJS_CONFIG } from '../firebaseConfig';

import AdminBookingsTab from './admin/AdminBookingsTab';
import AdminHistoryTab from './admin/AdminHistoryTab';
import AdminShiftsTab from './admin/AdminShiftsTab';
import AdminServicesTab from './admin/AdminServicesTab';
import AdminAddonsTab from './admin/AdminAddonsTab';
import AdminInstagramTab from './admin/AdminInstagramTab';
import AdminPhotosTab from './admin/AdminPhotosTab';
import ManualBookingModal from './admin/ManualBookingModal';
import RemindersModal from './admin/RemindersModal';
import OrderDetailModal from './admin/OrderDetailModal';

const AdminView = ({ services, schedule, schedulePmu = {}, reservations, addons = [], serviceAddonLinks = [], onLogout }) => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [searchTerm, setSearchTerm] = useState('');
  const [adminDateInput, setAdminDateInput] = useState(Utils.getLocalISODate());
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceForm, setServiceForm] = useState({ name: '', price: '', duration: '60', description: '', category: 'STANDARD', isStartingPrice: false });
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [remindersList, setRemindersList] = useState([]);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [manualForm, setManualForm] = useState({
    category: null,
    serviceId: '',
    date: Utils.getLocalISODate(),
    time: '',
    name: '',
    phone: '',
    email: '',
    sendNotification: true,
  });
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [editingAddonLinks, setEditingAddonLinks] = useState([]);

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
        (r.phone && r.phone.includes(searchTerm)) ||
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

  const handleSaveDay = async (dateKey, type, periodsToSave) => {
    const scheduleRef = getDocPath('schedule', dateKey);
    const schedulePmuRef = getDocPath('schedule_pmu', dateKey);
    if (type === 'closed') {
      await Promise.all([deleteDoc(scheduleRef).catch(() => {}), deleteDoc(schedulePmuRef).catch(() => {})]);
    } else if (type === 'kosmetika') {
      if (periodsToSave.length > 0) {
        await setDoc(scheduleRef, { periods: periodsToSave });
      } else {
        await deleteDoc(scheduleRef).catch(() => {});
      }
      await deleteDoc(schedulePmuRef).catch(() => {});
    } else if (type === 'pmu') {
      if (periodsToSave.length > 0) {
        await setDoc(schedulePmuRef, { periods: periodsToSave });
      } else {
        await deleteDoc(schedulePmuRef).catch(() => {});
      }
      await deleteDoc(scheduleRef).catch(() => {});
    }
  };

  const saveServiceAddonLinks = async (mainServiceId) => {
    const col = getCollectionPath('service_addon_links');
    const snapshot = await getDocs(query(col, where('main_service_id', '==', mainServiceId)));
    await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
    const toAdd = editingAddonLinks.filter((row) => row.addon_id);
    for (const row of toAdd) {
      await addDoc(col, {
        main_service_id: mainServiceId,
        addon_id: row.addon_id,
        custom_price: row.custom_price !== '' && row.custom_price != null ? Number(row.custom_price) : null,
        is_recommended: !!row.is_recommended,
      });
    }
  };

  const handleService = async () => {
    if (!serviceForm.name) return;
    const data = {
      name: serviceForm.name,
      price: parseInt(serviceForm.price) || 0,
      duration: parseInt(serviceForm.duration),
      description: (serviceForm.description || '').trim(),
      category: serviceForm.category || 'STANDARD',
      isStartingPrice: !!serviceForm.isStartingPrice,
      order: editingServiceId ? undefined : services.length,
    };
    const updateData = { ...data };
    if (updateData.order === undefined) delete updateData.order;
    if (editingServiceId) {
      await updateDoc(getDocPath('services', editingServiceId), updateData);
      await saveServiceAddonLinks(editingServiceId);
      setEditingServiceId(null);
      setEditingAddonLinks([]);
    } else {
      await addDoc(getCollectionPath('services'), data);
    }
    setServiceForm({ name: '', price: '', duration: '60', description: '', category: 'STANDARD', isStartingPrice: false });
  };

  const handleDeleteService = async (id) => {
    if (confirm('Smazat tuto proceduru?')) await deleteDoc(getDocPath('services', id));
  };

  const PMU_DURATIONS = [180, 210, 240, 270];
  const startEdit = (s) => {
    setActiveTab('services');
    setEditingServiceId(s.id);
    const category = s.category || 'STANDARD';
    const duration = category === 'PMU' && !PMU_DURATIONS.includes(Number(s.duration))
      ? 180
      : s.duration;
    setServiceForm({ name: s.name, price: s.price, duration, description: s.description || '', category, isStartingPrice: !!s.isStartingPrice });
    const links = serviceAddonLinks
      .filter((l) => l.main_service_id === s.id)
      .map((l) => ({
        addon_id: l.addon_id,
        custom_price: l.custom_price != null ? l.custom_price : '',
        is_recommended: !!l.is_recommended,
      }));
    setEditingAddonLinks(links);
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
    const contact = [
      `Klient: ${order.name}`,
      order.phone != null && order.phone !== '' ? `Tel: ${order.phone}` : null,
      order.email != null && order.email !== '' ? `Email: ${order.email}` : null,
    ].filter(Boolean).join('\n');
    Utils.downloadICSFile(
      order.date,
      order.time,
      order.duration || 60,
      `Skin Studio: ${order.serviceName} (${order.name})`,
      contact || `Klient: ${order.name}`
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
    if (!manualForm.serviceId || !manualForm.time || !manualForm.name) return;
    const sendNotification = manualForm.sendNotification !== false;
    if (sendNotification) {
      const hasContact = (manualForm.phone || '').trim() || (manualForm.email || '').trim();
      if (!hasContact) {
        alert('Pro odeslání potvrzení vyplňte alespoň telefon nebo e-mail.');
        return;
      }
    }
    setIsManualSubmitting(true);
    const selectedSrv = services.find((s) => s.id === manualForm.serviceId);
    const phone = (manualForm.phone || '').trim() || null;
    const email = (manualForm.email || '').trim() || null;
    try {
      await addDoc(getCollectionPath('reservations'), {
        date: manualDateKey,
        time: manualForm.time,
        name: manualForm.name,
        phone,
        email,
        serviceName: selectedSrv?.name || 'Manual Booking',
        duration: parseInt(selectedSrv?.duration || 60),
        price: selectedSrv?.price || 0,
        created: new Date().toISOString(),
        reminderSent: false,
        source: 'admin',
      });
      if (sendNotification && EMAILJS_CONFIG.PUBLIC_KEY && email) {
        try {
          await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              service_id: EMAILJS_CONFIG.SERVICE_ID,
              template_id: EMAILJS_CONFIG.CONFIRM_TEMPLATE,
              user_id: EMAILJS_CONFIG.PUBLIC_KEY,
              template_params: {
                name: manualForm.name,
                to_email: email,
                date: Utils.formatDateDisplay(manualDateKey),
                time: manualForm.time,
                service: selectedSrv?.name || 'Manual Booking',
                reply_to: 'rezervace@skinstudio.cz',
              },
            }),
          });
        } catch (notifErr) {
          console.error(notifErr);
        }
      }
      setShowManualBooking(false);
      setManualForm({
        category: null,
        serviceId: '',
        date: Utils.getLocalISODate(),
        time: '',
        name: '',
        phone: '',
        email: '',
        sendNotification: true,
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
          <span className="font-display font-bold uppercase tracking-widest text-xs text-stone-400">
            Admin Panel
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setShowManualBooking(true)}
              className="skin-accent px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all shadow-sm"
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

        <div className="mobile-carousel-strip flex gap-6 text-sm font-medium">
          <button
            onClick={() => {
              setActiveTab('bookings');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item pb-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'bookings' ? 'border-stone-800 text-stone-900 font-bold' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
          >
            <Calendar size={16} /> Rezervace
          </button>
          <button
            onClick={() => {
              setActiveTab('shifts');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item pb-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'shifts' ? 'border-stone-800 text-stone-900 font-bold' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
          >
            <Clock size={16} /> Směny
          </button>
          <button
            onClick={() => {
              setActiveTab('services');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item pb-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'services' ? 'border-stone-800 text-stone-900 font-bold' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
          >
            <Scissors size={16} /> Služby
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item pb-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'border-stone-800 text-stone-900 font-bold' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
          >
            <Archive size={16} /> Archiv
          </button>
          <button
            onClick={() => {
              setActiveTab('addons');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item pb-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'addons' ? 'border-stone-800 text-stone-900 font-bold' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
          >
            <Package size={16} /> Add-ony
          </button>
          <button
            onClick={() => {
              setActiveTab('instagram');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item pb-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'instagram' ? 'border-stone-800 text-stone-900 font-bold' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
          >
            <Instagram size={16} /> Instagram
          </button>
          <button
            onClick={() => {
              setActiveTab('photos');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item pb-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'photos' ? 'border-stone-800 text-stone-900 font-bold' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
          >
            <ImageIcon size={16} /> Fotografie
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
        {activeTab === 'addons' && <AdminAddonsTab addons={addons} />}
        {activeTab === 'instagram' && <AdminInstagramTab />}
        {activeTab === 'photos' && <AdminPhotosTab />}
        {activeTab === 'shifts' && (
          <AdminShiftsTab
            schedule={schedule}
            schedulePmu={schedulePmu}
            onSaveDay={handleSaveDay}
          />
        )}
        {activeTab === 'services' && (
          <AdminServicesTab
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
              setServiceForm({ name: '', price: '', duration: '60', description: '', category: 'STANDARD', isStartingPrice: false });
              setEditingAddonLinks([]);
            }}
            addons={addons}
            editingAddonLinks={editingAddonLinks}
            setEditingAddonLinks={setEditingAddonLinks}
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


--- SOUBOR: src/components/AdminView.test.jsx ---
```javascript
/**
 * Testy komponenty AdminView – admin rozhraní (rezervace, služby, úprava služby).
 * Testuje: po kliknutí na „Upravit“ u služby zůstane zobrazen záložka Služby a formulář pro úpravu (ne prázdná obrazovka).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminView from './AdminView';

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
  deleteDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  setDoc: vi.fn(() => Promise.resolve()),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  query: vi.fn((ref, ...args) => ({ ref, args })),
  where: vi.fn(() => ({})),
}));

vi.mock('../firebaseConfig', () => ({
  getCollectionPath: vi.fn((...path) => ({ _path: path.join('/') })),
  getDocPath: vi.fn((...path) => ({ _path: path.join('/') })),
  EMAILJS_CONFIG: { PUBLIC_KEY: '', SERVICE_ID: '', REMINDER_TEMPLATE: '', ADMIN_TEMPLATE: '' },
}));

const defaultServices = [
  { id: 's1', name: 'Klasická masáž', duration: 60, price: 800, description: '' },
  { id: 's2', name: 'Čištění pleti', duration: 30, price: 500, description: '' },
];

const defaultProps = {
  services: defaultServices,
  schedule: {},
  schedulePmu: {},
  reservations: [],
  addons: [],
  serviceAddonLinks: [],
  onLogout: vi.fn(),
};

describe('AdminView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
  });

  it('after clicking Služby and then Edit on a service, edit form is visible (not blank screen)', () => {
    render(<AdminView {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Služby/ }));
    expect(screen.getByText('Nový produkt / Služba')).toBeInTheDocument();
    expect(screen.getByText('Klasická masáž')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Upravit Klasická masáž' }));

    expect(screen.getByText('Upravit produkt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Uložit změny' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zrušit' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Název')).toHaveValue('Klasická masáž');
  });
});

```


--- SOUBOR: src/components/ComparisonSlider.jsx ---
```javascript
import React, { useState, useEffect } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { ImageIcon } from 'lucide-react';

const MOBILE_BREAKPOINT = 767;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false
  );
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => setIsMobile(mql.matches);
    mql.addEventListener('change', update);
    update();
    return () => mql.removeEventListener('change', update);
  }, []);
  return isMobile;
}

/**
 * Before/After comparison slider.
 * theme: 'dark' = PMU (gold handle), 'light' = Cosmetics (white handle, soft shadow).
 * When image URLs are missing, shows a placeholder instead of broken images.
 *
 * @typedef {Object} ComparisonProps
 * @property {string} beforeImage - URL of the "before" image
 * @property {string} afterImage - URL of the "after" image
 * @property {string} altText - Description for accessibility (e.g. "Před a po PMU obočí")
 * @property {'dark'|'light'} [theme] - 'dark' (default) or 'light' for cosmetics/medical
 */

function PlaceholderBlock({ theme }) {
  const isLight = theme === 'light';
  return (
    <div
      className={`w-full aspect-[4/5] max-h-[65vh] md:max-h-[600px] min-h-[280px] flex items-center justify-center rounded-xl ${
        isLight ? 'bg-stone-100 text-stone-400' : 'bg-stone-800/50 text-stone-500'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <ImageIcon size={40} strokeWidth={1.5} />
        <span className="text-sm">Obrázek není k dispozici</span>
      </div>
    </div>
  );
}

/** @type {React.FC<ComparisonProps>} */
export default function ComparisonSlider({ beforeImage, afterImage, altText, theme = 'dark' }) {
  const isMobile = useIsMobile();
  const hasImages = beforeImage && afterImage && beforeImage.trim() && afterImage.trim();

  if (!hasImages) {
    return (
      <div
        className={`comparison-slider-contain rounded-xl overflow-hidden w-full flex flex-col items-stretch ${
          theme === 'light' ? 'border border-stone-200 bg-stone-50' : 'border border-white/10 bg-[#0F0F0F]'
        }`}
      >
        <PlaceholderBlock theme={theme} />
      </div>
    );
  }

  const isLight = theme === 'light';
  const handle = (
    <div
      className={`comparison-slider-handle flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-full touch-manipulation ${
        isLight
          ? 'bg-white/95 text-stone-500 border border-stone-200/80 shadow-sm'
          : 'bg-gradient-to-r from-[#B37E76] via-[#D49A91] to-[#B37E76] text-white border border-[#D49A91]/20 shadow-md ring-1 ring-white/20'
      }`}
      aria-hidden
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 17l-5-5 5-5" />
        <path d="M18 17l5-5-5-5" />
      </svg>
    </div>
  );

  const imageStyle = { objectFit: 'cover', objectPosition: 'center center' };

  return (
    <div
      className={`comparison-slider-contain rounded-xl overflow-hidden w-full flex flex-col items-stretch ${
        isLight ? 'border border-stone-200 bg-stone-50' : 'border border-white/10 bg-[#0F0F0F]'
      }`}
    >
      <div className="relative w-full aspect-[4/5] max-h-[65vh] md:max-h-[600px] min-h-[280px]">
        <ReactCompareSlider
          itemOne={
            <ReactCompareSliderImage
              src={beforeImage}
              alt="Před"
              style={imageStyle}
            />
          }
          itemTwo={
            <ReactCompareSliderImage
              src={afterImage}
              alt="Po"
              style={imageStyle}
            />
          }
          handle={handle}
          onlyHandleDraggable={isMobile}
          className="!absolute inset-0 w-full h-full"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}

```


--- SOUBOR: src/components/CosmeticsPage.jsx ---
```javascript
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { query, where, onSnapshot } from 'firebase/firestore';
import { getCollectionPath } from '../firebaseConfig';
import { TRANSFORMATIONS_COLLECTION, COSMETICS_CATEGORY } from '../constants/cosmetics';
import { WEB_CONTENT } from '../constants/content';
import { filterCosmeticsServices } from '../utils/helpers';
import ComparisonSlider from './ComparisonSlider';
import LazySection from './LazySection';
import ServiceListAccordion from './ServiceListAccordion';
import SocialProofSection from './SocialProofSection';
import { GOOGLE_REVIEW_URL } from '../firebaseConfig';

const COSMETICS_BG = '#F9F8F6';

export default function CosmeticsPage({ services = [] }) {
  const cosmeticServices = filterCosmeticsServices(services);
  const [transformations, setTransformations] = useState([]);
  const promenyCarouselRef = useRef(null);
  const [promenyActiveIndex, setPromenyActiveIndex] = useState(0);

  useEffect(() => {
    const hash = window.location.hash?.slice(1);
    if (hash) {
      const el = document.getElementById(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, []);

  useEffect(() => {
    const colT = getCollectionPath(TRANSFORMATIONS_COLLECTION);
    const qT = query(colT, where('category', '==', COSMETICS_CATEGORY));
    const unsubT = onSnapshot(qT, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setTransformations(list);
    });
    return () => unsubT();
  }, []);

  // Sync pagination dot with carousel scroll position (mobile)
  useEffect(() => {
    const el = promenyCarouselRef.current;
    if (!el || transformations.length <= 1) return;
    const onScroll = () => {
      const itemWidth = el.offsetWidth * 0.85 + 24; /* 85vw + gap-6 */
      const index = Math.round(el.scrollLeft / itemWidth);
      const clamped = Math.min(Math.max(0, index), transformations.length - 1);
      setPromenyActiveIndex(clamped);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [transformations.length]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COSMETICS_BG }}>
      {/* 1. Hero – mobile: text first, compact image strip; desktop: split, viewport height */}
      <section className="grid grid-cols-1 md:grid-cols-2 grid-rows-[auto_400px] md:grid-rows-none md:h-screen md:max-h-[1080px] w-full max-w-[1920px] mx-auto overflow-hidden min-h-0">
        <div className="flex flex-col justify-center items-start px-8 md:px-24 h-full min-h-0 bg-[#F9F8F6] order-1 md:order-1 py-8 md:py-0 max-w-xl md:max-w-2xl md:mx-auto">
          <p className="text-xs sm:text-sm font-sans uppercase tracking-[0.2em] text-stone-600 mb-3">
            {WEB_CONTENT.hero.subtitle}
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl leading-tight tracking-wide text-[var(--skin-charcoal)] break-words">
            {WEB_CONTENT.hero.title}
          </h1>
          <p className="mt-4 font-signature text-2xl sm:text-3xl text-stone-600 -rotate-2">
            {WEB_CONTENT.hero.signature}
          </p>
          <p className="mt-6 text-gray-600 max-w-prose" style={{ lineHeight: 1.6 }}>
            {WEB_CONTENT.hero.body}
          </p>
          <Link
            to="/rezervace"
            className="mt-8 inline-flex items-center justify-center bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 w-fit shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)]"
          >
            {WEB_CONTENT.hero.cta}
          </Link>
        </div>
        <div className="relative w-full h-[400px] md:h-full order-2 md:order-2 min-h-0">
          <img
            src="/lucie-portrait.jpg"
            alt={WEB_CONTENT.imageAlts.portrait}
            className="w-full h-full object-cover object-[50%_48%]"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      </section>

      {/* 2. Filozofie – text-only, centered, no duplicate portrait */}
      <section
        id="o-nas"
        className="scroll-mt-20 py-24 px-4 sm:px-6"
        style={{ backgroundColor: 'var(--skin-cream-dark)' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-6 text-stone-800 md:mb-8">
            {WEB_CONTENT.filozofie.heading}
          </h2>
          <div className="body-text text-stone-700 space-y-6 leading-relaxed">
            <p>{WEB_CONTENT.filozofie.paragraphs[0]}</p>
            <p>
              {WEB_CONTENT.filozofie.paragraphs[1].split(WEB_CONTENT.filozofie.paragraph2Bold)[0]}
              <strong className="font-semibold text-stone-800">{WEB_CONTENT.filozofie.paragraph2Bold}</strong>
              {WEB_CONTENT.filozofie.paragraphs[1].split(WEB_CONTENT.filozofie.paragraph2Bold)[1]}
            </p>
            <p>{WEB_CONTENT.filozofie.paragraphs[2]}</p>
          </div>
          <p
            className="font-signature text-4xl text-stone-800 -rotate-3 inline-block mt-8"
            aria-label={WEB_CONTENT.footer.ownerName}
          >
            {WEB_CONTENT.filozofie.signatureName}
          </p>
        </div>
      </section>

      {/* PMU strip – pure typography (after Filozofie, before Proměny) */}
      <section
        className="py-16 bg-[#faf9f6] border-y border-stone-100 text-center"
        aria-labelledby="pmu-teaser-heading"
      >
        <div className="max-w-4xl mx-auto px-6">
          <h3 id="pmu-teaser-heading" className="text-3xl md:text-4xl font-display text-stone-900 mb-4">
            {WEB_CONTENT.pmu.headline}{' '}
            <span className="italic font-display text-stone-400">{WEB_CONTENT.pmu.headlineItalic}</span>
          </h3>
          <p className="text-stone-600 max-w-2xl mx-auto mb-8 font-light">
            {WEB_CONTENT.pmu.body}
          </p>
          <Link
            to="/pmu#pmu"
            className="inline-block px-8 py-4 border border-stone-800 text-xs uppercase tracking-[0.2em] text-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 mt-8"
          >
            {WEB_CONTENT.pmu.cta}
          </Link>
        </div>
      </section>

      {/* 3. Transformations ("Proměny") */}
      <section
        id="promeny"
        className="scroll-mt-20 py-24 px-4"
        style={{ backgroundColor: COSMETICS_BG }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-stone-700 text-center mb-12">
            {WEB_CONTENT.promeny.heading}
          </h2>
          {transformations.length > 0 ? (
            <>
              <LazySection rootMargin="240px">
                <div
                  ref={promenyCarouselRef}
                  className="transformations-scroll flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory px-4 -mx-4 md:mx-0 md:px-0 min-h-[320px]"
                >
                  <div id="carousel-track" className="flex gap-6 flex-shrink-0">
                    {transformations.map((item) => (
                      <div
                        key={item.id}
                        className="w-[85vw] md:w-[400px] flex-shrink-0 snap-center flex flex-col"
                      >
                      <div className="order-2 md:order-1 space-y-2">
                        <h3 className="font-display font-semibold text-lg text-stone-800">
                          {item.title || WEB_CONTENT.promeny.defaultTitle}
                        </h3>
                        {item.description && (
                          <p className="text-gray-800 text-sm leading-relaxed max-w-prose">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="order-1 md:order-2">
                        <ComparisonSlider
                          beforeImage={item.imageBeforeUrl}
                          afterImage={item.imageAfterUrl}
                          altText={item.title || WEB_CONTENT.promeny.defaultTitle}
                          theme="light"
                        />
                      </div>
                      <div className="order-3 mobile-carousel-swipe-zone md:hidden pb-2" aria-hidden />
                      </div>
                    ))}
                  </div>
                </div>
                {transformations.length >= 1 && (
                  <div className="carousel-dots md:hidden" role="tablist" aria-label={WEB_CONTENT.promeny.carouselAriaLabel}>
                    {transformations.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-label={`${WEB_CONTENT.promeny.transformationAriaLabel} ${i + 1}`}
                        aria-selected={promenyActiveIndex === i}
                        onClick={() => {
                          const el = promenyCarouselRef.current;
                          if (!el) return;
                          const itemWidth = el.offsetWidth * 0.85 + 24; /* 85vw + gap-6 */
                          el.scrollTo({ left: i * itemWidth, behavior: 'smooth' });
                        }}
                        className={`dot ${promenyActiveIndex === i ? 'dot-active' : ''}`}
                      />
                    ))}
                  </div>
                )}
              </LazySection>
            </>
          ) : (
            <p className="text-center text-stone-500 text-sm py-12">
              {WEB_CONTENT.promeny.emptyState}
            </p>
          )}
        </div>
      </section>

      {/* 4. Services & Pricing ("Ceník" – accordion) */}
      <section
        id="procedury"
        className="scroll-mt-20 py-24 px-4 border-t border-stone-200/80"
        style={{ backgroundColor: '#fcfbf7' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-2 text-center text-stone-800">
            {WEB_CONTENT.cenik.heading}
          </h2>
          <p className="text-sm text-center mb-12 text-gray-500">
            {WEB_CONTENT.cenik.subtext}
          </p>
          <ServiceListAccordion
            services={cosmeticServices}
            variant="light"
            loadingText={WEB_CONTENT.cenik.loading}
            ctaReservovat={WEB_CONTENT.cenik.ctaReservovat}
            ctaReservovatShort={WEB_CONTENT.cenik.ctaRezervovatShort}
            getReserveHref={(s) => `/rezervace?service=${encodeURIComponent(s.id)}`}
            footerHref="/rezervace"
          />
        </div>
      </section>

      {/* 5. Recenze a Google – Social Proof */}
      <section id="recenze" className="scroll-mt-20">
        <SocialProofSection qrImageSrc="/Skinstudio_ggl_qr.png" googleReviewUrl={GOOGLE_REVIEW_URL} />
      </section>

    </div>
  );
}

```


--- SOUBOR: src/components/CustomerView.jsx ---
```javascript
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { addDoc } from "firebase/firestore";
import { Utils, isPmuService, filterCosmeticsServices } from '../utils/helpers';
import { getCollectionPath, EMAILJS_CONFIG } from '../firebaseConfig';

/**
 * Total price: REPLACE options set the base (last one wins), ADD options add on top.
 * If service has isStartingPrice ("od"), base is 0 – "od" is only informational.
 */
function calculateReservationTotal(service, upsells) {
  const base = service?.isStartingPrice ? 0 : (service?.price ?? 0);
  const overrides = (upsells || []).filter((u) => u.price_behavior === 'REPLACE');
  const additions = (upsells || []).filter((u) => u.price_behavior !== 'REPLACE');
  let total = overrides.length > 0 ? (overrides[overrides.length - 1].price ?? 0) : base;
  additions.forEach((u) => { total += (u.price ?? 0); });
  return total;
}

const CustomerView = ({ services, schedule, schedulePmu = {}, reservations, onBookingSuccess, initialServiceId, theme = 'light' }) => {
  const ADMIN_EMAIL = "info@skinstudio.cz";
  const isDark = theme === 'dark';

  /** Na světlé stránce /rezervace zobrazujeme jen kosmetiku; na PMU (dark) všechny předané služby (PMU). */
  const displayServices = useMemo(
    () => (isDark ? services : filterCosmeticsServices(services)),
    [services, isDark]
  );

  const [selectedService, setSelectedService] = useState(null);
  const hasAppliedInitialService = useRef(false);

  useEffect(() => {
    if (hasAppliedInitialService.current || !initialServiceId || !displayServices.length) return;
    const svc = displayServices.find((s) => s.id === initialServiceId);
    if (svc) {
      setSelectedService(svc);
      hasAppliedInitialService.current = true;
    }
  }, [initialServiceId, displayServices]);
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedUpsells, setSelectedUpsells] = useState([]);

  /** Use PMU schedule when a PMU service is selected and schedulePmu is provided; otherwise cosmetics schedule. */
  const effectiveSchedule = useMemo(() => {
    if (selectedService && isPmuService(selectedService) && schedulePmu && Object.keys(schedulePmu).length > 0) {
      return schedulePmu;
    }
    return schedule;
  }, [schedule, schedulePmu, selectedService]);

  const handleUpsellToggle = (service, isActive) => {
    setSelectedUpsells(prev =>
      isActive ? [...prev, service] : prev.filter(u => u.id !== service.id)
    );
  };

  const clientDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    const sched = effectiveSchedule;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = Utils.formatDateKey(d);
      const dayData = sched[key];
      if (dayData && (dayData.periods?.length > 0 || dayData.start)) dates.push(d);
    }
    return dates;
  }, [effectiveSchedule]);

  const activeDateStr = selectedDateStr || (clientDates.length > 0 ? Utils.formatDateKey(clientDates[0]) : null);

  /** Počet volných slotů pro každý den (pro vybranou službu) – pro zakázání dnů s 0 volných */
  const slotsPerDate = useMemo(() => {
    const map = new Map();
    if (!selectedService) return map;
    const duration = parseInt(selectedService.duration);
    clientDates.forEach((d) => {
      const key = Utils.formatDateKey(d);
      const dayData = effectiveSchedule[key];
      if (!dayData) return;
      const periods = dayData.periods || (dayData.start ? [{ start: dayData.start, end: dayData.end }] : []);
      const bookedIntervals = reservations
        .filter((r) => r.date === key)
        .map((r) => ({ start: Utils.timeToMinutes(r.time), end: Utils.timeToMinutes(r.time) + (r.duration || 60) }));
      const slots = Utils.getSmartSlots(periods, duration, bookedIntervals);
      map.set(key, slots.length);
    });
    return map;
  }, [clientDates, selectedService, effectiveSchedule, reservations]);

  // --- ZMĚNA: Použití chytré logiky (getSmartSlots) ---
  const availableSlots = useMemo(() => {
    if (!activeDateStr || !selectedService) return [];
    const dayData = effectiveSchedule[activeDateStr];
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

  }, [activeDateStr, selectedService, effectiveSchedule, reservations]);

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
        price: calculateReservationTotal(selectedService, selectedUpsells),
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
            {displayServices.map(s => {
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
                    {!(isSelected && s.isStartingPrice) && (
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg shrink-0 whitespace-nowrap ${isDark ? 'text-[#daa59c] bg-stone-800' : 'text-stone-700 bg-stone-100'}`}>
                        {s.isStartingPrice ? `od ${s.price} Kč` : `${s.price} Kč`}
                      </span>
                    )}
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
        <div className={`min-w-0 ${!selectedService ? 'opacity-20 pointer-events-none' : ''}`}>
          <h2 className={`text-[10px] font-bold uppercase tracking-widest mb-6 border-b pb-2 ${isDark ? 'text-stone-300 border-stone-800' : 'text-stone-500 border-stone-100'}`}>2. Termín</h2>
          <div className="mobile-carousel-strip date-strip-scroll flex gap-3 pb-4 min-w-0">
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
                  <span className="text-xl font-display leading-none my-1">
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

        </div>

        {/* Permanentní kontaktní CTA – vždy viditelný */}
        <div className={`pt-6 mt-2 border-t text-center md:text-left ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <p className={`mb-1.5 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Nenašli jste vhodný termín? Zavolejte a najdeme řešení společně.
          </p>
          <a
            href="tel:+420724875558"
            className="text-lg font-semibold hover:underline transition-all focus:outline-none focus:ring-2 focus:ring-[#a88a7d]/50 rounded"
            style={{ color: isDark ? '#daa59c' : 'var(--skin-gold-dark)' }}
          >
            +420 724 875 558
          </a>
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
              <div className="flex justify-between"><span>Cena:</span><span className={isDark ? 'font-bold text-stone-100' : 'font-bold text-stone-900'}>{selectedService?.isStartingPrice ? '—' : (selectedService?.price != null ? `${selectedService.price} Kč` : '—')}</span></div>
              {selectedUpsells.length > 0 && (
                <>
                  {selectedUpsells.map((u) => (
                    <div key={u.id} className="flex justify-between">
                      <span>+ {u.name}:</span>
                      <span className={isDark ? 'font-bold text-stone-100' : 'font-bold text-stone-900'}>{u.price} Kč</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium">
                    <span>Celkem{selectedUpsells.some(u => u.price_behavior === 'REPLACE') ? '' : ' (+ doplňky)'}:</span>
                    <span className={isDark ? 'font-bold text-stone-100' : 'font-bold text-stone-900'}>
                      {calculateReservationTotal(selectedService, selectedUpsells)} Kč
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
```


--- SOUBOR: src/components/CustomerView.test.jsx ---
```javascript
/**
 * Testy komponenty CustomerView – rezervační formulář pro zákazníka.
 * Testuje: výběr služby, termínu a času, formulář, odeslání rezervace (s mockem Firebase/EmailJS).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomerView from './CustomerView';

const mockAddDoc = vi.fn(() => Promise.resolve({ id: 'mock-id' }));
vi.mock('firebase/firestore', () => ({ addDoc: (...args) => mockAddDoc(...args) }));
vi.mock('../firebaseConfig', () => ({
  getCollectionPath: vi.fn(() => ({ _path: 'reservations' })),
  EMAILJS_CONFIG: { PUBLIC_KEY: '', SERVICE_ID: '', CONFIRM_TEMPLATE: '', ADMIN_TEMPLATE: '' },
}));

const defaultServices = [
  { id: 's1', name: 'Klasická masáž', duration: 60, price: 800, order: 0 },
  { id: 's2', name: 'Čištění pleti', duration: 30, price: 500, order: 1 },
];

const todayKey = (() => {
  const d = new Date();
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
})();

const defaultSchedule = {
  [todayKey]: {
    periods: [{ start: '09:00', end: '17:00' }],
  },
};

describe('CustomerView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Základní render: zobrazení všech služeb včetně názvů a cen.
  it('renders list of services', () => {
    render(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
      />
    );
    expect(screen.getByText('Klasická masáž')).toBeInTheDocument();
    expect(screen.getByText('Čištění pleti')).toBeInTheDocument();
    expect(screen.getByText('800 Kč')).toBeInTheDocument();
    expect(screen.getByText('500 Kč')).toBeInTheDocument();
  });

  // Kroky rezervace: 1. Výběr procedury, 2. Termín, 3. Čas a blok Rezervace.
  it('shows step headers', () => {
    render(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
      />
    );
    expect(screen.getByText('1. Výběr procedury')).toBeInTheDocument();
    expect(screen.getByText('2. Termín')).toBeInTheDocument();
    expect(screen.getByText('3. Čas')).toBeInTheDocument();
    expect(screen.getByText(/Rezervace/)).toBeInTheDocument();
  });

  // Klik na službu: zobrazí se výběr termínů (ne hláška „žádné termíny“ při platném rozvrhu).
  it('selecting a service highlights it and shows date picker', () => {
    render(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
      />
    );
    const card = screen.getAllByText('Čištění pleti').find((el) => el.closest('[role="button"]'));
    fireEvent.click(card);
    expect(screen.queryByText('Momentálně nejsou vypsány žádné termíny.')).not.toBeInTheDocument();
  });

  // Prázdný rozvrh: po výběru služby se zobrazí „Momentálně nejsou vypsány žádné termíny.“
  it('shows "no dates" message when schedule has no available days', () => {
    render(
      <CustomerView
        services={defaultServices}
        schedule={{}}
        reservations={[]}
      />
    );
    fireEvent.click(screen.getByText('Klasická masáž'));
    expect(screen.getByText('Momentálně nejsou vypsány žádné termíny.')).toBeInTheDocument();
  });

  // Při vybrané službě a rozvrhu: zobrazí se tlačítka časů (např. 09:00, 09:30).
  it('with schedule and service shows date buttons and time slots', () => {
    render(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
      />
    );
    fireEvent.click(screen.getByText('Čištění pleti'));
    const timeSlots = screen.getAllByRole('button', { name: /^\d{2}:\d{2}$/ });
    expect(timeSlots.length).toBeGreaterThan(0);
  });

  // Po výběru služby a času: formulář obsahuje jméno, telefon, e-mail a tlačítko „Potvrdit termín“.
  it('form has name, phone, email inputs and submit button', () => {
    render(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
      />
    );
    fireEvent.click(screen.getByText('Klasická masáž'));
    const timeButtons = screen.getAllByRole('button', { name: /^\d{2}:\d{2}$/ });
    if (timeButtons.length) fireEvent.click(timeButtons[0]);
    expect(screen.getByPlaceholderText('Vaše jméno')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Telefon')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('E-mail pro potvrzení')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Potvrdit termín/ })).toBeInTheDocument();
  });

  // Bez zvoleného času je formulář neaktivní (pointer-events-none).
  it('submit is disabled without time selected', () => {
    render(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
      />
    );
    fireEvent.click(screen.getByText('Klasická masáž'));
    const form = screen.getByPlaceholderText('Vaše jméno').closest('form');
    expect(form).toHaveClass('pointer-events-none');
  });

  // Po vyplnění a odeslání: addDoc je zavolán a callback onBookingSuccess se zavolá.
  it('calls onBookingSuccess after successful submit', async () => {
    const onBookingSuccess = vi.fn();
    render(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
        onBookingSuccess={onBookingSuccess}
      />
    );
    fireEvent.click(screen.getByText('Klasická masáž'));
    const firstTime = screen.getAllByRole('button', { name: /^\d{2}:\d{2}$/ })[0];
    fireEvent.click(firstTime);
    fireEvent.change(screen.getByPlaceholderText('Vaše jméno'), { target: { value: 'Jan Novák' } });
    fireEvent.change(screen.getByPlaceholderText('Telefon'), { target: { value: '777123456' } });
    fireEvent.change(screen.getByPlaceholderText('E-mail pro potvrzení'), { target: { value: 'jan@test.cz' } });
    fireEvent.submit(screen.getByRole('button', { name: /Potvrdit termín/ }));

    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(onBookingSuccess).toHaveBeenCalled();
    });
  });

  // Prop initialServiceId (např. z query ?service=): daná služba je předvybraná (vizuálně zvýrazněná).
  it('applies initialServiceId when provided', () => {
    render(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
        initialServiceId="s2"
      />
    );
    const card = screen.getAllByText('Čištění pleti').find((el) => el.closest('[role="button"]'));
    expect(card).toBeInTheDocument();
    expect(card.closest('.border-l-2')).toBeInTheDocument();
  });

  // theme=dark: v DOM je třída pro tmavý režim (např. .bg-stone-950).
  it('renders with dark theme when theme=dark', () => {
    const { container } = render(
      <CustomerView
        services={defaultServices}
        schedule={defaultSchedule}
        reservations={[]}
        theme="dark"
      />
    );
    expect(container.querySelector('.bg-stone-950')).toBeInTheDocument();
  });
});

```


--- SOUBOR: src/components/FooterTagline.jsx ---
```javascript
import React from 'react';

/** Red outline heart icon for "srdci" replacement in footer taglines */
export function HeartIcon() {
  return (
    <span className="inline-flex items-center mx-1 relative top-[1px]" aria-hidden>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          stroke="#E57590"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * Renders tagline with the given word replaced by HeartIcon (e.g. "srdci").
 * @param {string} tagline - Full sentence containing the word to replace
 * @param {string} heartWord - Word to replace with heart icon (e.g. 'srdci')
 */
export function TaglineWithHeart({ tagline, heartWord }) {
  const parts = tagline.split(heartWord);
  if (parts.length !== 2) return <>{tagline}</>;
  return (
    <>
      {parts[0]}
      <HeartIcon />
      {parts[1]}
    </>
  );
}

```


--- SOUBOR: src/components/InstagramSection.jsx ---
```javascript
import React, { useEffect, useRef } from 'react';
import { INSTAGRAM_POST_URLS } from '../firebaseConfig';

const INSTAGRAM_EMBED_SCRIPT = 'https://www.instagram.com/embed.js';

/** Renders only the Instagram post embed grid (for use inside footer). */
export default function InstagramSection({ embedOnly = false }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (INSTAGRAM_POST_URLS.length === 0) return;
    if (document.querySelector('script[src="' + INSTAGRAM_EMBED_SCRIPT + '"]')) {
      if (window.instgrm) window.instgrm.Embeds.process();
      return;
    }
    const script = document.createElement('script');
    script.src = INSTAGRAM_EMBED_SCRIPT;
    script.async = true;
    script.onload = () => {
      if (window.instgrm) window.instgrm.Embeds.process();
    };
    document.body.appendChild(script);
    return () => {};
  }, []);

  if (embedOnly) {
    if (INSTAGRAM_POST_URLS.length === 0) return null;
    return (
      <div
        ref={containerRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl mx-auto mt-12"
      >
        {INSTAGRAM_POST_URLS.slice(0, 6).map((url) => (
          <blockquote
            key={url}
            className="instagram-media rounded-lg overflow-hidden"
            data-instgrm-permalink={url}
            data-instgrm-version="14"
            style={{ minWidth: 280, maxWidth: 540 }}
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              Příspěvek na Instagramu
            </a>
          </blockquote>
        ))}
      </div>
    );
  }

  return null;
}

```


--- SOUBOR: src/components/InstagramShowcase.jsx ---
```javascript
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { Instagram } from 'lucide-react';
import { INSTAGRAM_URL, getDocPath } from '../firebaseConfig';
import { WEB_CONTENT } from '../constants/content';

const INSTAGRAM_HANDLE = '@skin_studio_lucie_metelkova';
const CONFIG_DOC = 'instagramShowcase';
const STATIC_CONFIG_PATH = '/instagram-showcase/config.json';

/** Living Mosaic: swap interval and fade duration */
const SWAP_INTERVAL_MS = 3000;
const FADE_DURATION_MS = 700;

/** Image pool for the living mosaic (8–12 images). Reused for variety. */
const galleryImages = [
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop',
];

/** Fallback when no config – first 4 of pool */
const PLACEHOLDER_IMAGES = galleryImages.slice(0, 4);

/** Build pool: use imageList if available (pad to 8+ with galleryImages), else galleryImages */
function buildPool(imageList) {
  if (imageList && imageList.length > 0) {
    const fromConfig = [...imageList];
    while (fromConfig.length < 8) {
      fromConfig.push(galleryImages[fromConfig.length % galleryImages.length]);
    }
    return fromConfig.slice(0, 12);
  }
  return galleryImages;
}

export default function InstagramShowcase() {
  const [imageList, setImageList] = useState(null);
  /** Indices into pool for each of the 4 visible slots; initial: first 4 */
  const [displayedIndices, setDisplayedIndices] = useState([0, 1, 2, 3]);
  /** Which slot is currently fading out (0–3 or null) */
  const [fadingSlot, setFadingSlot] = useState(null);
  const poolRef = useRef(buildPool(null));
  const displayedIndicesRef = useRef([0, 1, 2, 3]);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const pool = useMemo(() => buildPool(imageList), [imageList]);
  displayedIndicesRef.current = displayedIndices;
  poolRef.current = pool;

  useEffect(() => {
    const docRef = getDocPath('config', CONFIG_DOC);
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        const data = snap.data();
        const urls = Array.isArray(data?.urls) ? data.urls : [];
        if (urls.length > 0) setImageList(urls);
        else setImageList(null);
      },
      () => setImageList(null)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (imageList !== null) return;
    fetch(STATIC_CONFIG_PATH)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((arr) => {
        if (Array.isArray(arr) && arr.length > 0) {
          setImageList(arr.map((filename) => `/instagram-showcase/${filename.trim()}`));
        } else setImageList([]);
      })
      .catch(() => setImageList([]));
  }, [imageList]);

  useEffect(() => {
    const len = pool.length;
    setDisplayedIndices((prev) => {
      const next = prev.map((idx) => (idx < len ? idx : 0));
      return next.every((n, i) => n === prev[i]) ? prev : next;
    });
  }, [pool.length]);

  useEffect(() => {
    if (pool.length < 2) return;

    intervalRef.current = setInterval(() => {
      const poolArr = poolRef.current;
      const current = displayedIndicesRef.current;
      const slot = Math.floor(Math.random() * 4);
      const displayedSet = new Set(current);
      const otherIndices = poolArr
        .map((_, i) => i)
        .filter((i) => !displayedSet.has(i));
      const candidates = otherIndices.length > 0 ? otherIndices : [...Array(poolArr.length).keys()];
      const newIdx = candidates[Math.floor(Math.random() * candidates.length)];

      setFadingSlot(slot);
      timeoutRef.current = setTimeout(() => {
        setDisplayedIndices((prev) => {
          const next = [...prev];
          next[slot] = newIdx;
          return next;
        });
        setFadingSlot(null);
      }, FADE_DURATION_MS);
    }, SWAP_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pool.length]);

  if (!INSTAGRAM_URL) return null;

  return (
    <section
      className="py-24"
      style={{ backgroundColor: 'var(--skin-cream)' }}
      id="instagram"
    >
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-stone-800 mb-2">
            {WEB_CONTENT.landing.sectionInstagram}
          </h2>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-sans tracking-widest uppercase text-stone-600 hover:text-[var(--skin-gold-dark)] transition-colors"
          >
            {INSTAGRAM_HANDLE}
          </a>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((slotIndex) => {
            const idx = displayedIndices[slotIndex] ?? 0;
            const src = pool[idx] ?? pool[0];
            const isFading = fadingSlot === slotIndex;
            return (
              <div
                key={slotIndex}
                className="relative aspect-square rounded-2xl overflow-hidden"
              >
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block absolute inset-0 cursor-pointer"
                  aria-label={`Instagram – příspěvek ${slotIndex + 1}`}
                >
                  <img
                    src={src}
                    alt={WEB_CONTENT.imageAlts.instagramGallery}
                    loading="lazy"
                    decoding="async"
                    className={`gallery-item absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-110 ${
                      isFading ? 'opacity-0' : 'opacity-100'
                    }`}
                    onError={(e) => {
                      e.target.src = galleryImages[0];
                    }}
                  />
                  <div
                    className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center z-20 pointer-events-none"
                    aria-hidden
                  >
                    <Instagram
                      size={40}
                      className="text-white"
                      strokeWidth={1.5}
                    />
                  </div>
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

```


--- SOUBOR: src/components/LandingPage.jsx ---
```javascript
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Heart, MapPin, Phone, Mail, Instagram, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import InstagramSection from './InstagramSection';
import SocialProofSection from './SocialProofSection';
import { INSTAGRAM_URL, GOOGLE_REVIEW_URL } from '../firebaseConfig';
import ServiceDescriptionMarkdown from './ServiceDescriptionMarkdown';
import { WEB_CONTENT } from '../constants/content';

function cleanDescription(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function LandingPage({ services = [] }) {
  const [expandedServiceId, setExpandedServiceId] = useState(null);

  useEffect(() => {
    const hash = window.location.hash?.slice(1);
    if (hash) {
      const el = document.getElementById(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, []);

  return (
    <>
      {/* Hero – Subtitle → Claim → Handwritten → CTA */}
      <section
        className="relative border-b overflow-hidden"
        style={{ backgroundColor: 'var(--skin-cream)', borderColor: 'var(--skin-beige-muted)' }}
      >
        <div className="max-w-4xl mx-auto px-4 pt-14 sm:pt-20 pb-14 sm:pb-20 text-center">
          <p className="text-xs sm:text-sm font-sans uppercase tracking-[0.2em] text-stone-600 mb-3">
            {WEB_CONTENT.hero.subtitle}
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl tracking-wide text-[var(--skin-charcoal)]">
            {WEB_CONTENT.hero.seoTitle}
          </h1>
          <div className="flex flex-col items-center mt-4">
            <p className="font-signature text-2xl sm:text-3xl text-stone-600 -rotate-2 mb-8" aria-hidden>
              {WEB_CONTENT.hero.signature}
            </p>
          </div>
          <p className="body-text text-sm sm:text-base max-w-xl mx-auto mt-4 mb-8 text-[#3d3730]">
            Odborná péče o pleť s <strong className="font-semibold">individuálním přístupem</strong> v <strong className="font-semibold">Uherském Brodě</strong>. Svěřte svou pleť do
            rukou profesionálky v příjemném a klidném prostředí.
          </p>
          <Link
            to="/rezervace"
            className="inline-flex items-center justify-center bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)]"
          >
            Objednat termín
          </Link>
        </div>
      </section>

      {/* O studiu / O Lucii */}
      <section
        id="o-nas"
        className="scroll-mt-20 py-20 sm:py-24"
        style={{ backgroundColor: 'var(--skin-cream-dark)' }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-display text-2xl font-bold mb-10 text-center text-[var(--skin-charcoal)]">
            {WEB_CONTENT.landing.sectionAbout}
          </h2>
          <div
            className="rounded-2xl p-8 sm:p-10 shadow-sm"
            style={{ backgroundColor: 'var(--skin-white)', border: '1px solid var(--skin-beige-muted)' }}
          >
            <div className="body-text text-left mb-8 text-[#2f2f2f] space-y-6" style={{ lineHeight: 1.7 }}>
              <p>
                Jmenuji se Lucie Metelková a kosmetika je pro mě víc než jen práce – je to spojení odbornosti, relaxace a preciznosti. Kladu absolutní důraz na čistotu, špičkové postupy a zdraví vaší pleti.
              </p>
              <p>
                V mém studiu v <strong className="font-semibold">Uherském Brodě</strong> nenajdete „pásovou výrobu“. Každá pleť je jedinečná, a proto je i každé mé ošetření 100% individuální. Ať už řešíme akné, vrásky, nebo jen toužíte po dokonalém obočí díky laminaci, mým cílem je, abyste odcházela nejen krásnější, ale i dokonale odpočatá.
              </p>
              <p>
                Zastavte se a dopřejte si svůj „Me Time“ okamžik v prostředí, kde se čas točí jen kolem vás.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 sm:gap-8 justify-start items-center border-t pt-8" style={{ borderColor: '#E5E5E5' }}>
              {[
                'Individuální přístup',
                'Kvalitní kosmetika',
                'Příjemné prostředí',
                'Odborná péče',
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 text-sm text-[#3d3730]"
                >
                  <Heart size={14} className="opacity-70 shrink-0" style={{ color: 'var(--skin-gold)' }} /> {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Procedury a ceník – Service Menu */}
      <section
        id="procedury"
        className="scroll-mt-20 py-20 sm:py-24 border-t border-stone-200"
        style={{ backgroundColor: '#fcfbf7' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-2 text-center text-stone-800">
            {WEB_CONTENT.landing.sectionServices}
          </h2>
          <p className="text-sm text-center mb-12 text-gray-500">
            Vyberte si ošetření a rezervujte termín on-line.
          </p>
          {services.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-500">Načítání procedur a ceníku…</div>
          ) : (
            <ul className="space-y-0">
              {services.map((s) => {
                const hasDescription = !!(s.description && cleanDescription(s.description));
                const isExpanded = expandedServiceId === s.id;

                return (
                  <li
                    key={s.id}
                    className="border-b last:border-b-0"
                    style={{ borderColor: '#E5E5E5' }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedServiceId((id) => (id === s.id ? null : s.id))}
                      className="w-full flex justify-between items-center text-left transition-colors hover:bg-stone-50/80 active:bg-stone-100/80 py-[20px]"
                    >
                      <span className="font-display text-lg sm:text-xl text-stone-800 font-semibold min-w-0 pr-4">
                        {s.name}
                      </span>
                      <div className="flex items-center shrink-0">
                        <span className="font-normal text-stone-700 tabular-nums text-right">
                          {s.price != null ? (s.isStartingPrice ? `od ${s.price} Kč` : `${s.price} Kč`) : '—'}
                        </span>
                        {hasDescription && (
                          <span className="ml-4 flex items-center justify-center text-stone-400 shrink-0">
                            {isExpanded ? (
                              <ChevronUp size={20} aria-hidden />
                            ) : (
                              <ChevronDown size={20} aria-hidden />
                            )}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Expandable description with smooth transition */}
                    <div
                      className="grid ease-out"
                      style={{
                        gridTemplateRows: isExpanded && hasDescription ? '1fr' : '0fr',
                        transition: 'grid-template-rows 0.3s ease, opacity 0.3s ease',
                      }}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div
                          className="pb-6 pt-0 px-0 transition-opacity duration-300 ease-out"
                          style={{ opacity: isExpanded && hasDescription ? 1 : 0 }}
                        >
                          {hasDescription && (
                            <>
                              <ServiceDescriptionMarkdown text={s.description} />
                              <Link
                                to={`/rezervace?service=${encodeURIComponent(s.id)}`}
                                className="mt-6 inline-flex items-center justify-center gap-2 bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)] focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2"
                              >
                                <Calendar size={16} /> Rezervovat termín
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="text-center mt-[48px]">
            <Link
              to="/rezervace"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)]"
            >
              <Calendar size={14} /> Rezervovat
            </Link>
          </div>
        </div>
      </section>

      {/* Recenze a Google – Social Proof */}
      <section id="recenze" className="scroll-mt-20">
        <SocialProofSection
          qrImageSrc="/Skinstudio_ggl_qr.png"
          googleReviewUrl={GOOGLE_REVIEW_URL}
          sectionTitle={WEB_CONTENT.landing.sectionReviews}
        />
      </section>

      {/* Footer – Kontakt + Sociální sítě */}
      <footer
        id="kontakt"
        className="scroll-mt-20 py-20 sm:py-24"
        style={{ backgroundColor: '#F9F7F2' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            {/* Left: Contact */}
            <div className="text-left">
              <h2 className="font-display text-2xl font-bold mb-6 text-[var(--skin-charcoal)]">
                {WEB_CONTENT.landing.sectionContact}
              </h2>
              <p className="text-sm text-[#6b6560] mb-6">Domluvte si termín návštěvy. Těším se na vás.</p>
              <ul className="space-y-4">
                <li>
                  <a
                    href="tel:+420724875558"
                    className="flex items-center gap-4 font-normal text-[var(--skin-charcoal)] hover:text-[var(--skin-gold-dark)] transition-colors"
                  >
                    <Phone size={20} className="shrink-0 text-[var(--skin-gold-dark)]" aria-hidden />
                    +420 724 875 558
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@skinstudio.cz"
                    className="flex items-center gap-4 font-normal text-[var(--skin-charcoal)] hover:text-[var(--skin-gold-dark)] transition-colors"
                  >
                    <Mail size={20} className="shrink-0 text-[var(--skin-gold-dark)]" aria-hidden />
                    info@skinstudio.cz
                  </a>
                </li>
                <li>
                  <div className="flex items-center gap-4 text-[var(--skin-charcoal)]">
                    <MapPin size={20} className="shrink-0 text-[var(--skin-gold-dark)]" aria-hidden />
                    <span className="text-sm">Uherský Brod</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Right: Socials & CTA */}
            <div className="text-left">
              <h2 className="font-display text-2xl font-bold mb-6 text-[var(--skin-charcoal)]">
                {WEB_CONTENT.kontakt.followHeading}
              </h2>
              {INSTAGRAM_URL && (
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-normal text-[var(--skin-charcoal)] hover:text-[var(--skin-gold-dark)] transition-colors mb-6"
                >
                  <Instagram size={20} className="shrink-0 text-[var(--skin-gold-dark)]" aria-hidden />
                  <span>Instagram @{INSTAGRAM_URL.replace(/\/$/, '').split('/').pop()}</span>
                  <ArrowRight size={18} className="shrink-0" />
                </a>
              )}
              <Link
                to="/rezervace"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 mt-2 shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)]"
              >
                <Calendar size={14} /> Objednat termín
              </Link>
            </div>
          </div>

          <InstagramSection embedOnly />

          <p className="text-center text-sm text-stone-400 mt-16 pt-8 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            © 2024 Skin Studio Lucie Metelková
          </p>
        </div>
      </footer>
    </>
  );
}

```


--- SOUBOR: src/components/Layout.jsx ---
```javascript
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MapPin, Mail, Phone } from 'lucide-react';
import { INSTAGRAM_URL } from '../firebaseConfig';
import InstagramShowcase from './InstagramShowcase';
import { TaglineWithHeart } from './FooterTagline';
import { WEB_CONTENT } from '../constants/content';

const getNav = () => {
  return [...WEB_CONTENT.header.navItems];
};
const NAV = getNav();

export default function Layout({ children, setView }) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (hash) => {
    if (!isHome) return;
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const navLinkTo = (item) => {
    if (item.hash) return isHome ? `#${item.hash}` : `/#${item.hash}`;
    return item.to;
  };

  const linkClass =
    'text-xs xl:text-sm font-semibold uppercase tracking-widest transition-colors text-stone-600 hover:text-[var(--skin-gold-dark)] whitespace-nowrap';
  const ctaClass =
    'bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 whitespace-nowrap shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)]';

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: 'var(--skin-cream)' }}>
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(253, 251, 247, 0.9)',
          borderColor: 'rgba(0,0,0,0.05)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16 gap-4">
          <Link
            to="/"
            className="font-display font-bold text-xl sm:text-2xl tracking-wide text-[var(--skin-charcoal)] hover:text-stone-700 transition-colors shrink-0"
            aria-label={WEB_CONTENT.header.ariaLabelHome}
          >
            {WEB_CONTENT.header.brandName}
          </Link>

          <nav className="hidden lg:flex items-center gap-3 xl:gap-4 shrink min-w-0">
            {NAV.map((item) => {
              if (item.hash) {
                if (item.to !== '/') {
                  return (
                    <Link key={item.label} to={item.to} className={linkClass}>
                      {item.label}
                    </Link>
                  );
                }
                return isHome ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => scrollTo(item.hash)}
                    className={linkClass}
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={item.label}
                    to={`/#${item.hash}`}
                    className={linkClass}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={item.cta ? ctaClass : linkClass}
                  onClick={item.to === '/rezervace' ? () => { setView?.('customer'); window.scrollTo(0, 0); } : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            className="lg:hidden p-2 text-stone-600 hover:text-[var(--skin-gold-dark)] transition-colors shrink-0"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={WEB_CONTENT.header.ariaLabelMenu}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div
            className="lg:hidden border-t px-4 py-3 flex flex-col gap-1"
            style={{
              backgroundColor: 'rgba(253, 251, 247, 0.98)',
              borderColor: 'rgba(0,0,0,0.05)',
            }}
          >
            {NAV.map((item) => {
              if (item.hash) {
                if (item.to !== '/') {
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="py-3 text-sm font-semibold uppercase tracking-widest text-stone-600 hover:text-[var(--skin-gold-dark)] transition-colors block"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                }
                return isHome ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => scrollTo(item.hash)}
                    className={`text-left py-3 text-sm font-semibold uppercase tracking-widest text-stone-600 hover:text-[var(--skin-gold-dark)] transition-colors`}
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={item.label}
                    to={`/#${item.hash}`}
                    className="py-3 text-sm font-semibold uppercase tracking-widest text-stone-600 hover:text-[var(--skin-gold-dark)] transition-colors block"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={item.cta ? `inline-flex ${ctaClass} justify-center my-1` : `py-3 text-sm font-semibold uppercase tracking-widest text-stone-600 hover:text-[var(--skin-gold-dark)] transition-colors block`}
                    onClick={() => {
                    setMenuOpen(false);
                    if (item.to === '/rezervace') { setView?.('customer'); window.scrollTo(0, 0); }
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <InstagramShowcase />

      <footer id="kontakt" className="mt-auto bg-[#1c1c1c] font-sans font-light text-gray-200">
        <div className="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Column 1: Brand & Info */}
          <div>
            <h3 className="text-white uppercase tracking-wide font-semibold text-sm mb-2">
              {WEB_CONTENT.footer.brandHeading}
            </h3>
            <p className="font-medium mb-2">{WEB_CONTENT.footer.ownerName}</p>
            <p className="text-sm leading-relaxed">
              <TaglineWithHeart tagline={WEB_CONTENT.footer.tagline} heartWord={WEB_CONTENT.footer.heartReplacementWord} />
            </p>
          </div>

          {/* Column 2: Kontakt */}
          <div className="md:text-right md:flex md:flex-col md:items-end">
            <h3 className="text-white uppercase tracking-wide font-semibold text-sm mb-4">
              {WEB_CONTENT.footer.contactHeading}
            </h3>
            <address className="not-italic space-y-2 text-sm">
              <p className="flex items-center gap-2 md:justify-end">
                <MapPin size={16} className="shrink-0 opacity-70" />
                {WEB_CONTENT.footer.location}
              </p>
              <p className="flex items-center gap-2 md:justify-end">
                <Mail size={16} className="shrink-0 opacity-70" />
                <a href={`mailto:${WEB_CONTENT.footer.email}`} className="hover:text-[#8C5E35] transition-colors">
                  {WEB_CONTENT.footer.email}
                </a>
              </p>
              <p className="flex items-center gap-2 md:justify-end">
                <Phone size={16} className="shrink-0 opacity-70" />
                <a href={`tel:${WEB_CONTENT.footer.phone.replace(/\s/g, '')}`} className="hover:text-[#8C5E35] transition-colors">
                  {WEB_CONTENT.footer.phone}
                </a>
              </p>
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700/60">
          <div className="container mx-auto px-6 py-4">
            <p className="text-xs text-center">
              {WEB_CONTENT.footer.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

```


--- SOUBOR: src/components/Layout.test.jsx ---
```javascript
/**
 * Testy Layout – navigace a odkaz Rezervace.
 * Klik na REZERVACE při použití setView (na stránce /rezervace) volá setView('customer'),
 * aby se po přihlášení do admina zobrazil rezervační formulář místo adminu.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Layout from './Layout';

vi.mock('../firebaseConfig', () => ({ INSTAGRAM_URL: '' }));
vi.mock('./InstagramShowcase', () => ({ default: () => null }));

const mockUseLocation = vi.fn(() => ({ pathname: '/rezervace' }));
vi.mock('react-router-dom', () => ({
  Link: ({ to, children, onClick, className, ...rest }) => (
    <a href={to} onClick={onClick} className={className} {...rest}>{children}</a>
  ),
  useLocation: () => mockUseLocation(),
}));

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders REZERVACE link', () => {
    render(<Layout><span>Content</span></Layout>);
    expect(screen.getByRole('link', { name: 'REZERVACE' })).toBeInTheDocument();
  });

  it('calls setView("customer") when REZERVACE link is clicked', () => {
    const setView = vi.fn();
    render(<Layout setView={setView}><span>Content</span></Layout>);
    const link = screen.getByRole('link', { name: 'REZERVACE' });
    fireEvent.click(link);
    expect(setView).toHaveBeenCalledWith('customer');
  });

  it('does not throw when setView is not provided and REZERVACE is clicked', () => {
    render(<Layout><span>Content</span></Layout>);
    const link = screen.getByRole('link', { name: 'REZERVACE' });
    expect(() => fireEvent.click(link)).not.toThrow();
  });

  it('when on Kosmetika page with setView, clicking REZERVACE calls setView("customer")', () => {
    mockUseLocation.mockReturnValueOnce({ pathname: '/kosmetika' });
    const setView = vi.fn();
    render(<Layout setView={setView}><span>Content</span></Layout>);
    const link = screen.getByRole('link', { name: 'REZERVACE' });
    fireEvent.click(link);
    expect(setView).toHaveBeenCalledWith('customer');
  });
});

```


--- SOUBOR: src/components/LazySection.jsx ---
```javascript
import React, { useState, useEffect, useRef } from 'react';

/**
 * Renders children only when the wrapper is in (or near) the viewport.
 * Use for heavy content (e.g. images, sliders) below the fold to speed up initial load.
 */
export default function LazySection({ children, rootMargin = '200px', className = '' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin, threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {visible ? children : <div className="min-h-[280px] md:min-h-[400px] animate-pulse bg-stone-100 rounded-xl" aria-hidden />}
    </div>
  );
}

```


--- SOUBOR: src/components/PMUPage.jsx ---
```javascript
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone, Mail, MapPin } from 'lucide-react';
import { query, where, onSnapshot } from 'firebase/firestore';
import { getCollectionPath } from '../firebaseConfig';
import { TRANSFORMATIONS_COLLECTION, PMU_CATEGORY } from '../constants/cosmetics';
import { WEB_CONTENT } from '../constants/content';
import ComparisonSlider from './ComparisonSlider';
import ReservationApp from './ReservationApp';
import { TaglineWithHeart } from './FooterTagline';

const CATEGORY_PMU = 'PMU';

/** Demo před/po slider, když v adminu ještě nic není */
const DEMO_SLIDER = {
  beforeImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
  afterImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
  altText: 'Ukázka před a po (demo)',
};

export default function PMUPage({ services = [], schedule = {}, reservations = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sliders, setSliders] = useState([]);
  const pmuCarouselRef = useRef(null);
  const [pmuActiveIndex, setPmuActiveIndex] = useState(0);

  const pmuServices = useMemo(
    () =>
      services
        .filter((s) => (s.category || 'STANDARD') === CATEGORY_PMU)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
    [services]
  );

  useEffect(() => {
    const colT = getCollectionPath(TRANSFORMATIONS_COLLECTION);
    const qT = query(colT, where('category', '==', PMU_CATEGORY));
    const unsub = onSnapshot(qT, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setSliders(list);
    });
    return () => unsub();
  }, []);

  const displaySliders = sliders.length > 0
    ? sliders.map((item) => ({
        beforeImage: item.imageBeforeUrl,
        afterImage: item.imageAfterUrl,
        altText: item.title || 'Před a po',
      }))
    : [DEMO_SLIDER];

  // Scroll to #pmu when landing on this page with hash (e.g. from main nav link)
  useEffect(() => {
    if (window.location.hash === '#pmu') {
      const el = document.getElementById('pmu');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Sync pagination dots with horizontal scroll position (mobile)
  useEffect(() => {
    const el = pmuCarouselRef.current;
    if (!el || displaySliders.length <= 1) return;
    const onScroll = () => {
      const itemWidth = el.offsetWidth * 0.85 + 24; /* 85vw + gap-6 */
      const index = Math.round(el.scrollLeft / itemWidth);
      const clamped = Math.min(Math.max(0, index), displaySliders.length - 1);
      setPmuActiveIndex(clamped);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [displaySliders.length]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div id="pmu" className="min-h-screen bg-[#0F0F0F] text-[#A1A1AA] font-sans antialiased">
      {/* Dark theme header – jako na main/produkci */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F0F]/80 backdrop-blur-md border-b border-white/5"
        aria-label="Navigace"
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <Link
            to="/"
            className="font-display font-bold text-xl tracking-wide text-white hover:text-[#C48F83] transition-colors shrink-0"
            aria-label="Skin Studio – Kosmetika"
          >
            Skin Studio
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83] transition-colors"
            >
              Kosmetika
            </Link>
            <button
              type="button"
              onClick={() => scrollTo('philosophy')}
              className="text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83] transition-colors"
            >
              Filozofie
            </button>
            <button
              type="button"
              onClick={() => scrollTo('portfolio')}
              className="text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83] transition-colors"
            >
              Portfolio
            </button>
            <button
              type="button"
              onClick={() => scrollTo('cenik')}
              className="text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83] transition-colors"
            >
              Ceník
            </button>
            <button
              type="button"
              onClick={() => scrollTo('rezervace-pmu')}
              className="text-sm font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full bg-[#C48F83] text-white hover:bg-[#C48F83]/90 hover:scale-[1.01] transition-all"
            >
              Rezervace
            </button>
          </nav>

          <button
            type="button"
            className="md:hidden p-2 text-white hover:text-[#C48F83] transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-white/5 px-4 py-4 flex flex-col gap-1 bg-[#0F0F0F]">
            <Link
              to="/"
              className="py-3 text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83]"
              onClick={() => setMenuOpen(false)}
            >
              Kosmetika
            </Link>
            <button
              type="button"
              onClick={() => scrollTo('philosophy')}
              className="text-left py-3 text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83]"
            >
              Filozofie
            </button>
            <button
              type="button"
              onClick={() => scrollTo('portfolio')}
              className="text-left py-3 text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83]"
            >
              Portfolio
            </button>
            <button
              type="button"
              onClick={() => scrollTo('cenik')}
              className="text-left py-3 text-sm font-semibold uppercase tracking-widest text-white/90 hover:text-[#C48F83]"
            >
              Ceník
            </button>
            <button
              type="button"
              onClick={() => { scrollTo('rezervace-pmu'); setMenuOpen(false); }}
              className="inline-flex justify-center py-3 mt-2 text-sm font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full bg-[#C48F83] text-white hover:bg-[#C48F83]/90 hover:scale-[1.01] transition-all"
            >
              Rezervace
            </button>
          </div>
        )}
      </header>

      <main>
        {/* Hero – full-screen, jako na main */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-16 text-center">
          <p className="font-display text-[#C48F83] text-sm uppercase tracking-[0.3em] mb-6">
            Permanent Make-Up
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight max-w-3xl">
            Umění trvalé krásy
          </h1>
          <p className="mt-8 text-[#A1A1AA] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Precizní linky. Přirozený výsledek. Výjimečný zážitek.
          </p>
          <button
            type="button"
            onClick={() => scrollTo('rezervace-pmu')}
            className="mt-12 inline-flex items-center justify-center px-8 py-4 font-semibold uppercase text-[10px] tracking-[0.2em] rounded-full bg-[#C48F83] text-white hover:bg-[#C48F83]/90 hover:scale-[1.01] transition-all"
          >
            Objednat konzultaci
          </button>
        </section>

        {/* Filozofie – text-left, heading centered, max-w-2xl */}
        <section
          id="philosophy"
          className="scroll-mt-24 py-24 sm:py-32 px-4"
        >
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white mb-8 text-center">
              Filozofie
            </h2>
            <div className="text-left">
              <h3 className="text-xl font-display text-white mb-4">Jemnost, která zůstává</h3>
              <p className="mt-4 text-[#A1A1AA] leading-relaxed">
                Permanentní make-up vnímám jako neviditelného pomocníka. Jeho úkolem není přebít vaši tvář, ale tiše podtrhnout to, co je na ní krásné.
              </p>
              <p className="mt-4 text-[#A1A1AA]/80 leading-relaxed">
                Pracuji tak, aby výsledek působil vzdušně a přirozeně. Cílem je, abyste se ráno probudila s pocitem, že jste upravená, ale stále jste to vy.
              </p>
            </div>
          </div>
        </section>

        {/* Portfolio – před/po slidery (nový aspect ratio v ComparisonSlider), data z Fotografie → Proměny PMU */}
        <section
          id="portfolio"
          className="scroll-mt-24 py-24 sm:py-32 px-4"
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white text-center mb-16">
              Portfolio
            </h2>
            <div
              ref={pmuCarouselRef}
              className="transformations-scroll flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory px-4 -mx-4 md:mx-0 md:px-0 min-h-[320px]"
            >
              <div id="carousel-track" className="flex gap-6 flex-shrink-0">
                {displaySliders.map((item, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[85vw] md:w-[400px] snap-center flex flex-col space-y-4"
                  >
                    <ComparisonSlider
                      beforeImage={item.beforeImage}
                      afterImage={item.afterImage}
                      altText={item.altText}
                      theme="dark"
                    />
                    {sliders.length === 0 && (
                      <p className="text-center text-[#A1A1AA]/60 text-sm mt-4">
                        Demo – vlastní před/po přidáte v adminu v záložce Fotografie → Proměny (kategorie PMU).
                      </p>
                    )}
                    <div className="mobile-carousel-swipe-zone md:hidden pb-2 flex-shrink-0" aria-hidden />
                  </div>
                ))}
              </div>
            </div>
            {displaySliders.length >= 1 && (
              <div className="carousel-dots md:hidden" role="tablist" aria-label="PMU proměny">
                {displaySliders.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-label={`Proměna ${i + 1}`}
                    aria-selected={pmuActiveIndex === i}
                    onClick={() => {
                      const el = pmuCarouselRef.current;
                      if (!el) return;
                      const itemWidth = el.offsetWidth * 0.85 + 24; /* 85vw + gap-6 */
                      el.scrollTo({ left: i * itemWidth, behavior: 'smooth' });
                    }}
                    className={`dot ${pmuActiveIndex === i ? 'dot-active' : ''}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Ceník a rezervace – dark card jako na main */}
        <section
          id="cenik"
          className="scroll-mt-24 py-24 sm:py-32 px-4"
        >
          <div className="max-w-xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white text-center mb-12">
              Ceník a rezervace
            </h2>
            <div className="bg-white/5 rounded-2xl p-8 sm:p-10 transition-colors duration-300 hover:bg-white/10">
              <ul className="space-y-0 text-[#A1A1AA]">
                {pmuServices.length === 0 ? (
                  <li className="py-6 text-center text-[#A1A1AA]/80 text-sm">
                    Služby se připravují…
                  </li>
                ) : (
                  pmuServices.map((service, index) => {
                    const isLast = index === pmuServices.length - 1;
                    const priceText =
                      service.price == null || service.price === 0
                        ? 'dle ceníku'
                        : `${Number(service.price)} Kč`;
                    return (
                      <li
                        key={service.id}
                        className={`flex justify-between items-baseline py-4 px-3 -mx-3 rounded-lg transition-colors duration-300 hover:bg-white/5 ${!isLast ? 'border-b border-white/5' : ''}`}
                      >
                        <span>{service.name}</span>
                        <span className="font-display text-[#C48F83] font-medium">{priceText}</span>
                      </li>
                    );
                  })
                )}
              </ul>
              <p className="mt-8 text-[#A1A1AA]/70 text-sm text-center">
                Přesné ceny a termíny vám sdělíme při rezervaci nebo na konzultaci.
              </p>
              <button
                type="button"
                onClick={() => scrollTo('rezervace-pmu')}
                className="mt-8 w-full inline-flex items-center justify-center py-4 font-semibold uppercase text-[10px] tracking-[0.2em] rounded-full text-white transition-all bg-[#C48F83] hover:bg-[#C48F83]/90 hover:scale-[1.01]"
              >
                Rezervovat termín
              </button>
            </div>
          </div>
        </section>

        {/* Rezervační widget – dark mode jako na main */}
        <section id="rezervace-pmu" className="scroll-mt-24 py-24 sm:py-32 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white text-center mb-12">
              Rezervace PMU
            </h2>
            <ReservationApp
              loading={false}
              view="customer"
              setView={() => {}}
              adminPassword=""
              setAdminPassword={() => {}}
              loginError=""
              setLoginError={() => {}}
              handleLogoClick={() => {}}
              handleLogin={() => {}}
              services={pmuServices}
              schedule={schedule}
              schedulePmu={schedule}
              reservations={reservations}
              widgetOnly
              mode="dark"
            />
          </div>
        </section>
      </main>

      {/* Footer – stejná struktura jako kosmetika (Layout), dark theme */}
      <footer id="kontakt" className="mt-auto border-t border-white/5 bg-[#0F0F0F] font-sans font-light text-gray-200">
        <div className="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-white uppercase tracking-wide font-semibold text-sm mb-2">
              {WEB_CONTENT.footer.brandHeading}
            </h3>
            <p className="font-medium mb-2 text-[#A1A1AA]">{WEB_CONTENT.footer.ownerName}</p>
            <p className="text-sm leading-relaxed text-[#A1A1AA]/90">
              <TaglineWithHeart tagline={WEB_CONTENT.footer.tagline} heartWord={WEB_CONTENT.footer.heartReplacementWord} />
            </p>
          </div>
          <div className="md:text-right md:flex md:flex-col md:items-end">
            <h3 className="text-white uppercase tracking-wide font-semibold text-sm mb-4">
              {WEB_CONTENT.footer.contactHeading}
            </h3>
            <address className="not-italic space-y-2 text-sm text-[#A1A1AA]">
              <p className="flex items-center gap-2 md:justify-end">
                <MapPin size={16} className="shrink-0 text-[#C48F83]" aria-hidden />
                {WEB_CONTENT.footer.location}
              </p>
              <p className="flex items-center gap-2 md:justify-end">
                <Mail size={16} className="shrink-0 text-[#C48F83]" aria-hidden />
                <a href={`mailto:${WEB_CONTENT.footer.email}`} className="hover:text-[#C48F83] transition-colors">
                  {WEB_CONTENT.footer.email}
                </a>
              </p>
              <p className="flex items-center gap-2 md:justify-end">
                <Phone size={16} className="shrink-0 text-[#C48F83]" aria-hidden />
                <a href={`tel:${WEB_CONTENT.footer.phone.replace(/\s/g, '')}`} className="hover:text-[#C48F83] transition-colors">
                  {WEB_CONTENT.footer.phone}
                </a>
              </p>
            </address>
          </div>
        </div>
        <div className="border-t border-white/5">
          <div className="container mx-auto px-6 py-4">
            <p className="text-xs text-center text-[#A1A1AA]/60">
              {WEB_CONTENT.footer.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

```


--- SOUBOR: src/components/ReservationApp.jsx ---
```javascript
import React from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import CustomerView from './CustomerView';
import AdminView from './AdminView';

export default function ReservationApp({
  loading,
  view,
  setView,
  adminPassword,
  setAdminPassword,
  loginError,
  setLoginError,
  handleLogoClick,
  handleLogin,
  services,
  schedule,
  schedulePmu = {},
  reservations,
  addons = [],
  serviceAddonLinks = [],
  widgetOnly = false,
  mode = 'light',
}) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialServiceId = searchParams.get('service') || null;
  // PMU page must always use dark widget (bg-stone-950, rose gold accents)
  const isPmuRoute = widgetOnly && location.pathname === '/pmu';
  const isDark = mode === 'dark' || isPmuRoute;
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-stone-400" size={32} />
      </div>
    );
  }

  const cardClass = isDark
    ? 'rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 shadow-xl'
    : 'rounded-xl sm:rounded-2xl shadow-lg overflow-hidden';
  const cardStyle = isDark ? {} : { backgroundColor: 'var(--skin-white)', border: '1px solid var(--skin-beige-muted)' };
  const innerClass = isDark ? 'p-4 sm:p-8 bg-stone-950' : 'p-4 sm:p-10 bg-white';

  if (widgetOnly) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6">
        <div className={cardClass} style={cardStyle}>
          <div className={innerClass}>
            <CustomerView
              services={services}
              schedule={schedule}
              schedulePmu={schedulePmu}
              reservations={reservations}
              initialServiceId={initialServiceId}
              theme={isDark ? 'dark' : 'light'}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8">
      <div className={cardClass} style={cardStyle}>
        {/* Banner – typografické logo */}
        <div
          className="w-full border-b py-6 sm:py-8 cursor-default select-none active:opacity-95 transition-opacity text-center"
          style={{ borderColor: 'var(--skin-beige-muted)', backgroundColor: 'var(--skin-cream)' }}
          onClick={handleLogoClick}
          onKeyDown={(e) => e.key === 'Enter' && handleLogoClick()}
          role="button"
          tabIndex={0}
          aria-label="Logo"
        >
          <span className="font-display font-bold text-2xl sm:text-3xl tracking-wide text-[var(--skin-charcoal)]">
            Skin Studio
          </span>
        </div>

        <div className={innerClass}>
          {view === 'customer' && (
            <CustomerView
              services={services}
              schedule={schedule}
              schedulePmu={schedulePmu}
              reservations={reservations}
              initialServiceId={initialServiceId}
            />
          )}

          {view === 'login' && (
            <div className="max-w-sm mx-auto py-16 sm:py-20 text-center animate-in zoom-in">
              <Lock className="mx-auto mb-4 text-stone-200" size={48} />
              <h2 className="font-display text-2xl mb-6 text-stone-800 font-bold">Admin Vstup</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  autoFocus
                  type="password"
                  placeholder="Heslo"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full p-4 rounded-xl border border-stone-200 text-center text-lg outline-none focus:ring-1 focus:ring-stone-400"
                />
                {loginError && (
                  <p className="text-red-500 text-xs font-bold animate-pulse">{loginError}</p>
                )}
                <button
                  type="submit"
                  className="w-full bg-stone-800 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all"
                >
                  Přihlásit
                </button>
                <button
                  type="button"
                  onClick={() => setView('customer')}
                  className="text-xs text-stone-400 hover:underline"
                >
                  Zpět na web
                </button>
              </form>
            </div>
          )}

          {view === 'admin' && (
            <AdminView
              services={services}
              schedule={schedule}
              schedulePmu={schedulePmu}
              reservations={reservations}
              addons={addons}
              serviceAddonLinks={serviceAddonLinks}
              onLogout={() => {
                setView('customer');
                setAdminPassword('');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

```


--- SOUBOR: src/components/ReservationApp.test.jsx ---
```javascript
/**
 * Testy komponenty ReservationApp – kontejner rezervací (customer / login / admin).
 * Testuje: výchozí view, přihlašovací formulář, widgetOnly režim, že na rezervaci (kosmetika) neproniknou PMU služby.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { filterCosmeticsServices } from '../utils/helpers';
import ReservationApp from './ReservationApp';

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(''), vi.fn()],
  useLocation: () => ({ pathname: '/rezervace' }),
}));

const defaultServices = [
  { id: 's1', name: 'Masáž', duration: 60, price: 800 },
];

const defaultSchedule = {
  '09-02-2026': { periods: [{ start: '09:00', end: '17:00' }] },
};

const renderApp = (props = {}) => {
  return render(<ReservationApp {...props} />);
};

describe('ReservationApp', () => {
  const defaultProps = {
    loading: false,
    view: 'customer',
    setView: vi.fn(),
    adminPassword: '',
    setAdminPassword: vi.fn(),
    loginError: '',
    setLoginError: vi.fn(),
    handleLogoClick: vi.fn(),
    handleLogin: vi.fn(),
    services: defaultServices,
    schedule: defaultSchedule,
    reservations: [],
    addons: [],
    serviceAddonLinks: [],
  };

  // Výchozí view=customer: logo „Skin Studio“ a seznam služeb (CustomerView).
  it('renders customer view by default', () => {
    renderApp(defaultProps);
    expect(screen.getByText('Skin Studio')).toBeInTheDocument();
    expect(screen.getByText('Masáž')).toBeInTheDocument();
  });

  // view=login: zobrazení formuláře Admin Vstup (heslo, Přihlásit, Zpět na web).
  it('shows login form when view is login', () => {
    renderApp({ ...defaultProps, view: 'login' });
    expect(screen.getByText('Admin Vstup')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Heslo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Přihlásit/ })).toBeInTheDocument();
    expect(screen.getByText('Zpět na web')).toBeInTheDocument();
  });

  // Odeslání přihlašovacího formuláře volá handleLogin.
  it('calls handleLogin on login form submit', () => {
    const handleLogin = vi.fn((e) => e.preventDefault());
    renderApp({
      ...defaultProps,
      view: 'login',
      adminPassword: 'xxx',
      handleLogin,
    });
    fireEvent.submit(screen.getByRole('button', { name: /Přihlásit/ }).closest('form'));
    expect(handleLogin).toHaveBeenCalled();
  });

  // Klik na „Zpět na web“ volá setView('customer').
  it('calls setView when "Zpět na web" is clicked', () => {
    const setView = vi.fn();
    renderApp({ ...defaultProps, view: 'login', setView });
    fireEvent.click(screen.getByText('Zpět na web'));
    expect(setView).toHaveBeenCalledWith('customer');
  });

  // loading=true: zobrazí se loading spinner (animate-spin).
  it('shows loading spinner when loading is true', () => {
    renderApp({ ...defaultProps, loading: true });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // widgetOnly: pouze CustomerView, bez banneru „Skin Studio“ (např. pro embed na /pmu).
  it('widgetOnly mode renders CustomerView without logo banner', () => {
    renderApp({ ...defaultProps, widgetOnly: true });
    expect(screen.getByText('Masáž')).toBeInTheDocument();
    expect(screen.queryByText('Skin Studio')).not.toBeInTheDocument();
  });

  // widgetOnly: služby z props se předají do CustomerView a zobrazí se.
  it('renders CustomerView with services in widgetOnly', () => {
    renderApp({ ...defaultProps, widgetOnly: true });
    expect(screen.getByText('Masáž')).toBeInTheDocument();
  });

  // Rezervace (kosmetika): když se předají jen služby filtrované na STANDARD, PMU služba se nezobrazí.
  it('does not show PMU services when passed only cosmetics (STANDARD) services', () => {
    const mixedServices = [
      { id: 'c1', name: 'Čištění pleti', category: 'STANDARD', duration: 30, price: 500 },
      { id: 'p1', name: 'PMU obočí', category: 'PMU', duration: 120, price: 3000 },
    ];
    const cosmeticsOnly = filterCosmeticsServices(mixedServices);
    expect(cosmeticsOnly).toHaveLength(1);
    expect(cosmeticsOnly[0].name).toBe('Čištění pleti');

    renderApp({
      ...defaultProps,
      services: cosmeticsOnly,
      schedule: defaultSchedule,
    });
    expect(screen.getByText('Čištění pleti')).toBeInTheDocument();
    expect(screen.queryByText('PMU obočí')).not.toBeInTheDocument();
  });
});

```


--- SOUBOR: src/components/ServiceDescriptionMarkdown.jsx ---
```javascript
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

/**
 * Renders service description as Markdown (bold, lists, etc.).
 * Cleans parenthetical meta-commentary before rendering.
 */
function cleanDescription(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

const ROSE_ACCENT = '#daa59c';

function getMarkdownComponents(theme) {
  const isDark = theme === 'dark';
  const accentClass = isDark ? 'font-semibold' : 'font-semibold text-[var(--skin-gold)]';
  const accentStyle = isDark ? { color: ROSE_ACCENT } : undefined;
  return {
    p: ({ node, children, ...props }) => <p className="mb-3 last:mb-0" {...props}>{children}</p>,
    strong: ({ node, children, ...props }) => (
      <span className={accentClass} style={accentStyle} {...props}>{children}</span>
    ),
    ul: ({ node, children, ...props }) => (
      <ul className="list-disc pl-5 space-y-2 my-3" {...props}>{children}</ul>
    ),
    ol: ({ node, children, ...props }) => (
      <ol className="list-decimal pl-5 space-y-2 my-3" {...props}>{children}</ol>
    ),
    li: ({ node, children, ...props }) => <li className="pl-1" {...props}>{children}</li>,
  };
}

export default function ServiceDescriptionMarkdown({ text, className = '', theme = 'light' }) {
  const cleaned = cleanDescription(text);
  if (!cleaned) return null;
  const components = getMarkdownComponents(theme);
  const wrapperClass =
    theme === 'dark'
      ? `text-sm text-[#A1A1AA] leading-relaxed max-w-[65ch] ${className}`
      : `text-sm text-stone-500 leading-relaxed max-w-[65ch] ${className}`;
  return (
    <div className={wrapperClass}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]} components={components}>{cleaned}</ReactMarkdown>
    </div>
  );
}

```


--- SOUBOR: src/components/ServiceListAccordion.jsx ---
```javascript
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import ServiceDescriptionMarkdown from './ServiceDescriptionMarkdown';

/** Remove parenthetical meta-commentary from description text. */
function cleanDescription(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ROSE_ACCENT = '#daa59c';
const BORDER_DARK = 'rgba(255,255,255,0.08)';

/**
 * Unified expandable service list (accordion) for Cosmetics (light) and PMU (dark) sections.
 * @param {Object} props
 * @param {Array} props.services - List of { id, name, price, description }
 * @param {'light'|'dark'} props.variant - Light = gold accents; dark = rose gold on dark bg
 * @param {string} props.loadingText - Shown when services.length === 0
 * @param {string} props.ctaReservovat - Button label (e.g. "Rezervovat termín")
 * @param {string} [props.ctaReservovatShort] - Optional short CTA for footer button
 * @param {string} [props.priceNote] - Optional note below list (e.g. PMU "dle ceníku")
 * @param {(service: Object) => string} props.getReserveHref - (s) => url for reserve button
 * @param {string} [props.footerHref] - Optional href for footer CTA (if omitted, no footer button)
 */
export default function ServiceListAccordion({
  services = [],
  variant = 'light',
  loadingText = 'Načítání…',
  ctaReservovat,
  ctaReservovatShort,
  priceNote,
  getReserveHref,
  footerHref,
}) {
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const isDark = variant === 'dark';

  const borderColor = isDark ? BORDER_DARK : '#E5E5E5';
  const titleClass = isDark
    ? 'font-display text-lg sm:text-xl font-semibold text-white min-w-0 pr-4'
    : 'font-display text-lg sm:text-xl text-stone-800 font-semibold min-w-0 pr-4';
  const priceClass = isDark
    ? `font-normal tabular-nums text-right font-medium`
    : 'font-normal text-stone-700 tabular-nums text-right';
  const priceStyle = isDark ? { color: ROSE_ACCENT } : undefined;
  const rowHoverClass = isDark
    ? 'hover:bg-white/5 active:bg-white/10'
    : 'hover:bg-stone-50/80 active:bg-stone-100/80';
  const chevronClass = isDark ? 'text-white/50' : 'text-stone-400';

  if (services.length === 0) {
    return (
      <div className={isDark ? 'text-center py-12 text-[#A1A1AA]/80 text-sm' : 'text-center py-12 text-sm text-gray-500'}>
        {loadingText}
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-0" style={{ borderColor }}>
        {services.map((s) => {
          const hasDescription = !!(s.description && cleanDescription(s.description));
          const isExpanded = expandedServiceId === s.id;
          const priceText =
            s.price != null && s.price !== 0
              ? (s.isStartingPrice ? `od ${Number(s.price)} Kč` : `${Number(s.price)} Kč`)
              : (isDark ? 'dle ceníku' : '—');
          return (
            <li
              key={s.id}
              className={isDark ? 'border-b last:border-b-0 border-white/5' : ''}
              style={!isDark ? { borderColor } : undefined}
            >
              <button
                type="button"
                onClick={() => setExpandedServiceId((id) => (id === s.id ? null : s.id))}
                className={`w-full flex justify-between items-center text-left transition-colors py-[20px] ${rowHoverClass} ${isDark ? 'px-0' : ''}`}
              >
                <span className={titleClass}>{s.name}</span>
                <div className="flex items-center shrink-0">
                  <span className={priceClass} style={priceStyle}>
                    {priceText}
                  </span>
                  {hasDescription && (
                    <span className={`ml-4 flex items-center justify-center shrink-0 ${chevronClass}`}>
                      {isExpanded ? <ChevronUp size={20} aria-hidden /> : <ChevronDown size={20} aria-hidden />}
                    </span>
                  )}
                </div>
              </button>
              <div
                className="grid ease-out"
                style={{
                  gridTemplateRows: isExpanded && hasDescription ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.3s ease, opacity 0.3s ease',
                }}
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    className="pb-6 pt-0 px-0 transition-opacity duration-300 ease-out"
                    style={{ opacity: isExpanded && hasDescription ? 1 : 0 }}
                  >
                    {hasDescription && (
                      <>
                        <ServiceDescriptionMarkdown text={s.description} theme={isDark ? 'dark' : 'light'} />
                        {getReserveHref ? (
                          <Link
                            to={getReserveHref(s)}
                            className={
                              isDark
                                ? 'mt-6 inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 font-sans font-semibold text-xs uppercase tracking-widest text-white transition-all duration-300 hover:brightness-95 border border-[#D49A91]/20 focus:outline-none focus:ring-2 focus:ring-[#daa59c] focus:ring-offset-2 focus:ring-offset-[#0F0F0F]'
                                : 'mt-6 inline-flex items-center justify-center gap-2 bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)] focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2'
                            }
                            style={
                              isDark
                                ? {
                                    background: 'linear-gradient(to bottom, #B37E76, #D49A91, #B37E76)',
                                    boxShadow: '0 4px 20px rgba(179,126,118,0.3)',
                                  }
                                : undefined
                            }
                          >
                            <Calendar size={16} /> {ctaReservovat}
                          </Link>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {priceNote && (
        <p className={`mt-6 text-center text-sm ${isDark ? 'text-[#A1A1AA]/70' : 'text-gray-500'}`}>
          {priceNote}
        </p>
      )}
      {footerHref && ctaReservovatShort && (
        <div className="text-center mt-8">
          <Link
            to={footerHref}
            className={
              isDark
                ? 'inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 font-sans font-semibold text-xs uppercase tracking-widest text-white transition-all duration-300 hover:brightness-95 border border-[#D49A91]/20'
                : 'inline-flex items-center justify-center gap-2 bg-gradient-to-b from-[#dec89a] to-[#b08d55] hover:brightness-95 border-t border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-widest rounded-full px-8 py-3 transition-all duration-300 shadow-[0_4px_20px_rgba(197,165,114,0.3)] hover:shadow-[0_6px_25px_rgba(197,165,114,0.5)]'
            }
            style={
              isDark
                ? {
                    background: 'linear-gradient(to bottom, #B37E76, #D49A91, #B37E76)',
                    boxShadow: '0 4px 20px rgba(179,126,118,0.3)',
                  }
                : undefined
            }
          >
            <Calendar size={14} /> {ctaReservovatShort}
          </Link>
        </div>
      )}
    </>
  );
}

```


--- SOUBOR: src/components/SocialProofSection.jsx ---
```javascript
import React from 'react';
import { Star, ExternalLink, Heart } from 'lucide-react';

const MOCK_REVIEWS = [
  {
    id: 1,
    name: 'Martina K.',
    roleOrDate: 'Klientka, leden 2025',
    rating: 5,
    text: 'Skvělá péče o pleť, profesionální přístup a příjemné prostředí. Lucie mi pomohla s problematickou pletí a výsledek předčil očekávání. Určitě doporučuji.',
  },
  {
    id: 2,
    name: 'Jana V.',
    roleOrDate: 'Pravidelná zákaznice',
    rating: 5,
    text: 'Nejlepší kosmetika v okolí. Individuální přístup, čistota na prvním místě a vždy odcházím odpočatá a spokojená. Děkuji za každé ošetření.',
  },
  {
    id: 3,
    name: 'Petra S.',
    roleOrDate: 'První návštěva, únor 2025',
    rating: 5,
    text: 'Perfektní laminace obočí a milé přijetí. Studio je útulné, Lucie je velmi vstřícná a odborně mi vše vysvětlila. Už mám objednaný další termín.',
  },
];

function ReviewCard({ name, roleOrDate, rating, text }) {
  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className="w-5 h-5 shrink-0"
            fill={i < rating ? '#EAB308' : 'transparent'}
            stroke={i < rating ? '#EAB308' : '#d1d5db'}
            strokeWidth={1.5}
          />
        ))}
      </div>
      <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">{text}</p>
      <div>
        <p className="font-semibold text-gray-900">{name}</p>
        <p className="text-sm text-gray-500">{roleOrDate}</p>
      </div>
    </article>
  );
}

/** Google "G" logo – minimal multicolor SVG for trust/branding */
function GoogleGIcon({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const SKIN_STUDIO_GOOGLE_REVIEW_URL = 'https://g.page/r/CWkt9xHMgMjqEAE/review';

function ActionCard({ qrImageSrc = '/Skinstudio_ggl_qr.png', googleReviewUrl = SKIN_STUDIO_GOOGLE_REVIEW_URL }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 mb-4">
        <GoogleGIcon className="w-6 h-6 shrink-0" />
        <h3 className="font-bold text-gray-900 text-lg">Byla jste s péčí spokojená?</h3>
      </div>
      {/* Desktop only: QR code (clickable) */}
      <div className="hidden md:flex flex-1 flex-col justify-center min-h-0">
        <div className="flex justify-center">
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer w-fit rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Přejít na Google Recenze"
          >
            <div className="bg-white border border-gray-100 rounded-xl p-4 inline-block shadow-sm w-fit hover:border-gray-200 transition-colors">
              <img
                src={qrImageSrc}
                alt="QR kód pro Google Recenze – Skin Studio kosmetika Uherský Brod"
                className="w-40 h-40 object-contain pointer-events-none"
                width={160}
                height={160}
                loading="lazy"
              />
            </div>
          </a>
        </div>
      </div>
      {/* Body + signature: visible on all screen sizes, centered */}
      <div className="flex flex-col items-center text-center md:mt-3">
        <p className="text-sm text-gray-600 mb-2">
          Budu moc ráda za vaše hodnocení. Vaše zpětná vazba mi pomáhá se zlepšovat.
        </p>
        <p className="font-signature text-xl text-gray-700 flex items-center justify-center gap-2 mb-4 md:mb-0" aria-hidden>
          Vaše Lucie
          <Heart className="w-4 h-4 shrink-0 stroke-[#E57590] fill-none" strokeWidth={1.5} aria-hidden />
        </p>
        {/* Desktop: text link */}
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-block mt-4 text-sm underline decoration-gray-400 underline-offset-4 text-slate-500 hover:text-black transition-colors"
        >
          Napsat recenzi online
        </a>
      </div>
      {/* Mobile only: full-width CTA button */}
      <div className="md:hidden mt-4">
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-black text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          Napsat recenzi na Google
          <ExternalLink className="w-4 h-4 shrink-0" />
        </a>
      </div>
    </div>
  );
}

export default function SocialProofSection({
  qrImageSrc = '/Skinstudio_ggl_qr.png',
  googleReviewUrl,
  reviews = MOCK_REVIEWS,
  sectionTitle = 'Recenze klientek ze Skin Studia',
}) {
  const reviewUrl = googleReviewUrl && googleReviewUrl.trim() ? googleReviewUrl.trim() : SKIN_STUDIO_GOOGLE_REVIEW_URL;
  return (
    <section className="bg-gray-50 py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-gray-900 mb-8 text-center">
          {sectionTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 md:gap-8 items-stretch">
          {/* Left: review cards — stretch to match row height */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-w-0 auto-rows-fr h-full min-h-0">
            {reviews.map((r) => (
              <ReviewCard
                key={r.id}
                name={r.name}
                roleOrDate={r.roleOrDate}
                rating={r.rating}
                text={r.text}
              />
            ))}
          </div>
          {/* Right: action card (fixed width on desktop); equal height, content centered */}
          <div className="w-full md:w-[320px] md:shrink-0 h-full min-h-0 flex">
            <ActionCard qrImageSrc={qrImageSrc} googleReviewUrl={reviewUrl} />
          </div>
        </div>
      </div>
    </section>
  );
}

```


--- SOUBOR: src/components/UpsellChip.jsx ---
```javascript
import React, { useState, useCallback } from 'react';

/**
 * Reusable Selection Chip for upsell services.
 * Pill-shaped, premium feel with idle/hover/selected states and micro-interaction.
 *
 * @param {Object} service - { name: string, price: number | string } (price shown is the discounted price)
 * @param {boolean} [selected] - Controlled selected state (optional; component is uncontrolled if omitted)
 * @param {function} onToggle - (isActive: boolean) => void — called when selection changes
 * @param {function} [onSelect] - Optional (service, isActive) => void for convenience
 */
const UpsellChip = ({ service, selected: controlledSelected, onToggle, onSelect }) => {
  const [internalSelected, setInternalSelected] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const isControlled = controlledSelected !== undefined;
  const selected = isControlled ? controlledSelected : internalSelected;

  const handleClick = useCallback(() => {
    const next = !selected;
    if (!isControlled) setInternalSelected(next);
    onToggle?.(next);
    onSelect?.(service, next);
    // Micro-interaction: brief scale feedback
    setIsPressed(true);
    const t = setTimeout(() => setIsPressed(false), 120);
    return () => clearTimeout(t);
  }, [selected, isControlled, service, onToggle, onSelect]);

  const priceDisplay = service.price != null ? (service.isStartingPrice ? `od ${service.price} Kč` : `${service.price} Kč`) : '';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wide
        transition-all duration-200 ease-out
        select-none
        ${selected
          ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
          : 'border-[#E5E5E5] bg-transparent text-[#666] hover:border-[#CCC] hover:bg-[#F5F5F5]'
        }
        ${isPressed ? 'scale-95' : 'scale-100'}
      `}
      style={{ transitionProperty: 'background-color, border-color, color, transform' }}
    >
      {selected ? (
        <>✓ {service.name} added</>
      ) : (
        <>+ Add {service.name} for {priceDisplay}</>
      )}
    </button>
  );
};

export default UpsellChip;

```


--- SOUBOR: src/components/admin/AdminAddonsTab.jsx ---
```javascript
import React, { useState } from 'react';
import { Package, Edit2, Trash2 } from 'lucide-react';
import { addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getCollectionPath, getDocPath } from '../../firebaseConfig';

const AdminAddonsTab = ({ addons, onAddonsChange }) => {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    default_price: '',
    is_active: true,
    price_behavior: 'ADD',
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      default_price: '',
      is_active: true,
      price_behavior: 'ADD',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) return;
    const data = {
      name: form.name.trim(),
      default_price: parseInt(form.default_price, 10) || 0,
      is_active: !!form.is_active,
      price_behavior: form.price_behavior === 'REPLACE' ? 'REPLACE' : 'ADD',
    };
    try {
      if (editingId) {
        await updateDoc(getDocPath('addons', editingId), data);
      } else {
        await addDoc(getCollectionPath('addons'), data);
      }
      resetForm();
      if (onAddonsChange) onAddonsChange();
    } catch (err) {
      console.error(err);
      alert('Chyba při ukládání.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Opravdu smazat tento add-on? Služby, které ho nabízejí, ho už nebudou mít v konfiguraci.')) return;
    try {
      await deleteDoc(getDocPath('addons', id));
      if (editingId === id) resetForm();
      if (onAddonsChange) onAddonsChange();
    } catch (err) {
      console.error(err);
      alert('Chyba při mazání.');
    }
  };

  const startEdit = (addon) => {
    setEditingId(addon.id);
    setForm({
      name: addon.name || '',
      default_price: addon.default_price ?? '',
      is_active: addon.is_active !== false,
      price_behavior: addon.price_behavior === 'REPLACE' ? 'REPLACE' : 'ADD',
    });
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800">
        <Package size={18} className="text-stone-400" /> Správa add-onů
      </h2>
      <p className="text-xs text-stone-500 mb-6">
        Add-ony jsou doplňkové služby (např. barvení obočí, maska). Cenu a doporučení pro konkrétní hlavní službu nastavíte v záložce „Služby“ u dané procedury.
      </p>

      <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4 shadow-sm mb-6">
        <h3 className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">
          {editingId ? 'Upravit add-on' : 'Nový add-on'}
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <input
            type="text"
            placeholder="Název (např. Barvení obočí)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-3 border border-stone-200 rounded-lg text-sm"
          />
          <div className="space-y-2">
            <div className="flex gap-4">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pt-3">Typ ceny</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="price_behavior"
                  checked={form.price_behavior === 'ADD'}
                  onChange={() => setForm({ ...form, price_behavior: 'ADD' })}
                  className="border-stone-300"
                />
                <span className="text-sm text-stone-600">Přičíst k ceně</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="price_behavior"
                  checked={form.price_behavior === 'REPLACE'}
                  onChange={() => setForm({ ...form, price_behavior: 'REPLACE' })}
                  className="border-stone-300"
                />
                <span className="text-sm text-stone-600">Konečná cena</span>
              </label>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Výchozí cena (Kč)</label>
                <input
                  type="number"
                  min="0"
                  placeholder={form.price_behavior === 'REPLACE' ? '5000' : '350'}
                  value={form.default_price}
                  onChange={(e) => setForm({ ...form, default_price: e.target.value })}
                  className="w-full p-3 border border-stone-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded border-stone-300"
            />
            <span className="text-sm text-stone-600">Aktivní (zobrazovat v nabídce)</span>
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-stone-800 text-white py-3 rounded-lg font-bold text-[10px] uppercase shadow-md"
            >
              {editingId ? 'Uložit změny' : '+ Přidat add-on'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 bg-stone-100 text-stone-500 rounded-lg font-bold text-[10px] uppercase"
              >
                Zrušit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-2">
        {addons.length === 0 ? (
          <p className="text-sm text-stone-400 italic">Zatím nemáte žádné add-ony. Přidejte první výše.</p>
        ) : (
          addons.map((addon) => (
            <div
              key={addon.id}
              className={`flex justify-between items-center bg-stone-50 p-3 rounded-lg border border-stone-100 transition-all ${editingId === addon.id ? 'ring-2 ring-stone-400' : ''}`}
            >
              <div>
                <span className="text-sm font-bold text-stone-800">{addon.name}</span>
                <div className="flex gap-2 mt-1 text-[10px] text-stone-500">
                  <span>{addon.default_price ?? 0} Kč</span>
                  {addon.duration_minutes != null && addon.duration_minutes !== '' && (
                    <span>{addon.duration_minutes} min</span>
                  )}
                  {addon.is_active === false && (
                    <span className="text-amber-600 font-medium">Neaktivní</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(addon)}
                  className="p-2 text-stone-400 hover:text-stone-800"
                  title="Upravit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(addon.id)}
                  className="p-2 text-stone-300 hover:text-red-500"
                  title="Smazat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminAddonsTab;

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


--- SOUBOR: src/components/admin/AdminGallerySubTab.jsx ---
```javascript
import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { storage, getCollectionPath, getDocPath } from '../../firebaseConfig';
import { COSMETICS_CATEGORY, PMU_CATEGORY, GALLERY_COLLECTION, STORAGE_GALLERY_PREFIX } from '../../constants/cosmetics';
import CategoryToggle from './CategoryToggle';

// Client-side image optimization before upload to Storage (same logic as Proměny).
async function createOptimizedImageFile(file, maxSize = 1600, quality = 0.85) {
  if (!file) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('Nepodařilo se načíst obrázek.'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const optimizedFile = new File(
                [blob],
                file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '.jpg'),
                { type: 'image/jpeg' }
              );
              resolve(optimizedFile);
            },
            'image/jpeg',
            quality
          );
        } catch (e) {
          resolve(file);
        }
      };
      img.onerror = () => reject(new Error('Nepodařilo se načíst obrázek pro zmenšení.'));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminGallerySubTab() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState(COSMETICS_CATEGORY);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const colRef = getCollectionPath(GALLERY_COLLECTION);
  const [itemsCosmetics, setItemsCosmetics] = useState([]);
  const [itemsPmu, setItemsPmu] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItemsCosmetics(all.filter((item) => (item.category || COSMETICS_CATEGORY) === COSMETICS_CATEGORY));
        setItemsPmu(all.filter((item) => item.category === PMU_CATEGORY));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Nepodařilo se načíst galerii.');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const items = React.useMemo(() => {
    const merged = [...itemsCosmetics, ...itemsPmu];
    merged.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return merged;
  }, [itemsCosmetics, itemsPmu]);

  const handleSingleUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file?.type?.startsWith('image/')) return;
    setSelectedFile(file);
  };

  const handleAdd = async () => {
    if (!selectedFile) {
      setError('Vyberte obrázek.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const optimized = await createOptimizedImageFile(selectedFile);
      const ts = Date.now();
      const safe = (f) => (f?.name || 'image').replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `${STORAGE_GALLERY_PREFIX}/${ts}-${safe(optimized)}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, optimized || selectedFile);
      const imageUrl = await getDownloadURL(storageRef);
      await addDoc(colRef, {
        imageUrl,
        caption: (caption || '').trim(),
        category: category || COSMETICS_CATEGORY,
        createdAt: new Date().toISOString(),
      });
      setCaption('');
      setSelectedFile(null);
      if (document.getElementById('gallery-file-input')) document.getElementById('gallery-file-input').value = '';
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Nahrání se nezdařilo. Zkontrolujte Storage a pravidla.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Obrázek odebrat z galerie?')) return;
    try {
      await deleteDoc(getDocPath(GALLERY_COLLECTION, id));
    } catch (e) {
      console.error(e);
      setError('Nepodařilo se smazat.');
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-stone-500">
        Načítám galerii…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-500 mb-4">
        Jednoduché fotografie do sekce „Moje práce“. Vyberte, zda jde na stránku <strong>Kosmetika</strong> nebo <strong>PMU</strong>.
      </p>
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Kde se zobrazí</span>
          <CategoryToggle value={category} onChange={setCategory} disabled={uploading} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Obrázek</span>
          <label className="skin-accent px-4 py-3 rounded-lg text-sm font-bold uppercase flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 w-fit">
            <Upload size={18} />
            {selectedFile ? selectedFile.name : 'Vybrat soubor'}
            <input
              id="gallery-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={handleSingleUpload}
            />
          </label>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Popisek (volitelné)</span>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="např. Ošetření pleti"
            className="w-full max-w-md px-3 py-2 border border-stone-200 rounded-lg text-stone-800"
            disabled={uploading}
          />
        </label>
        <button
          type="button"
          onClick={handleAdd}
          disabled={uploading || !selectedFile}
          className="skin-accent px-6 py-3 rounded-xl text-sm font-bold uppercase disabled:opacity-50"
        >
          {uploading ? 'Nahrávám…' : 'Přidat do galerie'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative group rounded-xl border border-stone-200 bg-white overflow-hidden"
          >
            <div className="aspect-square bg-stone-100">
              <img
                src={item.imageUrl}
                alt={item.caption || ''}
                className="w-full h-full object-cover"
              />
            </div>
            {item.caption && (
              <p className="p-2 text-xs text-stone-600 truncate" title={item.caption}>
                {item.caption}
              </p>
            )}
            <span
              className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                item.category === PMU_CATEGORY
                  ? 'bg-[#B37E76]/90 text-white'
                  : 'bg-stone-600/90 text-white'
              }`}
            >
              {item.category === PMU_CATEGORY ? 'PMU' : 'Kosmetika'}
            </span>
            <button
              type="button"
              onClick={() => handleRemove(item.id)}
              className="absolute top-2 right-2 p-2 rounded-full bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Odebrat"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && !uploading && (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-stone-200 text-stone-400">
          <ImageIcon size={40} className="mb-2" />
          <p className="text-sm">Zatím žádné fotografie. Nahrajte první obrázek výše.</p>
        </div>
      )}
    </div>
  );
}

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


--- SOUBOR: src/components/admin/AdminImageOptimization.test.js ---
```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createOptimizedImageFile } from './AdminTransformationsSubTab';

// Helper to mock canvas and Image for resize logic
function setupDomMocks({ width = 4000, height = 2000 } = {}) {
  const originalImage = global.Image;
  const originalCreateElement = document.createElement;

  let createdCanvas = null;

  class FakeImage {
    constructor() {
      this.onload = null;
      this.onerror = null;
    }
    set src(_val) {
      // Simulate successful load with given dimensions
      this.width = width;
      this.height = height;
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
  }

  document.createElement = (tag) => {
    if (tag === 'canvas') {
      createdCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
        })),
        toBlob: (cb) => {
          // Simulate JPEG blob
          cb(new Blob(['x'], { type: 'image/jpeg' }));
        },
      };
      return createdCanvas;
    }
    return originalCreateElement.call(document, tag);
  };

  global.Image = FakeImage;

  return {
    restore: () => {
      global.Image = originalImage;
      document.createElement = originalCreateElement;
    },
    getCanvas: () => createdCanvas,
  };
}

describe('createOptimizedImageFile', () => {
  let dom;

  beforeEach(() => {
    dom = setupDomMocks({ width: 4000, height: 2000 }); // landscape 2:1
  });

  afterEach(() => {
    dom.restore();
  });

  it('downscales large images so the longer side is maxSize and keeps aspect ratio', async () => {
    const original = new File([new Uint8Array([1, 2, 3])], 'photo-large.png', {
      type: 'image/png',
    });

    const optimized = await createOptimizedImageFile(original, 1600, 0.85);

    // Should return a File instance
    expect(optimized).toBeInstanceOf(File);
    // Extension should be converted to .jpg
    expect(optimized.name.endsWith('.jpg')).toBe(true);

    // Check canvas dimensions used for resize
    const canvas = dom.getCanvas();
    expect(canvas).not.toBeNull();
    expect(canvas.width).toBe(1600); // longer side clamped to maxSize
    expect(canvas.height).toBe(800); // 4000x2000 -> 1600x800 keeps 2:1 ratio
  });

  it('returns original file when getContext("2d") is null (no canvas context)', async () => {
    // Keep Image mock so onload fires; only make canvas return no context
    const originalCreateElement = document.createElement;
    document.createElement = (tag) => {
      if (tag === 'canvas') {
        return { width: 0, height: 0, getContext: () => null };
      }
      return originalCreateElement.call(document, tag);
    };

    const original = new File([new Uint8Array([1, 2, 3])], 'photo.jpg', {
      type: 'image/jpeg',
    });

    const result = await createOptimizedImageFile(original, 1600, 0.85);
    expect(result).toBe(original);
  });
});


```


--- SOUBOR: src/components/admin/AdminInstagramTab.jsx ---
```javascript
import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDoc, setDoc } from 'firebase/firestore';
import { Instagram, Upload, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { storage, getDocPath } from '../../firebaseConfig';

const CONFIG_DOC = 'instagramShowcase';
const STORAGE_PREFIX = 'instagram-showcase';

export default function AdminInstagramTab() {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const docRef = getDocPath('config', CONFIG_DOC);

  const load = async () => {
    try {
      const snap = await getDoc(docRef);
      const data = snap.data();
      setUrls(Array.isArray(data?.urls) ? data.urls : []);
    } catch (e) {
      console.error(e);
      setError('Nepodařilo se načíst galerii.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (newUrls) => {
    setError('');
    try {
      await setDoc(docRef, { urls: newUrls });
      setUrls(newUrls);
    } catch (e) {
      console.error(e);
      setError('Nepodařilo se uložit.');
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    const imageFiles = [...files].filter((f) => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    setUploading(true);
    setError('');
    try {
      let newUrls = [...urls];
      for (const file of imageFiles) {
        const path = `${STORAGE_PREFIX}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        newUrls = [...newUrls, downloadUrl];
      }
      await save(newUrls);
    } catch (err) {
      console.error(err);
      const code = err?.code || '';
      const msg = err?.message || String(err);
      setError(`Nahrání se nezdařilo. ${code ? `(${code}) ` : ''}${msg}. Zkontrolujte, že je Storage zapnuté a pravidla nasazená.`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = (index) => {
    if (!confirm('Obrázek odebrat z galerie?')) return;
    const newUrls = urls.filter((_, i) => i !== index);
    save(newUrls);
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= urls.length) return;
    const next = [...urls];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    save(next);
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-stone-500">
        Načítám galerii…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800">
          <Instagram size={18} className="text-stone-400" /> Galerie Instagram (úvodní stránka)
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          Fotky zobrazené v sekci „Sledujte nás na Instagramu“. Pořadí můžete měnit šipkami nebo přidávat nové.
        </p>
        <p className="text-xs text-stone-400 mb-4">
          Na telefonu otevřete admin, záložku Instagram a tlačítkem níže vyberte fotky přímo z galerie (můžete vybrat i více najednou).
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-4 items-center mb-6">
          <label className="skin-accent px-6 py-3 min-h-[48px] rounded-xl text-sm font-bold uppercase flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 touch-manipulation active:scale-[0.98]">
            <Upload size={20} />
            {uploading ? 'Nahrávám…' : 'Přidat fotku z galerie'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {urls.map((url, index) => (
            <div
              key={url}
              className="relative group bg-stone-100 rounded-xl overflow-hidden border border-stone-200"
            >
              <div className="aspect-square bg-stone-200">
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>
              {/* Na mobilu tlačítka pod obrázkem, na desktopu overlay při hoveru – jen šipky a smazat */}
              <div className="flex sm:absolute sm:inset-0 sm:bg-black/40 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity items-center justify-center gap-2 p-2 bg-stone-800/90 sm:bg-transparent">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="p-2 rounded-full bg-white/90 text-stone-700 disabled:opacity-30 touch-manipulation"
                  aria-label="Posunout nahoru"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === urls.length - 1}
                  className="p-2 rounded-full bg-white/90 text-stone-700 disabled:opacity-30 touch-manipulation"
                  aria-label="Posunout dolů"
                >
                  <ChevronDown size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 touch-manipulation"
                  aria-label="Odebrat"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {urls.length === 0 && !uploading && (
          <p className="text-sm text-stone-400 italic py-4">
            Zatím žádné fotky. Klikněte na „Přidat fotku“ a nahrajte obrázky (doporučený formát čtverec 1:1).
          </p>
        )}
      </section>
    </div>
  );
}

```


--- SOUBOR: src/components/admin/AdminPMUSlidersTab.jsx ---
```javascript
import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDoc, setDoc } from 'firebase/firestore';
import { Sliders, Upload, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { storage, getDocPath } from '../../firebaseConfig';

const CONFIG_DOC = 'pmuSliders';
const STORAGE_PREFIX = 'pmu-sliders';

const defaultSliders = () => [];

export default function AdminPMUSlidersTab() {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [altText, setAltText] = useState('');

  const docRef = getDocPath('config', CONFIG_DOC);

  const load = async () => {
    try {
      const snap = await getDoc(docRef);
      const data = snap.data();
      setSliders(Array.isArray(data?.sliders) ? data.sliders : defaultSliders());
    } catch (e) {
      console.error(e);
      setError('Nepodařilo se načíst slidery.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (newSliders) => {
    setError('');
    try {
      await setDoc(docRef, { sliders: newSliders });
      setSliders(newSliders);
    } catch (e) {
      console.error(e);
      setError('Nepodařilo se uložit.');
    }
  };

  const handleAdd = async () => {
    if (!beforeFile || !afterFile) {
      setError('Vyberte oba obrázky (Před a Po).');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const ts = Date.now();
      const safe = (f) => f.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const pathBefore = `${STORAGE_PREFIX}/${ts}-before-${safe(beforeFile)}`;
      const pathAfter = `${STORAGE_PREFIX}/${ts}-after-${safe(afterFile)}`;
      const refBefore = ref(storage, pathBefore);
      const refAfter = ref(storage, pathAfter);
      await uploadBytes(refBefore, beforeFile);
      await uploadBytes(refAfter, afterFile);
      const beforeImage = await getDownloadURL(refBefore);
      const afterImage = await getDownloadURL(refAfter);
      const newItem = {
        beforeImage,
        afterImage,
        altText: (altText || 'Před a po').trim(),
      };
      const newSliders = [...sliders, newItem];
      await save(newSliders);
      setBeforeFile(null);
      setAfterFile(null);
      setAltText('');
    } catch (err) {
      console.error(err);
      const code = err?.code || '';
      const msg = err?.message || String(err);
      setError(`Nahrání se nezdařilo. ${code ? `(${code}) ` : ''}${msg}. Zkontrolujte, že je Storage zapnuté a pravidla nasazená.`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index) => {
    if (!confirm('Tento před/po slider odebrat?')) return;
    const newSliders = sliders.filter((_, i) => i !== index);
    save(newSliders);
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= sliders.length) return;
    const next = [...sliders];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    save(next);
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-stone-500">
        Načítám před/po slidery…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800">
          <Sliders size={18} className="text-stone-400" /> PMU Před / Po (stránka PMU)
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          Přidejte dvojice obrázků „Před“ a „Po“. Zobrazí se na stránce PMU jako posuvný slider. Pořadí můžete měnit šipkami.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-stone-500">Obrázek Před</span>
              <label className="skin-accent px-4 py-3 rounded-lg text-sm font-bold uppercase flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50">
                <Upload size={18} />
                {beforeFile ? beforeFile.name : 'Vybrat soubor'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => setBeforeFile(e.target.files?.[0] || null)}
                />
              </label>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-stone-500">Obrázek Po</span>
              <label className="skin-accent px-4 py-3 rounded-lg text-sm font-bold uppercase flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50">
                <Upload size={18} />
                {afterFile ? afterFile.name : 'Vybrat soubor'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => setAfterFile(e.target.files?.[0] || null)}
                />
              </label>
            </label>
          </div>
          <div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-stone-500">Popis (pro čtečky obrazovky)</span>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="např. PMU obočí – před a po"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-800"
                disabled={uploading}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={uploading || !beforeFile || !afterFile}
            className="skin-accent px-6 py-3 rounded-xl text-sm font-bold uppercase disabled:opacity-50"
          >
            {uploading ? 'Nahrávám…' : 'Přidat před/po slider'}
          </button>
        </div>

        <div className="space-y-4">
          {sliders.map((item, index) => (
            <div
              key={`${item.beforeImage}-${index}`}
              className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-stone-200 bg-white"
            >
              <div className="flex gap-2 flex-1 min-w-0">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                  <img src={item.beforeImage} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                  <img src={item.afterImage} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0 flex-1 flex items-center">
                  <p className="text-sm text-stone-600 truncate" title={item.altText}>
                    {item.altText || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="p-2 rounded-full bg-stone-100 text-stone-600 disabled:opacity-30"
                  aria-label="Posunout nahoru"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === sliders.length - 1}
                  className="p-2 rounded-full bg-stone-100 text-stone-600 disabled:opacity-30"
                  aria-label="Posunout dolů"
                >
                  <ChevronDown size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                  aria-label="Odebrat"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {sliders.length === 0 && !uploading && (
          <p className="text-sm text-stone-400 italic py-4">
            Zatím žádné před/po slidery. Vyberte oba obrázky a klikněte na „Přidat před/po slider“.
          </p>
        )}
      </section>
    </div>
  );
}

```


--- SOUBOR: src/components/admin/AdminPhotosTab.jsx ---
```javascript
import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import AdminGallerySubTab from './AdminGallerySubTab';
import AdminTransformationsSubTab from './AdminTransformationsSubTab';

const SUB_TABS = [
  { id: 'galerie', label: 'Galerie' },
  { id: 'promeny', label: 'Proměny' },
];

export default function AdminPhotosTab() {
  const [subTab, setSubTab] = useState('galerie');

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-lg mb-4 border-b border-stone-100 pb-2 flex items-center gap-2 text-stone-800">
          <ImageIcon size={18} className="text-stone-400" /> Fotografie (Kosmetika)
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          Galerie = jednotlivé fotky do sekce „Moje práce“. Proměny = před/po dvojice do sekce „Proměny“. Nepleťte si je – každá sekce má vlastní formulář.
        </p>

        {/* Segmented control: Galerie | Proměny */}
        <div className="flex rounded-xl border border-stone-200 bg-stone-100 p-1 mb-6 w-full max-w-sm">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                subTab === tab.id
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {subTab === 'galerie' && <AdminGallerySubTab />}
        {subTab === 'promeny' && <AdminTransformationsSubTab />}
      </section>
    </div>
  );
}

```


--- SOUBOR: src/components/admin/AdminServicesTab.jsx ---
```javascript
import React, { useState } from 'react';
import {
  Scissors,
  X,
  Plus,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Edit2,
  Trash2,
  WandSparkles,
  Loader2,
} from 'lucide-react';

const AdminServicesTab = ({
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
  addons = [],
  editingAddonLinks = [],
  setEditingAddonLinks,
}) => {
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatError, setFormatError] = useState('');

  const handleFormatDescription = async () => {
    const raw = (serviceForm.description || '').trim();
    if (!raw) {
      setFormatError('Nejprve napište hrubý text do popisu.');
      return;
    }
    setIsFormatting(true);
    setFormatError('');
    try {
      const res = await fetch('/api/format-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: raw }),
      });
      let data;
      try {
        data = await res.json();
      } catch (_) {
        if (!res.ok) throw new Error(`Chyba ${res.status}. Zkuste to znovu.`);
        throw new Error('Neplatná odpověď serveru. Zkuste to znovu.');
      }
      if (!res.ok) {
        throw new Error(data.error || `Chyba ${res.status}`);
      }
      if (data.formattedMarkdown != null) {
        setServiceForm({ ...serviceForm, description: data.formattedMarkdown });
      }
    } catch (err) {
      const msg = err.message || '';
      const isParseOrPattern = err instanceof SyntaxError || /unexpected token|expected pattern/i.test(msg);
      setFormatError(isParseOrPattern ? 'Formátování není teď k dispozici. Zkuste to později.' : msg || 'Formátování se nepovedlo.');
    } finally {
      setIsFormatting(false);
    }
  };

  return (
  <div className="bg-stone-50/60 rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm">
    <h2 className="font-display text-xl mb-1 flex items-center gap-2 text-stone-800">
      <Scissors size={20} className="text-stone-500" />
      Služby
    </h2>
    <p className="text-xs text-stone-500 mb-6">Procedury a ceník – přidávání, úprava pořadí a nastavení upsellů.</p>

    <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3 shadow-sm mb-6">
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
      <div>
        <label htmlFor="service-category" className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Kategorie</label>
        <select
          id="service-category"
          value={serviceForm.category ?? 'STANDARD'}
          onChange={(e) => {
            const newCategory = e.target.value;
            const isPmu = newCategory === 'PMU';
            const pmuDurations = ['180', '210', '240', '270'];
            const standardDurations = ['30', '60', '90', '120'];
            const currentDuration = String(serviceForm.duration ?? '60');
            const duration = isPmu
              ? (pmuDurations.includes(currentDuration) ? currentDuration : '180')
              : (standardDurations.includes(currentDuration) ? currentDuration : '60');
            setServiceForm({ ...serviceForm, category: newCategory, duration });
          }}
          className="w-full p-3 border rounded-lg text-sm bg-white"
        >
          <option value="STANDARD">Kosmetika</option>
          <option value="PMU">PMU (permanentní make-up)</option>
        </select>
      </div>
      <div>
        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            placeholder="Cena"
            value={serviceForm.price}
            onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
            className="flex-1 min-w-0 p-3 border rounded-lg text-sm"
          />
          <select
            value={serviceForm.duration}
            onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
            className="flex-1 min-w-0 p-3 border rounded-lg text-sm bg-white"
          >
            {(serviceForm.category || 'STANDARD') === 'PMU' ? (
              <>
                <option value="180">3 h</option>
                <option value="210">3,5 h</option>
                <option value="240">4 h</option>
                <option value="270">4,5 h</option>
              </>
            ) : (
              <>
                <option value="30">30 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
                <option value="120">120 min</option>
              </>
            )}
          </select>
        </div>
        <label data-cena-od className="flex items-center gap-2 mt-2 p-3 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-700 cursor-pointer">
          <input
            type="checkbox"
            checked={!!serviceForm.isStartingPrice}
            onChange={(e) => setServiceForm({ ...serviceForm, isStartingPrice: e.target.checked })}
            className="rounded border-stone-300 w-4 h-4 shrink-0"
          />
          Cena je &quot;od&quot;?
        </label>
      </div>
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Popis služby</label>
          <button
            type="button"
            onClick={handleFormatDescription}
            disabled={isFormatting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            title="Převést hrubý text na luxusní Markdown (AI)"
          >
            {isFormatting ? (
              <Loader2 size={14} className="animate-spin shrink-0" />
            ) : (
              <WandSparkles size={14} className="shrink-0" />
            )}
            <span>AI Vylepšit</span>
          </button>
        </div>
        {formatError && (
          <p className="text-xs text-amber-700 mb-1" role="alert">{formatError}</p>
        )}
        <textarea
          placeholder="Několik vět popisujících proceduru (zobrazí se po rozkliknutí na webu)"
          value={serviceForm.description || ''}
          onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
          rows={4}
          className="w-full p-3 border rounded-lg text-sm resize-y min-h-[80px]"
        />
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

    {editingServiceId && setEditingAddonLinks && (
      <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 space-y-4 shadow-sm mb-6">
        <h3 className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">
          Upsell konfigurace
        </h3>
        <p className="text-xs text-stone-500">
          Přidejte add-ony, které se zákazníkovi nabídnou u této procedury. Přepsaná cena přepíše výchozí cenu add-onu.
        </p>
        <div className="space-y-3">
          {editingAddonLinks.map((row, index) => {
            const selectedAddon = addons.find((a) => a.id === row.addon_id);
            const defaultPrice = selectedAddon?.default_price ?? '';
            return (
              <div
                key={index}
                className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg border border-stone-100"
              >
                <select
                  value={row.addon_id}
                  onChange={(e) =>
                    setEditingAddonLinks(
                      editingAddonLinks.map((r, i) =>
                        i === index ? { ...r, addon_id: e.target.value } : r
                      )
                    )}
                  className="flex-1 min-w-[140px] p-2 border border-stone-200 rounded-lg text-sm bg-white"
                >
                  <option value="">Vyberte add-on...</option>
                  {addons
                    .filter((a) => a.is_active !== false)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.default_price ?? 0} Kč)
                      </option>
                    ))}
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder={defaultPrice ? `Výchozí: ${defaultPrice}` : 'Cena'}
                  value={row.custom_price}
                  onChange={(e) =>
                    setEditingAddonLinks(
                      editingAddonLinks.map((r, i) =>
                        i === index ? { ...r, custom_price: e.target.value } : r
                      )
                    )}
                  className="w-24 p-2 border border-stone-200 rounded-lg text-sm"
                />
                <label className="flex items-center gap-1.5 text-xs text-stone-600 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={!!row.is_recommended}
                    onChange={(e) =>
                      setEditingAddonLinks(
                        editingAddonLinks.map((r, i) =>
                          i === index ? { ...r, is_recommended: e.target.checked } : r
                        )
                      )}
                    className="rounded border-stone-300"
                  />
                  Doporučené
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setEditingAddonLinks(editingAddonLinks.filter((_, i) => i !== index))
                  }
                  className="p-2 text-stone-300 hover:text-red-500"
                  title="Odebrat"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() =>
            setEditingAddonLinks([
              ...editingAddonLinks,
              { addon_id: '', custom_price: '', is_recommended: false },
            ])
          }
          className="w-full bg-stone-200 text-stone-700 py-2 rounded-lg font-bold text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-stone-300 transition-all"
        >
          <Plus size={14} /> Přidat další add-on
        </button>
      </div>
    )}

    <div>
      <h3 className="text-sm font-bold text-stone-700 mb-3">Seznam služeb</h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scroll">
        {services.map((s, index) => (
          <div
            key={s.id}
            className={`flex justify-between items-center bg-white p-3 rounded-lg border border-stone-100 transition-all ${draggedItemIndex === index ? 'opacity-50' : 'opacity-100'}`}
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
                  className="text-stone-400 hover:text-stone-800 disabled:opacity-20 bg-stone-50 p-1 rounded-full border border-stone-200 shadow-sm"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => moveService(index, 1)}
                  disabled={index === services.length - 1}
                  className="text-stone-400 hover:text-stone-800 disabled:opacity-20 bg-stone-50 p-1 rounded-full border border-stone-200 shadow-sm"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="hidden md:block">
                <GripVertical className="text-stone-300" size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-stone-800">{s.name}</span>
                <div className="flex gap-2 mt-1 flex-wrap items-center">
                  <span className="text-[10px] font-bold text-stone-500">{s.isStartingPrice ? `od ${s.price} Kč` : `${s.price} Kč`}</span>
                  <span className="text-[10px] text-stone-300">{s.duration} min</span>
                  <span className="text-[10px] text-stone-400">
                    {(s.category || 'STANDARD') === 'PMU' ? 'PMU' : 'Kosmetika'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={() => onStartEdit(s)} className="p-2 text-stone-400 hover:text-stone-800" data-testid="edit-service" aria-label={`Upravit ${s.name}`}>
                <Edit2 size={14} />
              </button>
              <button onClick={() => onDeleteService(s.id)} className="p-2 text-stone-300 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

export default AdminServicesTab;

```


--- SOUBOR: src/components/admin/AdminServicesTab.test.jsx ---
```javascript
/**
 * Testy komponenty AdminServicesTab – záložka Služby v adminu.
 * Testuje: zobrazení formuláře, režim úpravy, Zrušit, onStartEdit, AI Vylepšit (format-content).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminServicesTab from './AdminServicesTab';

const defaultServices = [
  { id: 's1', name: 'Klasická masáž', duration: 60, price: 800, description: 'Popis masáže' },
  { id: 's2', name: 'Čištění pleti', duration: 30, price: 500, description: '' },
];

const noop = () => {};

const defaultProps = {
  services: defaultServices,
  editingServiceId: null,
  serviceForm: { name: '', price: '', duration: '60', description: '', category: 'STANDARD', isStartingPrice: false },
  setServiceForm: vi.fn(),
  onService: vi.fn(),
  onDeleteService: vi.fn(),
  onStartEdit: vi.fn(),
  moveService: vi.fn(),
  onDragStart: noop,
  onDragOver: noop,
  onDragEnd: noop,
  onDrop: noop,
  draggedItemIndex: null,
  onCancelEdit: vi.fn(),
};

describe('AdminServicesTab', () => {
  it('renders list of services and form for new service', () => {
    render(<AdminServicesTab {...defaultProps} />);
    expect(screen.getByText('Služby')).toBeInTheDocument();
    expect(screen.getByText('Nový produkt / Služba')).toBeInTheDocument();
    expect(screen.getByText('Klasická masáž')).toBeInTheDocument();
    expect(screen.getByText('Čištění pleti')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Název')).toHaveValue('');
    expect(screen.getByRole('button', { name: '+ Přidat' })).toBeInTheDocument();
  });

  it('when editingServiceId is set shows "Upravit produkt" and form filled with service data', () => {
    render(
      <AdminServicesTab
        {...defaultProps}
        editingServiceId="s1"
        serviceForm={{
          name: 'Klasická masáž',
          price: 800,
          duration: '60',
          description: 'Popis masáže',
          category: 'STANDARD',
          isStartingPrice: false,
        }}
      />
    );
    expect(screen.getByText('Upravit produkt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Uložit změny' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zrušit' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Název')).toHaveValue('Klasická masáž');
    expect(screen.getByPlaceholderText('Cena')).toHaveValue(800);
  });

  it('calls onCancelEdit when Zrušit is clicked', () => {
    const onCancelEdit = vi.fn();
    render(
      <AdminServicesTab
        {...defaultProps}
        editingServiceId="s1"
        serviceForm={{ name: 'Masáž', price: 800, duration: '60', description: '', category: 'STANDARD', isStartingPrice: false }}
        onCancelEdit={onCancelEdit}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Zrušit' }));
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });

  it('renders category select with Kosmetika and PMU options', () => {
    render(<AdminServicesTab {...defaultProps} />);
    const categorySelect = screen.getByLabelText('Kategorie');
    expect(categorySelect).toBeInTheDocument();
    expect(categorySelect).toHaveValue('STANDARD');
    const options = categorySelect.querySelectorAll('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveValue('STANDARD');
    expect(options[0]).toHaveTextContent('Kosmetika');
    expect(options[1]).toHaveValue('PMU');
    expect(options[1]).toHaveTextContent('PMU (permanentní make-up)');
  });

  it('calls onStartEdit with service when edit button is clicked on a service row', () => {
    const onStartEdit = vi.fn();
    render(<AdminServicesTab {...defaultProps} onStartEdit={onStartEdit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Upravit Klasická masáž' }));
    expect(onStartEdit).toHaveBeenCalledWith(defaultServices[0]);
  });

  describe('AI Vylepšit (format-content)', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('shows error when description is empty and does not call fetch', async () => {
      render(<AdminServicesTab {...defaultProps} serviceForm={{ ...defaultProps.serviceForm, description: '' }} />);
      fireEvent.click(screen.getByRole('button', { name: /AI Vylepšit/i }));
      await waitFor(() => {
        expect(screen.getByText('Nejprve napište hrubý text do popisu.')).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('calls fetch with POST /api/format-content and rawText when description has text', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ formattedMarkdown: '**Formátovaný** text.' }),
      });
      vi.mocked(globalThis.fetch).mockImplementation(mockFetch);

      const setServiceForm = vi.fn();
      render(
        <AdminServicesTab
          {...defaultProps}
          setServiceForm={setServiceForm}
          serviceForm={{ ...defaultProps.serviceForm, description: 'hrubý text' }}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /AI Vylepšit/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/format-content',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rawText: 'hrubý text' }),
          })
        );
      });
    });

    it('updates serviceForm with formattedMarkdown on success', async () => {
      const formatted = '- **Benefit** jeden\n- Benefit dva';
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ formattedMarkdown: formatted }),
      });

      const setServiceForm = vi.fn();
      const serviceForm = { name: 'Masáž', price: 800, duration: '60', description: 'hrubý text', category: 'STANDARD' };
      render(<AdminServicesTab {...defaultProps} setServiceForm={setServiceForm} serviceForm={serviceForm} />);
      fireEvent.click(screen.getByRole('button', { name: /AI Vylepšit/i }));

      await waitFor(() => {
        expect(setServiceForm).toHaveBeenCalledWith({ ...serviceForm, description: formatted });
      });
    });

    it('shows API error message when response is not ok', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: 'No LLM configured.' }),
      });

      render(
        <AdminServicesTab
          {...defaultProps}
          serviceForm={{ ...defaultProps.serviceForm, description: 'nějaký text' }}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /AI Vylepšit/i }));

      await waitFor(() => {
        expect(screen.getByText('No LLM configured.')).toBeInTheDocument();
      });
    });

    it('shows friendly message when response is not valid JSON (e.g. HTML)', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.reject(new SyntaxError("Unexpected token '<' in JSON at position 0")),
      });

      render(
        <AdminServicesTab
          {...defaultProps}
          serviceForm={{ ...defaultProps.serviceForm, description: 'text' }}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /AI Vylepšit/i }));

      await waitFor(() => {
        expect(screen.getByText(/Chyba 404\. Zkuste to znovu\./)).toBeInTheDocument();
      });
    });

    it('shows friendly message when error contains "expected pattern" (e.g. Firebase validation)', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ formattedMarkdown: '- bod' }),
      });
      const setServiceForm = vi.fn().mockImplementation(() => {
        throw new Error('The string did not match the expected pattern.');
      });

      render(
        <AdminServicesTab
          {...defaultProps}
          setServiceForm={setServiceForm}
          serviceForm={{ ...defaultProps.serviceForm, description: 'text' }}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /AI Vylepšit/i }));

      await waitFor(() => {
        expect(screen.getByText('Formátování není teď k dispozici. Zkuste to později.')).toBeInTheDocument();
      });
    });
  });
});

```


--- SOUBOR: src/components/admin/AdminShiftsTab.jsx ---
```javascript
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { X, Plus, Calendar, ChevronRight, ChevronDown } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const MONTH_NAMES = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
];

const getDaysInMonth = (year, month) => {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const days = [];
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    days.push(Utils.formatDateKey(new Date(d)));
  }
  return days;
};

const getPeriodsForDay = (schedule, dateKey) => {
  const dayData = schedule[dateKey];
  if (!dayData) return [];
  return dayData.periods || (dayData.start ? [{ start: dayData.start, end: dayData.end }] : []);
};

const getDayType = (schedule, schedulePmu, dateKey) => {
  const hasK = getPeriodsForDay(schedule, dateKey).length > 0;
  const hasP = getPeriodsForDay(schedulePmu, dateKey).length > 0;
  if (hasK) return 'kosmetika';
  if (hasP) return 'pmu';
  return 'closed';
};

const TYPE_LABELS = { kosmetika: 'Kosmetika', pmu: 'PMU', closed: 'Zavřeno' };
const TYPE_LABELS_UPPER = { kosmetika: 'KOSMETIKA', pmu: 'PMU', closed: 'ZAVŘENO' };

const isValidTimeRange = (start, end) => {
  if (!start || !end) return false;
  return Utils.timeToMinutes(end) > Utils.timeToMinutes(start);
};

/** Generuje možnosti měsíců: cca 12 měsíců zpět a 12 dopředu od aktuálního */
const getMonthOptions = () => {
  const now = new Date();
  const options = [];
  for (let i = -12; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const value = `${y}-${String(m).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[m - 1]} ${y}`;
    options.push({ value, label });
  }
  return options;
};

const MONTH_OPTIONS = getMonthOptions();

const AdminShiftsTab = ({
  schedule = {},
  schedulePmu = {},
  onSaveDay,
}) => {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [monthInput, setMonthInput] = useState(defaultMonth);
  const [monthSelectOpen, setMonthSelectOpen] = useState(false);
  const monthSelectRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const [editingDateKey, setEditingDateKey] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editType, setEditType] = useState('kosmetika');
  const [editPeriods, setEditPeriods] = useState([]);
  const [editWorkStart, setEditWorkStart] = useState('09:00');
  const [editWorkEnd, setEditWorkEnd] = useState('17:00');
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    if (editingDateKey) {
      const id = requestAnimationFrame(() => setDrawerVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setDrawerVisible(false);
    }
  }, [editingDateKey]);

  const monthDays = useMemo(() => {
    const [y, m] = monthInput.split('-').map(Number);
    return getDaysInMonth(y, m);
  }, [monthInput]);

  const monthShifts = useMemo(() => {
    return monthDays.map((dateKey) => {
      const type = getDayType(schedule, schedulePmu, dateKey);
      const periodsK = getPeriodsForDay(schedule, dateKey);
      const periodsP = getPeriodsForDay(schedulePmu, dateKey);
      const dayPeriods = type === 'pmu' ? periodsP : periodsK;
      return {
        dateKey,
        displayShort: Utils.formatDateWithDayShort(dateKey),
        dayShort: Utils.getDayOfWeekShort(dateKey),
        dateOnly: dateKey ? `${dateKey.split('-')[0]}/${dateKey.split('-')[1]}` : '',
        type,
        periods: dayPeriods,
      };
    });
  }, [monthDays, schedule, schedulePmu]);

  const monthDisplayLabel = useMemo(() => {
    const opt = MONTH_OPTIONS.find((o) => o.value === monthInput);
    return opt ? opt.label : monthInput;
  }, [monthInput]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (monthSelectRef.current && !monthSelectRef.current.contains(e.target)) {
        setMonthSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startEdit = (dateKey) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    const type = getDayType(schedule, schedulePmu, dateKey);
    const periodsK = getPeriodsForDay(schedule, dateKey);
    const periodsP = getPeriodsForDay(schedulePmu, dateKey);
    const currentPeriods = type === 'pmu' ? periodsP : type === 'kosmetika' ? periodsK : [];
    setEditingDateKey(dateKey);
    setEditType(type);
    setEditPeriods(currentPeriods.length ? currentPeriods.map((p) => ({ ...p })) : []);
    setEditWorkStart('09:00');
    setEditWorkEnd('17:00');
    setTimeError('');
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setTimeError('');
    closeTimeoutRef.current = setTimeout(() => setEditingDateKey(null), 300);
  };

  const addEditPeriod = () => {
    setTimeError('');
    if (!isValidTimeRange(editWorkStart, editWorkEnd)) {
      setTimeError('Konec musí být po začátku');
      return;
    }
    setEditPeriods((prev) =>
      [...prev, { start: editWorkStart, end: editWorkEnd }].sort(
        (a, b) => Utils.timeToMinutes(a.start) - Utils.timeToMinutes(b.start)
      )
    );
  };

  const removeEditPeriod = (idx) => {
    setEditPeriods((prev) => prev.filter((_, i) => i !== idx));
    setTimeError('');
  };

  const updateEditPeriod = (idx, field, value) => {
    setEditPeriods((prev) => {
      const next = prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p));
      return next;
    });
    setTimeError('');
  };

  const saveEdit = async () => {
    if (!editingDateKey || !onSaveDay) return;
    if (editType !== 'closed' && editPeriods.some((p) => !isValidTimeRange(p.start, p.end))) {
      setTimeError('Každý blok musí mít konec po začátku');
      return;
    }
    setTimeError('');
    const typeToSave = editType;
    const periodsToSave = typeToSave === 'closed' ? [] : editPeriods.filter((p) => isValidTimeRange(p.start, p.end));
    await onSaveDay(editingDateKey, typeToSave, periodsToSave);
    closeDrawer();
  };

  const isDrawerOpen = !!editingDateKey;

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden" style={{ boxShadow: 'none' }}>
        <div className="p-6 md:p-8 pb-4">
          <h2 className="font-display text-xl font-semibold text-stone-800 mb-1 flex items-center gap-2">
            <Calendar size={20} className="text-stone-400" />
            Seznam směn
          </h2>
          <p className="text-sm text-stone-500 font-normal mb-6">
            Kliknutím na řádek otevřete úpravu směny (Kosmetika / PMU).
          </p>

          {/* Custom Select: Měsíc Rok – na mobilu větší dotyková plocha */}
          <div className="mb-6 relative" ref={monthSelectRef}>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Měsíc
            </label>
            <button
              type="button"
              onClick={() => setMonthSelectOpen((o) => !o)}
              className="flex items-center justify-between w-full max-w-[220px] min-h-12 h-12 md:h-12 px-4 py-3 md:py-0 border border-stone-200 rounded-lg bg-white text-stone-800 font-normal text-left hover:border-stone-300 transition-colors touch-manipulation"
              style={{ boxShadow: 'none', minHeight: '44px' }}
              aria-expanded={monthSelectOpen}
              aria-haspopup="listbox"
              aria-label="Vybrat měsíc"
            >
              <span>{monthDisplayLabel}</span>
              <ChevronDown size={20} className="text-stone-400 shrink-0 ml-2" />
            </button>
            {monthSelectOpen && (
              <ul
                role="listbox"
                className="absolute top-full left-0 mt-1 w-full max-w-[220px] max-h-60 overflow-y-auto border border-stone-200 rounded-lg bg-white py-1 z-10"
                style={{ boxShadow: 'none' }}
              >
                {MONTH_OPTIONS.map((opt) => (
                  <li key={opt.value} role="option" aria-selected={monthInput === opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        setMonthInput(opt.value);
                        setMonthSelectOpen(false);
                      }}
                      className={`w-full px-4 py-3 md:py-2.5 text-left text-sm font-normal transition-colors min-h-[44px] md:min-h-0 flex items-center touch-manipulation ${
                        monthInput === opt.value ? 'bg-stone-100 text-stone-800' : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="max-h-[440px] overflow-y-auto">
          {monthShifts.length === 0 ? (
            <p className="text-sm text-stone-500 font-normal italic px-6 pb-6">Žádné dny v měsíci.</p>
          ) : (
            <ul className="px-6 pb-6">
              {monthShifts.map(({ dateKey, dayShort, dateOnly, type, periods: dayPeriods }) => (
                <li key={dateKey} className="border-b last:border-b-0" style={{ borderColor: '#f0f0f0' }}>
                  <button
                    type="button"
                    onClick={() => startEdit(dateKey)}
                    className="w-full flex flex-wrap justify-between items-center gap-3 py-4 text-left transition-colors hover:bg-[#FAF7F2] focus:outline-none focus:bg-[#FAF7F2]"
                    style={{ paddingLeft: 0, paddingRight: 0 }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-stone-500 text-sm font-normal">{dayShort}</span>
                      <span className="text-stone-800 font-semibold text-sm">{dateOnly}</span>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0"
                      style={{ backgroundColor: '#FAF7F2', color: type === 'closed' ? '#a8a29e' : '#57534e' }}
                    >
                      {TYPE_LABELS_UPPER[type]}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 basis-full sm:basis-auto sm:flex-initial order-3 sm:order-none">
                      {dayPeriods.length > 0 ? (
                        <span className="text-sm text-stone-600 font-normal">
                          {dayPeriods.map((p) => `${p.start} — ${p.end}`).join(', ')}
                        </span>
                      ) : (
                        <span className="text-sm text-stone-400 font-normal italic">—</span>
                      )}
                      <ChevronRight size={18} className="text-stone-300 shrink-0" aria-hidden />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Slide-over (desktop) / Bottom Sheet (mobil) */}
      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40 transition-opacity"
            aria-hidden
            onClick={closeDrawer}
          />
          {/* Panel: na mobilu zdola (bottom sheet), na md+ zprava (slide-over) */}
          <div
            className={`
              fixed z-50 flex flex-col bg-white shadow-lg transition-transform duration-300 ease-out
              left-0 right-0 bottom-0 w-full max-h-[90vh] rounded-t-2xl
              md:top-0 md:bottom-0 md:left-auto md:right-0 md:max-w-md md:max-h-none md:rounded-none
              ${drawerVisible ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}
            `}
            style={{ backgroundColor: '#FFFFFF' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
          >
            {/* Handle – pouze na mobilu */}
            <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0" aria-hidden>
              <span className="w-10 h-1 rounded-full bg-stone-300" />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-6 pb-36 md:pb-32">
                <h2 id="drawer-title" className="text-lg font-semibold text-stone-800 mb-6">
                  Upravit: {editingDateKey ? Utils.formatDateWithDayLong(editingDateKey) : ''}
                </h2>

                {/* Přepínač: Kosmetika / PMU / Zavřeno */}
                <fieldset className="mb-6">
                  <legend className="sr-only">Typ dne</legend>
                  <div className="flex rounded-lg border border-stone-200 p-0.5 bg-stone-50/50">
                    {(['kosmetika', 'pmu', 'closed']).map((t) => (
                      <label
                        key={t}
                        className={`flex-1 py-2.5 px-4 text-center text-sm font-semibold rounded-md cursor-pointer transition-colors min-h-[44px] md:min-h-0 flex items-center justify-center ${
                          editType === t
                            ? 'bg-white text-stone-800 shadow-sm border border-stone-200'
                            : 'text-stone-600 hover:text-stone-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dayType"
                          value={t}
                          checked={editType === t}
                          onChange={() => setEditType(t)}
                          className="sr-only"
                        />
                        {TYPE_LABELS[t]}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {editType !== 'closed' && (
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Časové bloky
                    </p>
                    {editPeriods.length === 0 ? (
                      <p className="text-sm text-stone-500 font-normal italic">Žádné bloky. Přidejte níže.</p>
                    ) : (
                      <ul className="space-y-4">
                        {editPeriods.map((p, idx) => (
                          <li
                            key={idx}
                            className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3 p-4 bg-stone-50 rounded-lg border border-stone-100"
                          >
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:flex-1 md:min-w-0">
                              <input
                                type="time"
                                value={p.start}
                                onChange={(e) => updateEditPeriod(idx, 'start', e.target.value)}
                                className="flex-1 min-h-[44px] min-w-0 p-3 border border-stone-200 rounded-lg text-base font-normal text-stone-800 bg-white touch-manipulation"
                              />
                              <span className="hidden md:inline text-stone-400 font-normal">—</span>
                              <input
                                type="time"
                                value={p.end}
                                onChange={(e) => updateEditPeriod(idx, 'end', e.target.value)}
                                className="flex-1 min-h-[44px] min-w-0 p-3 border border-stone-200 rounded-lg text-base font-normal text-stone-800 bg-white touch-manipulation"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeEditPeriod(idx)}
                              className="p-2.5 md:p-2 self-start md:self-center text-stone-400 hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0 touch-manipulation"
                              title="Odebrat blok"
                              aria-label="Odebrat blok"
                            >
                              <X size={18} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:flex-1 md:min-w-0">
                        <input
                          type="time"
                          value={editWorkStart}
                          onChange={(e) => { setEditWorkStart(e.target.value); setTimeError(''); }}
                          className="min-h-[44px] min-w-0 p-3 border border-stone-200 rounded-lg text-base font-normal text-stone-800 bg-white touch-manipulation"
                        />
                        <span className="hidden md:inline text-stone-400 font-normal">—</span>
                        <input
                          type="time"
                          value={editWorkEnd}
                          onChange={(e) => { setEditWorkEnd(e.target.value); setTimeError(''); }}
                          className="min-h-[44px] min-w-0 p-3 border border-stone-200 rounded-lg text-base font-normal text-stone-800 bg-white touch-manipulation"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addEditPeriod}
                        className="w-full md:w-auto py-3 px-4 rounded-lg text-sm font-semibold text-stone-700 border border-stone-200 bg-white hover:bg-stone-50 transition-colors min-h-[44px] touch-manipulation"
                      >
                        <Plus size={16} className="inline mr-1.5 align-middle" />
                        Přidat blok
                      </button>
                    </div>
                    {timeError && (
                      <p className="text-sm text-red-600 font-normal" role="alert">
                        {timeError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Fixní patička – na mobilu sloupcově, Uložit full width, Zrušit jako odkaz */}
            <div
              className="absolute bottom-0 left-0 right-0 p-4 pt-3 border-t border-stone-100 bg-white flex flex-col gap-3 md:flex-row md:gap-3"
              style={{ backgroundColor: '#FFFFFF' }}
            >
              <button
                type="button"
                onClick={saveEdit}
                className="w-full bg-stone-800 text-white py-3.5 md:py-3 rounded-lg text-sm font-semibold hover:bg-stone-900 transition-colors min-h-[44px] touch-manipulation md:flex-1"
              >
                Uložit změny
              </button>
              <button
                type="button"
                onClick={closeDrawer}
                className="w-full md:w-auto py-3 md:py-3 rounded-lg text-sm font-normal text-stone-600 hover:text-stone-800 bg-transparent hover:underline text-center touch-manipulation min-h-[44px] md:min-h-0 flex items-center justify-center md:px-5"
              >
                Zrušit
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AdminShiftsTab;

```


--- SOUBOR: src/components/admin/AdminTransformationsSubTab.jsx ---
```javascript
import React, { useState, useEffect, useMemo } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Upload, Trash2, ImageIcon } from 'lucide-react';
import { storage, getCollectionPath, getDocPath } from '../../firebaseConfig';
import { COSMETICS_CATEGORY, PMU_CATEGORY, TRANSFORMATIONS_COLLECTION, STORAGE_TRANSFORMATIONS_PREFIX } from '../../constants/cosmetics';
import CategoryToggle from './CategoryToggle';

// Client-side image optimization before upload to Storage.
// Keeps quality high, but limits max dimension so loading is much faster.
export async function createOptimizedImageFile(file, maxSize = 1600, quality = 0.85) {
  if (!file) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('Nepodařilo se načíst obrázek.'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const optimizedFile = new File(
                [blob],
                file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '.jpg'),
                { type: 'image/jpeg' }
              );
              resolve(optimizedFile);
            },
            'image/jpeg',
            quality
          );
        } catch (e) {
          resolve(file);
        }
      };
      img.onerror = () => reject(new Error('Nepodařilo se načíst obrázek pro zmenšení.'));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminTransformationsSubTab() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState(COSMETICS_CATEGORY);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageBeforeFile, setImageBeforeFile] = useState(null);
  const [imageAfterFile, setImageAfterFile] = useState(null);
  const [itemsCosmetics, setItemsCosmetics] = useState([]);
  const [itemsPmu, setItemsPmu] = useState([]);

  const colRef = getCollectionPath(TRANSFORMATIONS_COLLECTION);

  useEffect(() => {
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItemsCosmetics(all.filter((item) => (item.category || COSMETICS_CATEGORY) === COSMETICS_CATEGORY));
        setItemsPmu(all.filter((item) => item.category === PMU_CATEGORY));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Nepodařilo se načíst proměny.');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const items = useMemo(() => {
    const merged = [...itemsCosmetics, ...itemsPmu];
    merged.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return merged;
  }, [itemsCosmetics, itemsPmu]);

  const canSave = imageBeforeFile && imageAfterFile && (title || '').trim().length > 0;

  const handleAdd = async () => {
    if (!imageBeforeFile || !imageAfterFile) {
      setError('Pro uložení musíte nahrát oba obrázky: Před i Po.');
      return;
    }
    const trimmedTitle = (title || '').trim();
    if (!trimmedTitle) {
      setError('Vyplňte název (např. Akné).');
      return;
    }
    setUploading(true);
    setError('');
    try {
      // Optimalizace obrázků před nahráním – max ~1600px delší strana, JPEG s kvalitním kompresním poměrem.
      const optimizedBefore = await createOptimizedImageFile(imageBeforeFile);
      const optimizedAfter = await createOptimizedImageFile(imageAfterFile);

      const ts = Date.now();
      const safe = (f) => (f?.name || 'image').replace(/[^a-zA-Z0-9.-]/g, '_');
      const pathBefore = `${STORAGE_TRANSFORMATIONS_PREFIX}/${ts}-before-${safe(optimizedBefore)}`;
      const pathAfter = `${STORAGE_TRANSFORMATIONS_PREFIX}/${ts}-after-${safe(optimizedAfter)}`;
      const refBefore = ref(storage, pathBefore);
      const refAfter = ref(storage, pathAfter);
      await uploadBytes(refBefore, optimizedBefore || imageBeforeFile);
      await uploadBytes(refAfter, optimizedAfter || imageAfterFile);
      const imageBeforeUrl = await getDownloadURL(refBefore);
      const imageAfterUrl = await getDownloadURL(refAfter);
      await addDoc(colRef, {
        imageBeforeUrl,
        imageAfterUrl,
        title: trimmedTitle,
        description: (description || '').trim(),
        category: category || COSMETICS_CATEGORY,
        createdAt: new Date().toISOString(),
      });
      setTitle('');
      setDescription('');
      setImageBeforeFile(null);
      setImageAfterFile(null);
      const beforeInput = document.getElementById('transformation-before-input');
      const afterInput = document.getElementById('transformation-after-input');
      if (beforeInput) beforeInput.value = '';
      if (afterInput) afterInput.value = '';
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Nahrání se nezdařilo. Zkontrolujte Storage a pravidla.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Tuto proměnu (před/po) odebrat?')) return;
    try {
      await deleteDoc(getDocPath(TRANSFORMATIONS_COLLECTION, id));
    } catch (e) {
      console.error(e);
      setError('Nepodařilo se smazat.');
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-stone-500">
        Načítám proměny…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-500 mb-4">
        Před/po dvojice pro sekci „Proměny“. Vyberte, zda jde na stránku <strong>Kosmetika</strong> nebo <strong>PMU</strong>. <strong>Oba obrázky jsou povinné.</strong>
      </p>
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Kde se zobrazí</span>
          <CategoryToggle value={category} onChange={setCategory} disabled={uploading} />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-stone-500">Upload Před</span>
            <label className="flex flex-col items-center justify-center min-h-[120px] px-4 py-4 rounded-lg border-2 border-dashed border-stone-300 bg-white cursor-pointer hover:border-stone-400 hover:bg-stone-50/50 transition-colors">
              <Upload size={24} className="text-stone-400 mb-1" />
              <span className="text-sm font-medium text-stone-600">
                {imageBeforeFile ? imageBeforeFile.name : 'Vybrat obrázek Před'}
              </span>
              <input
                id="transformation-before-input"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => setImageBeforeFile(e.target.files?.[0] || null)}
              />
            </label>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-stone-500">Upload Po</span>
            <label className="flex flex-col items-center justify-center min-h-[120px] px-4 py-4 rounded-lg border-2 border-dashed border-stone-300 bg-white cursor-pointer hover:border-stone-400 hover:bg-stone-50/50 transition-colors">
              <Upload size={24} className="text-stone-400 mb-1" />
              <span className="text-sm font-medium text-stone-600">
                {imageAfterFile ? imageAfterFile.name : 'Vybrat obrázek Po'}
              </span>
              <input
                id="transformation-after-input"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => setImageAfterFile(e.target.files?.[0] || null)}
              />
            </label>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Název (povinné) <span className="text-red-500">*</span></span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="např. Akné"
            className="w-full max-w-md px-3 py-2 border border-stone-200 rounded-lg text-stone-800"
            disabled={uploading}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Popis (volitelné)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Krátký popis výsledku"
            rows={2}
            className="w-full max-w-md px-3 py-2 border border-stone-200 rounded-lg text-stone-800"
            disabled={uploading}
          />
        </label>

        <button
          type="button"
          onClick={handleAdd}
          disabled={uploading || !canSave}
          className="skin-accent px-6 py-3 rounded-xl text-sm font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Nahrávám…' : 'Přidat proměnu'}
        </button>
        {!canSave && (imageBeforeFile || imageAfterFile || title) && (
          <p className="text-xs text-amber-700">
            Pro uložení jsou potřeba oba obrázky (Před i Po) a vyplněný název.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-stone-200 bg-white"
          >
            <div className="flex gap-2 flex-1 min-w-0">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                <img src={item.imageBeforeUrl} alt="Před" className="w-full h-full object-cover" />
              </div>
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                <img src={item.imageAfterUrl} alt="Po" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-800">{item.title || '—'}</p>
                {item.description && (
                  <p className="text-sm text-stone-600 truncate" title={item.description}>{item.description}</p>
                )}
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    item.category === PMU_CATEGORY ? 'bg-[#B37E76]/90 text-white' : 'bg-stone-600/90 text-white'
                  }`}
                >
                  {item.category === PMU_CATEGORY ? 'PMU' : 'Kosmetika'}
                </span>
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                aria-label="Odebrat"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && !uploading && (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-stone-200 text-stone-400">
          <ImageIcon size={40} className="mb-2" />
          <p className="text-sm">Zatím žádné před/po proměny. Vyberte oba obrázky a vyplňte název.</p>
        </div>
      )}
    </div>
  );
}

```


--- SOUBOR: src/components/admin/CategoryToggle.jsx ---
```javascript
import React from 'react';
import { PHOTO_CATEGORIES, COSMETICS_CATEGORY, PMU_CATEGORY } from '../../constants/cosmetics';

/**
 * Segmented control for photo category: [ Kosmetika ] | [ PMU ].
 * Kosmetika = default/light. PMU = dark/gold to indicate destination.
 */
export default function CategoryToggle({ value, onChange, disabled }) {
  return (
    <div className="flex rounded-xl border border-stone-200 bg-stone-100 p-1 w-full max-w-md">
      {PHOTO_CATEGORIES.map((cat) => {
        const isCosmetics = cat.value === COSMETICS_CATEGORY;
        const isPmu = cat.value === PMU_CATEGORY;
        const isSelected = value === cat.value;
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => onChange(cat.value)}
            disabled={disabled}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              isSelected
                ? isPmu
                  ? 'bg-gradient-to-r from-[#B37E76] via-[#D49A91] to-[#B37E76] text-white shadow-md border border-[#D49A91]/20'
                  : 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-800'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

```


--- SOUBOR: src/components/admin/ManualBookingModal.jsx ---
```javascript
import React from 'react';
import { X } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const CATEGORY_KOSMETIKA = 'kosmetika';
const CATEGORY_PMU = 'pmu';
const SERVICE_CATEGORY_STANDARD = 'STANDARD';
const SERVICE_CATEGORY_PMU = 'PMU';

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

  const selectedCategory = manualForm.category ?? null;
  const isPmu = selectedCategory === CATEGORY_PMU;
  const filteredServices = selectedCategory
    ? services.filter(
        (s) => (s.category || SERVICE_CATEGORY_STANDARD) === (isPmu ? SERVICE_CATEGORY_PMU : SERVICE_CATEGORY_STANDARD)
      )
    : [];

  const handleCategoryChange = (cat) => {
    setManualForm({ ...manualForm, category: cat, serviceId: '', time: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto border-2 transition-colors ${
          isPmu ? 'border-[var(--pmu-color)]' : 'border-transparent'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-xl font-bold text-stone-900">Manuální rezervace</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-stone-400 block mb-2">Kategorie</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleCategoryChange(CATEGORY_KOSMETIKA)}
                className={`category-btn py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border-2 ${
                  selectedCategory === CATEGORY_KOSMETIKA
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700'
                }`}
              >
                Kosmetika
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange(CATEGORY_PMU)}
                className={`category-btn py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border-2 ${
                  selectedCategory === CATEGORY_PMU
                    ? 'bg-[var(--pmu-color)] text-white border-[var(--pmu-color)]'
                    : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700'
                }`}
              >
                PMU
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-stone-400">Služba</label>
            <select
              required
              disabled={!selectedCategory}
              className="w-full p-3 border rounded-lg text-sm bg-white disabled:opacity-60 disabled:cursor-not-allowed"
              value={manualForm.serviceId}
              onChange={(e) => setManualForm({ ...manualForm, serviceId: e.target.value, time: '' })}
            >
              <option value="">
                {selectedCategory ? 'Vyberte službu...' : 'Nejdříve zvolte kategorii'}
              </option>
              {filteredServices.map((s) => (
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
              type="tel"
              placeholder="Telefon (volitelné)"
              className="w-full p-3 border rounded-lg text-sm"
              value={manualForm.phone}
              onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email (volitelné)"
              className="w-full p-3 border rounded-lg text-sm"
              value={manualForm.email}
              onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
            />
            <label className="flex items-center gap-3 cursor-pointer text-sm text-stone-600">
              <input
                type="checkbox"
                checked={manualForm.sendNotification !== false}
                onChange={(e) => setManualForm({ ...manualForm, sendNotification: e.target.checked })}
                className="w-4 h-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
              />
              <span>Odeslat potvrzení</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white py-3 rounded-lg font-bold text-xs uppercase transition-all disabled:opacity-50 ${
              isPmu
                ? 'bg-[var(--pmu-color)] hover:opacity-90 border-2 border-[var(--pmu-color)]'
                : 'bg-stone-800 hover:bg-black border-2 border-stone-800'
            }`}
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
            <h3 className="font-display text-xl font-bold text-stone-900">{order.name}</h3>
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
          {order.phone && (
            <div className="flex gap-3 items-center">
              <Phone size={16} /> <a href={`tel:${order.phone}`} className="hover:underline">{order.phone}</a>
            </div>
          )}
          {order.email && (
            <div className="flex gap-3 items-center">
              <Mail size={16} /> <a href={`mailto:${order.email}`} className="hover:underline truncate w-48 block">{order.email}</a>
            </div>
          )}
          {!order.phone && !order.email && (
            <div className="text-stone-400 text-xs">Bez kontaktu</div>
          )}
        </div>

        <div className="flex gap-3 mb-3">
          {order.phone && (
            <a href={`tel:${order.phone}`} className="flex-1 bg-stone-800 text-white py-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors">
              <Phone size={14} /> Zavolat
            </a>
          )}
          {order.email && (
            <a href={`mailto:${order.email}`} className={`${order.phone ? 'flex-1' : 'w-full'} bg-white border border-stone-200 text-stone-800 py-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors`}>
              <Mail size={14} /> E-mail
            </a>
          )}
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
        <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2 text-stone-900">
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
import { Mail, UserX } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const hasContact = (val) => (val != null && String(val).trim() !== '');

const ReservationList = ({ data, emptyMsg, onSelectOrder, todayKey }) => (
  <div className="space-y-3">
    {data.length === 0 && (
      <div className="text-center py-10 bg-stone-50 rounded-xl border border-stone-100">
        <p className="text-stone-400 italic text-sm">{emptyMsg}</p>
      </div>
    )}

    {data.map((res) => {
      const isToday = res.date === todayKey;
      const isAnonymous = !hasContact(res.phone) && !hasContact(res.email);
      return (
        <div
          key={res.id}
          onClick={() => onSelectOrder(res)}
          title={isAnonymous ? 'Bez kontaktních údajů' : undefined}
          className={`group relative p-4 bg-white rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md
            ${isToday ? 'border-l-4 border-l-stone-800 border-stone-200' : 'border border-stone-100 hover:border-stone-300'}
            ${isAnonymous ? 'border-dashed border-2 border-stone-400' : 'border-solid'}
          `}
          style={isAnonymous ? { opacity: 0.85 } : undefined}
        >
          <div className="flex justify-between items-start">
            <div className="flex gap-4 items-center">
              <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${isToday ? 'bg-stone-800 text-white' : 'bg-stone-50 text-stone-500'}`}>
                <span className="text-lg font-bold leading-none">{res.time}</span>
              </div>
              <div>
                <h4 className="font-bold text-stone-900 flex items-center gap-2">
                  {res.name}
                  {isAnonymous && (
                    <UserX size={14} className="text-stone-400 shrink-0" aria-hidden />
                  )}
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
              <div className="text-xs font-bold text-stone-400">{res.phone || res.email || '—'}</div>
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


--- SOUBOR: src/components/admin/ShiftOverview.jsx ---
```javascript
import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Trash2, Plus } from 'lucide-react';
import { Utils } from '../../utils/helpers';

const WEEKDAY_LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const MONTH_NAMES = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];

function dateKeyToISO(dateKey) {
  if (!dateKey) return '';
  const [d, m, y] = dateKey.split('-');
  return `${y}-${m}-${d}`;
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - (day === 0 ? 7 : day) + 1;
  const monday = new Date(date);
  monday.setDate(diff);
  return monday;
}

function getWeekRange(monday) {
  const sun = new Date(monday);
  sun.setDate(monday.getDate() + 6);
  return {
    mon: monday.getDate() + '. ' + (monday.getMonth() + 1) + '.',
    sun: sun.getDate() + '. ' + (sun.getMonth() + 1) + '.',
    weekNum: getISOWeekNum(monday),
  };
}

function getISOWeekNum(d) {
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const mon = getMonday(jan4);
  const thisMon = getMonday(d);
  const diff = Math.round((thisMon - mon) / 86400000);
  return Math.floor(diff / 7) + 1;
}

function formatTimeRange(periods) {
  if (!periods?.length) return null;
  const first = periods[0];
  const start = first.start ?? '';
  const end = first.end ?? '';
  if (periods.length === 1) return `${start} – ${end}`;
  return `${start} – ${end} (+${periods.length - 1})`;
}

export default function ShiftOverview({
  schedule = {},
  schedulePmu = {},
  adminDateInput,
  setAdminDateInput,
  scheduleType,
  setScheduleType,
  onShift,
  getDocPath,
  setDoc,
  deleteDoc,
}) {
  const [viewDate, setViewDate] = useState(() => {
    if (adminDateInput) {
      const [y, m] = adminDateInput.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const todayKey = Utils.formatDateKey(new Date());

  const { daysInGrid, stats, listByWeek } = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    const firstDayOfWeek = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();
    const leadingEmpty = firstDayOfWeek;
    const totalCells = leadingEmpty + daysInMonth;
    const rows = Math.ceil(totalCells / 7);
    const gridCells = [];

    let standardDays = 0;
    let pmuDays = 0;

    for (let i = 0; i < leadingEmpty; i++) gridCells.push({ empty: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dateKey = Utils.formatDateKey(date);
      const stdData = schedule[dateKey];
      const pmuData = schedulePmu[dateKey];
      const stdPeriods = stdData?.periods || (stdData?.start ? [{ start: stdData.start, end: stdData.end }] : []);
      const pmuPeriods = pmuData?.periods || (pmuData?.start ? [{ start: pmuData.start, end: pmuData.end }] : []);
      const hasStandard = stdPeriods.length > 0;
      const hasPmu = pmuPeriods.length > 0;
      if (hasStandard) standardDays++;
      if (hasPmu) pmuDays++;

      gridCells.push({
        empty: false,
        dateKey,
        date,
        day: d,
        hasStandard,
        hasPmu,
        stdPeriods,
        pmuPeriods,
        stdTime: formatTimeRange(stdPeriods),
        pmuTime: formatTimeRange(pmuPeriods),
      });
    }
    while (gridCells.length < rows * 7) gridCells.push({ empty: true });

    const daysWithAnyShift = new Set();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dateKey = Utils.formatDateKey(date);
      const hasStd = (schedule[dateKey]?.periods?.length || schedule[dateKey]?.start);
      const hasPmu = (schedulePmu[dateKey]?.periods?.length || schedulePmu[dateKey]?.start);
      if (hasStd || hasPmu) daysWithAnyShift.add(dateKey);
    }
    const stats = { standard: standardDays, pmu: pmuDays, off: Math.max(0, daysInMonth - daysWithAnyShift.size) };

    const listItems = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dateKey = Utils.formatDateKey(date);
      const stdData = schedule[dateKey];
      const pmuData = schedulePmu[dateKey];
      const stdPeriods = stdData?.periods || (stdData?.start ? [{ start: stdData.start, end: stdData.end }] : []);
      const pmuPeriods = pmuData?.periods || (pmuData?.start ? [{ start: pmuData.start, end: pmuData.end }] : []);
      if (stdPeriods.length > 0) {
        listItems.push({ dateKey, date, type: 'standard', periods: stdPeriods, label: 'Standard' });
      }
      if (pmuPeriods.length > 0) {
        listItems.push({ dateKey, date, type: 'pmu', periods: pmuPeriods, label: 'PMU' });
      }
    }

    const byWeek = {};
    listItems.forEach((item) => {
      const mon = getMonday(item.date);
      const key = Utils.formatDateKey(mon);
      if (!byWeek[key]) byWeek[key] = { ...getWeekRange(mon), items: [] };
      byWeek[key].items.push(item);
    });
    const listByWeek = Object.values(byWeek).sort((a, b) => a.items[0]?.date - b.items[0]?.date);

    return { daysInGrid: gridCells, stats, listByWeek };
  }, [viewYear, viewMonth, schedule, schedulePmu]);

  const prevMonth = () => setViewDate(new Date(viewYear, viewMonth - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewYear, viewMonth + 1, 1));

  const handleCellClick = (cell) => {
    if (cell.empty) return;
    setAdminDateInput(dateKeyToISO(cell.dateKey));
    if (cell.hasPmu && !cell.hasStandard) setScheduleType('pmu');
    else if (cell.hasStandard) setScheduleType('standard');
    const formEl = document.getElementById('shift-edit-form');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRemoveShift = async (dateKey, type) => {
    const col = type === 'pmu' ? 'schedule_pmu' : 'schedule';
    const ref = getDocPath(col, dateKey);
    await deleteDoc(ref);
  };

  const monthDays = useMemo(
    () => daysInGrid.filter((c) => !c.empty),
    [daysInGrid]
  );

  return (
    <div className="space-y-6">
      {/* Month selector: sticky on mobile, static on desktop */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 md:static md:mx-0 md:px-0 md:py-0 bg-white/95 backdrop-blur-sm md:bg-transparent border-b border-stone-100 md:border-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 touch-manipulation"
              aria-label="Předchozí měsíc"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="font-display font-semibold text-stone-800 text-lg min-w-[160px] text-center">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h3>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 touch-manipulation"
              aria-label="Následující měsíc"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="text-sm text-stone-500 flex flex-wrap gap-x-4 gap-y-1 md:block">
            <span><strong className="text-stone-700">Standard:</strong> {stats.standard} dní</span>
            <span><strong className="text-stone-700">PMU:</strong> {stats.pmu} dní</span>
            <span><strong className="text-stone-700">Volno:</strong> {stats.off} dní</span>
          </div>
        </div>
      </div>

      {/* Desktop: 7-column calendar grid */}
      <div className="hidden md:grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center text-[10px] font-bold text-stone-400 uppercase tracking-wider py-1">
            {label}
          </div>
        ))}
        {daysInGrid.map((cell, idx) => {
          if (cell.empty) {
            return <div key={idx} className="aspect-square min-h-[52px]" />;
          }
          const isToday = cell.dateKey === todayKey;
          const hasAny = cell.hasStandard || cell.hasPmu;
          const isPmuOnly = cell.hasPmu && !cell.hasStandard;
          const isStandardOnly = cell.hasStandard && !cell.hasPmu;
          const isBoth = cell.hasStandard && cell.hasPmu;

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => handleCellClick(cell)}
              className={`
                aspect-square min-h-[52px] rounded-lg border flex flex-col items-center justify-center text-xs transition-all
                ${!hasAny ? 'group bg-stone-50 border-stone-100 text-stone-400 hover:bg-stone-100 hover:border-stone-200 hover:text-stone-600' : ''}
                ${cell.hasStandard ? 'bg-stone-100 border-stone-200 text-stone-800' : ''}
                ${cell.hasPmu ? 'bg-stone-900 border-stone-700 text-amber-100' : ''}
                ${isBoth ? 'bg-stone-800 border-stone-600 text-amber-100' : ''}
              `}
            >
              <span className={`font-semibold ${isToday ? 'w-6 h-6 rounded-full ring-2 ring-amber-500 ring-offset-2 ring-offset-inherit flex items-center justify-center text-[10px]' : ''}`}>
                {cell.day}
              </span>
              {hasAny && (
                <span className="mt-0.5 truncate w-full px-0.5 text-[10px]">
                  {isBoth ? 'S + P' : cell.stdTime || cell.pmuTime}
                </span>
              )}
              {!hasAny && <span className="text-[9px] opacity-0 group-hover:opacity-100 mt-0.5 transition-opacity">Přidat směnu</span>}
            </button>
          );
        })}
      </div>

      {/* Mobile: vertical agenda (day cards) */}
      <div className="flex flex-col gap-2 md:hidden pb-2">
        {monthDays.map((cell) => {
          const isToday = cell.dateKey === todayKey;
          const hasAny = cell.hasStandard || cell.hasPmu;
          const isPmuOnly = cell.hasPmu && !cell.hasStandard;
          const isStandardOnly = cell.hasStandard && !cell.hasPmu;
          const isBoth = cell.hasStandard && cell.hasPmu;
          const dayLabel = cell.date.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' });

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => handleCellClick(cell)}
              className={`
                w-full min-h-[60px] rounded-lg flex items-center justify-between gap-3 px-4 py-3 text-left
                touch-manipulation active:scale-[0.99] transition-transform
                ${!hasAny
                  ? 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-50 hover:border-stone-300'
                  : ''
                }
                ${isStandardOnly
                  ? 'bg-stone-50 border-l-4 border-stone-300 border border-stone-100 text-stone-800'
                  : ''
                }
                ${isPmuOnly || isBoth
                  ? 'bg-stone-900 border-l-4 border-amber-500 border border-stone-800 text-amber-50'
                  : ''
                }
              `}
            >
              <span className={`font-bold text-base shrink-0 ${isToday ? 'text-amber-600' : ''}`}>
                {dayLabel}
                {isToday && <span className="ml-1.5 text-xs font-medium">(dnes)</span>}
              </span>
              {!hasAny ? (
                <span className="shrink-0 p-2 rounded-full bg-stone-100 text-stone-400" aria-hidden>
                  <Plus size={18} />
                </span>
              ) : (
                <span className={`
                  text-xs font-semibold px-2.5 py-1 rounded-full shrink-0
                  ${isPmuOnly || isBoth ? 'bg-amber-500/20 text-amber-200' : 'bg-stone-200 text-stone-700'}
                `}>
                  {isBoth ? 'S + P' : (cell.stdTime || cell.pmuTime)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div>
        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Směny po týdnech</h4>
        <div className="space-y-4">
          {listByWeek.length === 0 && (
            <p className="text-sm text-stone-400 italic">Pro tento měsíc zatím nejsou zadané žádné směny.</p>
          )}
          {listByWeek.map((week) => (
            <div key={week.mon} className="border border-stone-200 rounded-xl overflow-hidden">
              <div className="bg-stone-50 px-3 py-2 text-xs font-bold text-stone-600 border-b border-stone-200">
                Týden {week.weekNum} ({week.mon} – {week.sun})
              </div>
              <ul className="divide-y divide-stone-100">
                {week.items.map((item, idx) => (
                  <li key={`${item.dateKey}-${item.type}-${idx}`} className="flex items-center justify-between gap-2 px-3 py-2 bg-white hover:bg-stone-50/80">
                    <span className="text-sm text-stone-700">
                      {item.date.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' })}.
                    </span>
                    <span className="text-sm font-medium text-stone-800">
                      {formatTimeRange(item.periods)}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${item.type === 'pmu' ? 'bg-stone-800 text-amber-100' : 'bg-stone-200 text-stone-700'}`}>
                      {item.label}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminDateInput(dateKeyToISO(item.dateKey));
                          setScheduleType(item.type);
                          document.getElementById('shift-edit-form')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="p-1.5 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                        aria-label="Upravit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                          type="button"
                          onClick={() => handleRemoveShift(item.dateKey, item.type)}
                          className="p-1.5 rounded text-stone-400 hover:text-red-600 hover:bg-red-50"
                          aria-label="Smazat"
                        >
                          <Trash2 size={14} />
                        </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

```


--- SOUBOR: src/constants/aiPrompts.js ---
```javascript
/**
 * System prompt for AI content formatter (Magic Wand).
 * Used to convert raw notes into luxury Markdown for Skin Studio service descriptions.
 */
export const FORMAT_CONTENT_SYSTEM_PROMPT = `You are a luxury copywriter for Skin Studio. Your tone is 'Quiet Luxury'—minimalist, professional, and empathetic.
Convert the user's raw notes into a Markdown-formatted description for a beauty service.
Rules:
1. Write the entire output in Czech.
2. Use **bold** for key benefits.
3. Use bullet points for clear structure.
4. Keep it editorial and soft-sell (don't be pushy).
5. Output only the Markdown content.`;

```


--- SOUBOR: src/constants/content.js ---
```javascript
/**
 * Centralized web content – all static Czech text for homepage, header, and footer.
 * Components import WEB_CONTENT and map these values; no hardcoded copy in JSX.
 */

export const WEB_CONTENT = {
  header: {
    brandName: 'Skin Studio',
    ariaLabelHome: 'Skin Studio – Domů',
    ariaLabelMenu: 'Menu',
    ariaLabelInstagram: 'Instagram',
    navItems: [
      { label: 'KOSMETIKA', to: '/kosmetika' },
      { label: 'PERMANENTNÍ MAKE-UP', to: '/pmu', hash: 'pmu' },
      { label: 'KONTAKT', to: '/', hash: 'kontakt' },
      { label: 'REZERVACE', to: '/rezervace', cta: true },
    ],
  },

  hero: {
    /** Single H1 for homepage – SEO: Kosmetika Uherský Brod */
    seoTitle: 'Skin Studio – Prémiová kosmetika a péče o pleť Uherský Brod',
    subtitle: 'SKIN STUDIO LUCIE METELKOVÉ',
    title: 'Vaše pleť, vaše sebevědomí.',
    signature: 'S láskou k detailu, Lucie',
    body: 'Vytvořila jsem místo, kde se čas točí jen kolem vás. Mým cílem není vás měnit, ale vyzdvihnout to nejkrásnější ve vás.',
    cta: 'Objednat termín',
  },

  /** Landing page section H2s – keyword-rich for SEO */
  landing: {
    sectionAbout: 'Kosmetika Uherský Brod – Anti-aging a péče o pleť',
    sectionServices: 'Naše služby: Laminace obočí a Lifting řas',
    sectionReviews: 'Recenze klientek ze Skin Studia',
    sectionContact: 'Kontakt – Kosmetika Skin Studio Uherský Brod',
    sectionInstagram: 'Sledujte nás na Instagramu – kosmetika a péče o pleť Uherský Brod',
  },
  /** Descriptive alt text for images (SEO + accessibility) */
  imageAlts: {
    instagramGallery: 'Kosmetika a péče o pleť – Skin Studio Lucie Metelková, Uherský Brod',
    portrait: 'Lucie Metelková – prémiová kosmetika a péče o pleť, Skin Studio Uherský Brod',
  },

  filozofie: {
    heading: 'Filozofie',
    paragraphs: [
      'Jmenuji se Lucie Metelková a kosmetika je pro mě víc než jen práce – je to spojení odbornosti, relaxace a preciznosti. Kladu absolutní důraz na čistotu, špičkové postupy a zdraví vaší pleti.',
      'V mém studiu v Uherském Brodě nenajdete „pásovou výrobu“. Každá pleť je jedinečná, a proto je i každé mé ošetření 100% individuální. Ať už řešíme akné, vrásky, nebo jen toužíte po dokonalém obočí díky laminaci, mým cílem je, abyste odcházela nejen krásnější, ale i dokonale odpočatá.',
      'Zastavte se a dopřejte si svůj „Me Time“ okamžik v prostředí, kde se čas točí jen kolem vás.',
    ],
    /** Optional phrase to render in bold in the second paragraph */
    paragraph2Bold: 'Uherském Brodě',
    bullets: ['Individuální přístup', 'Kvalitní kosmetika', 'Příjemné prostředí', 'Odborná péče'],
    signatureName: 'Lucie',
  },

  pmu: {
    headline: 'Vaše já.',
    headlineItalic: 'Jen dokonalejší.',
    body: 'Mým cílem není vytvořit make-up, ale podtrhnout vaše rysy tak jemně, že si okolí všimne jen toho, jak skvěle vypadáte. Neviditelná práce, viditelný rozdíl.',
    cta: 'Více o permanentním make-upu',
  },

  promeny: {
    heading: 'Proměny',
    emptyState: 'Proměny před/po budou zobrazeny, jakmile je v administraci přidáte (Fotografie → Proměny).',
    carouselAriaLabel: 'Proměny',
    transformationAriaLabel: 'Proměna',
    defaultTitle: 'Před a po',
  },

  cenik: {
    heading: 'Ceník',
    subtext: 'Vyberte si ošetření a rezervujte termín on-line.',
    loading: 'Načítání procedur a ceníku…',
    ctaReservovat: 'Rezervovat termín',
    ctaRezervovatShort: 'Rezervovat',
  },

  footer: {
    brandHeading: 'SKIN STUDIO',
    ownerName: 'Lucie Metelková',
    /** Word to replace with Red Outline Heart icon (e.g. "srdci" → icon) */
    heartReplacementWord: 'srdci',
    tagline: 'Prémiová péče o pleť a permanentní make-up v srdci Uherského Brodu.',
    contactHeading: 'KONTAKT',
    location: 'Masarykovo náměstí 72 (Budova ČSOB – 1. patro), Uherský Brod',
    locationWithTown: 'Masarykovo náměstí 72 (Budova ČSOB – 1. patro), Uherský Brod',
    email: 'lucie@skinstudio.cz',
    phone: '+420 724 875 558',
    copyright: '© 2024 Skin Studio Lucie Metelková. Všechna práva vyhrazena.',
  },

  /** Contact section (e.g. on landing / #kontakt) */
  kontakt: {
    heading: 'Kontakt',
    subtext: 'Domluvte si termín návštěvy. Těším se na vás.',
    followHeading: 'Sledujte nás',
    locationLabel: 'Uherský Brod',
    emailPublic: 'info@skinstudio.cz',
    cta: 'Objednat termín',
    copyright: '© 2024 Skin Studio Lucie Metelková',
  },

  /** PMU page – dark theme */
  pmuPage: {
    header: {
      brandName: 'Skin Studio',
      ariaLabelHome: 'Skin Studio – Domů',
      ariaLabelMenu: 'Menu',
      navKosmetika: 'KOSMETIKA',
      navFilozofie: 'FILOZOFIE',
      navPortfolio: 'PORTFOLIO',
      navKontakt: 'KONTAKT',
      navRezervace: 'Rezervace',
    },
    hero: {
      subtitle: 'Permanent Make-Up',
      title: 'Umění trvalé krásy',
      body: 'Precizní linky. Přirozený výsledek. Výjimečný zážitek.',
      cta: 'Objednat konzultaci',
    },
    philosophy: {
      heading: 'Filozofie',
      subheading: 'Jemnost, která zůstává',
      paragraphs: [
        'Permanentní make-up vnímám jako neviditelného pomocníka. Jeho úkolem není přebít vaši tvář, ale tiše podtrhnout to, co je na ní krásné.',
        'Pracuji tak, aby výsledek působil vzdušně a přirozeně. Cílem je, abyste se ráno probudila s pocitem, že jste upravená, ale stále jste to vy.',
      ],
    },
    portfolio: {
      heading: 'Portfolio',
      carouselAriaLabel: 'PMU proměny',
      transformationAriaLabel: 'Proměna',
      defaultTitle: 'Před a po',
      demoNote: 'Demo – vlastní před/po přidáte v adminu v záložce Fotografie → Proměny (kategorie PMU).',
    },
    cenik: {
      heading: 'Ceník a rezervace',
      loading: 'Služby se připravují…',
      priceNote: 'Přesné ceny a termíny vám sdělíme při rezervaci nebo na konzultaci.',
      priceDleCeniku: 'dle ceníku',
      cta: 'Rezervovat termín',
    },
    /** Default Markdown descriptions for PMU services when not set in Firestore. Key = service name. */
    serviceDescriptionDefaults: {
      'Meziřasová linka': '**Dlouhotrvající krása:** Probouzejte se upravená každé ráno.\n\n* **Přirozený vzhled:** Žádné ostré kontury, jen jemné stínování.\n* **Výdrž:** 1,5–2 roky.',
      'Rty - Soft Lips': '**Dlouhotrvající krása:** Probouzejte se upravená každé ráno.\n\n* **Přirozený vzhled:** Žádné ostré kontury, jen jemné stínování.\n* **Výdrž:** 1,5–2 roky.',
      'Pudrové obočí': '**Dlouhotrvající krása:** Probouzejte se upravená každé ráno.\n\n* **Přirozený vzhled:** Žádné ostré kontury, jen jemné stínování.\n* **Výdrž:** 1,5–2 roky.',
    },
    rezervace: {
      heading: 'Rezervace PMU',
    },
    footer: {
      brandHeading: 'Skin Studio',
      ownerName: 'Lucie Metelková',
      heartReplacementWord: 'srdci',
      tagline: 'Prémiová péče o pleť a permanentní make-up v srdci Uherského Brodu.',
      navHeading: 'Navigace',
      navDomu: 'Domů',
      navFilozofie: 'Filozofie',
      navPortfolio: 'Portfolio',
      navCenik: 'Ceník',
      navRezervace: 'Rezervace',
      contactHeading: 'Kontakt',
      location: 'Masarykovo náměstí 72 (Budova ČSOB – 1. patro), Uherský Brod',
      email: 'lucie@skinstudio.cz',
      phone: '+420 724 875 558',
      instagramLabel: 'Instagram',
      copyright: '© 2026 Skin Studio Lucie Metelková',
    },
  },
};

```


--- SOUBOR: src/constants/cosmetics.js ---
```javascript
/**
 * Gallery & Transformations – collections and category (Cosmetics vs PMU).
 *
 * Firestore schema (Firebase only):
 *
 * gallery_items: { id, imageUrl, caption, category: 'COSMETICS' | 'PMU', createdAt? }
 * transformation_items: { id, imageBeforeUrl, imageAfterUrl, title, description?, category: 'COSMETICS' | 'PMU', createdAt? }
 *
 * Default category: COSMETICS.
 *
 * Services (Firestore `services`): each document should have category: 'STANDARD' (cosmetics)
 * or 'PMU'. STANDARD = Laminace, Lash Lifting, Peeling, Úprava obočí, Me time, Clear skin, etc.
 * PMU = Meziřasová linka, Rty - Soft Lips, Pudrové obočí. Used to filter the Light (cosmetics)
 * booking list so PMU services do not appear there.
 */
export const COSMETICS_CATEGORY = 'COSMETICS';
export const PMU_CATEGORY = 'PMU';

export const PHOTO_CATEGORIES = [
  { value: COSMETICS_CATEGORY, label: 'Kosmetika' },
  { value: PMU_CATEGORY, label: 'PMU' },
];

export const GALLERY_COLLECTION = 'gallery_items';
export const TRANSFORMATIONS_COLLECTION = 'transformation_items';
export const STORAGE_GALLERY_PREFIX = 'cosmetics/gallery';
export const STORAGE_TRANSFORMATIONS_PREFIX = 'cosmetics/transformations';

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
import { getStorage } from "firebase/storage";

// Bezpečný přístup k ENV
const getEnv = (key) => {
  try { return import.meta.env[key] || ""; } catch { return ""; }
};

// Detekce prostředí (Canvas vs Lokální Vite)
// V lokálním prostředí tyto proměnné neexistují, proto je kontrolujeme přes typeof
const isCanvas = typeof __firebase_config !== 'undefined';

const projectId = getEnv('VITE_FIREBASE_PROJECT_ID');
const storageBucketEnv = getEnv('VITE_FIREBASE_STORAGE_BUCKET');
const firebaseConfig = isCanvas
  ? JSON.parse(__firebase_config)
  : {
      apiKey: getEnv('VITE_FIREBASE_API_KEY'),
      authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId,
      storageBucket: storageBucketEnv || (projectId ? `${projectId}.appspot.com` : ''),
      messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: getEnv('VITE_FIREBASE_APP_ID'),
    };

export const EMAILJS_CONFIG = {
  SERVICE_ID: getEnv('VITE_EMAILJS_SERVICE_ID'),
  CONFIRM_TEMPLATE: getEnv('VITE_EMAILJS_CONFIRM_TEMPLATE_ID'),
  REMINDER_TEMPLATE: getEnv('VITE_EMAILJS_REMINDER_TEMPLATE_ID'),
  PUBLIC_KEY: getEnv('VITE_EMAILJS_PUBLIC_KEY')
};

// Instagram – celá URL nebo jen username (např. skinstudio.uhb)
const instagramUrl = getEnv('VITE_INSTAGRAM_URL');
const instagramUsername = getEnv('VITE_INSTAGRAM_USERNAME');
export const INSTAGRAM_URL = instagramUrl || (instagramUsername ? `https://www.instagram.com/${instagramUsername.replace(/^@/, '')}/` : '');
// Volitelné: URL příspěvků pro embed, oddělené čárkou (max cca 6)
export const INSTAGRAM_POST_URLS = (getEnv('VITE_INSTAGRAM_POST_URLS') || '').split(',').map(s => s.trim()).filter(Boolean);

// Google Recenze – stejná URL jako v QR kódu (fallback = Skin Studio place ID)
export const GOOGLE_REVIEW_URL = getEnv('VITE_GOOGLE_REVIEW_URL') || 'https://g.page/r/CWkt9xHMgMjqEAE/review';

// Inicializace
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

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

/* Skin Studio – paleta z titulky: teplý krém, zlatý akcent, uhlově černá */
:root {
  --skin-cream: #f7f4ec;
  --skin-cream-dark: #ebe7de;
  --skin-gold: #c5aa80;
  --skin-gold-dark: #a3803d;
  --skin-charcoal: #2f2f2f;
  --skin-beige-muted: #d3cfc6;
  --skin-white: #fdfcfa;
  --pmu-color: #E6B8A2;
}

@layer base {
  body {
    background-color: var(--skin-cream);
    color: var(--skin-charcoal);
  }
}

@layer components {
  .font-signature {
    font-family: 'Sacramento', cursive;
  }
  .skin-bg {
    background-color: var(--skin-cream);
  }
  .skin-bg-card {
    background-color: var(--skin-white);
  }
  .skin-text {
    color: var(--skin-charcoal);
  }
  .skin-text-muted {
    color: #6b6560;
  }
  .skin-accent {
    background-color: #8C5E35;
    color: white;
    border-radius: 9999px;
    letter-spacing: 0.05em;
    transition: background-color 0.2s ease, transform 0.2s ease;
  }
  .skin-accent:hover {
    background-color: #754d29;
    transform: scale(1.05);
  }
  .skin-accent:active {
    transform: scale(0.98);
  }
  .skin-border {
    border-color: var(--skin-beige-muted);
  }
  .font-display {
    font-family: 'Playfair Display', Georgia, serif;
  }
  .input-focus:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--skin-gold);
  }

  /* Před/po slider – portrait (4/5), cover aby vertikální fotky vyplnily rámeček */
  .comparison-slider-contain [data-rcs="image"] {
    object-fit: cover !important;
    object-position: center center;
  }

  /* Karusel Proměny – skrytí scrollbaru (pouze pokud je potřeba) */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Custom scrollbar – thin, Quiet Luxury (Transformations + any overflow-x-auto) */
  .overflow-x-auto::-webkit-scrollbar {
    height: 4px;
  }
  .overflow-x-auto::-webkit-scrollbar-track {
    background: transparent;
    margin: 0 20%;
  }
  .overflow-x-auto::-webkit-scrollbar-thumb {
    background-color: #e5e5e5;
    border-radius: 20px;
  }
  .overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background-color: #a8a29e;
  }

  /* Mobile Carousel – jen pod md, aby na mobilu vždy fungoval (redesign nesmí ho přepsat) */
  @media (max-width: 767px) {
    /* Na mobilu jen swipe, bez scrollbaru */
    .transformations-scroll {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .transformations-scroll::-webkit-scrollbar {
      display: none;
    }
    .mobile-carousel {
      display: flex;
      overflow-x: auto;
      overflow-y: hidden;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-x;
      gap: 1rem;
      padding-right: 20px;
      padding-bottom: 1rem;
      scrollbar-width: none;
      -ms-overflow-style: none;
      width: 100%;
      min-width: 0;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }
    .mobile-carousel::-webkit-scrollbar {
      display: none;
    }
    .mobile-carousel-item {
      flex: 0 0 85%;
      width: 85%;
      scroll-snap-align: start;
      min-width: 0;
      touch-action: pan-x;
    }
    /* Knihovna dává [data-rcs=root] touch-action: none – přepis, ať jde swipe na karusel */
    .mobile-carousel [data-rcs="root"] {
      touch-action: pan-x !important;
    }
    /* Handle před/po: tah musí jít na slider, ne na karusel */
    .mobile-carousel [data-rcs="handle-container"] {
      touch-action: none !important;
    }
    /* Celá oblast pod obrázky (text + padding) má být swipeovatelná */
    .mobile-carousel-item .mobile-carousel-swipe-zone {
      touch-action: pan-x;
      min-height: 48px;
    }
  }

  /* Horizontal strip (tabs, date chips) – snap + touch, no 85% width */
  .mobile-carousel-strip {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .mobile-carousel-strip::-webkit-scrollbar {
    display: none;
  }
  .mobile-carousel-strip-item {
    scroll-snap-align: start;
    flex-shrink: 0;
  }

  /* Pás termínů (dny) – na desktopu scrollovatelný včetně scrollbaru */
  @media (min-width: 768px) {
    .date-strip-scroll {
      scrollbar-width: thin;
      -ms-overflow-style: auto;
    }
    .date-strip-scroll::-webkit-scrollbar {
      display: block;
      height: 6px;
    }
    .date-strip-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .date-strip-scroll::-webkit-scrollbar-thumb {
      background-color: #d6d3d1;
      border-radius: 3px;
    }
    .date-strip-scroll::-webkit-scrollbar-thumb:hover {
      background-color: #a8a29e;
    }
  }

  /* Proměny karusel – pagination tečky (minimalistické), vždy vidět i na mobilu */
  .carousel-dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding-bottom: 8px;
    min-height: 24px;
  }
  .carousel-dots .dot {
    width: 8px;
    height: 8px;
    min-width: 8px;
    min-height: 8px;
    border-radius: 50%;
    background-color: #e0e0e0;
    transition: background-color 0.3s;
    padding: 0;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
  }
  .carousel-dots .dot:hover {
    background-color: #b0b0b0;
  }
  .carousel-dots .dot-active,
  .carousel-dots .dot.dot-active {
    background-color: #1a1a1a;
  }

  /* Před/po – menší, decentní handle (max 32px) */
  .comparison-slider-handle {
    flex-shrink: 0;
  }

  /* Žádné postranní šipky na karuselu – navigace jen swipe + tečky */
  .carousel-nav-button,
  .slick-prev,
  .slick-next {
    display: none !important;
  }

  /* 1. CHAMPAGNE GOLD BUTTON (For Light Sections) – tokens from tailwind theme */
  .btn-gold {
    @apply inline-block rounded-full px-8 py-3
           font-sans font-semibold text-xs uppercase tracking-widest text-white
           bg-gradient-to-b from-skin-gold-from to-skin-gold-to
           border-t border-white/25
           shadow-skin-gold
           transition-all duration-300;
  }
  .btn-gold:hover {
    @apply shadow-skin-gold-hover -translate-y-0.5;
  }

  /* 2. ROSE GOLD SATIN BUTTON (For Dark PMU Section) – tokens from tailwind theme */
  .btn-rose {
    @apply inline-block rounded-full px-8 py-3
           font-sans font-semibold text-xs uppercase tracking-widest text-white
           bg-gradient-to-b from-skin-rose-from via-skin-rose-via to-skin-rose-to
           border border-skin-rose-light/20
           shadow-skin-rose
           transition-all duration-300;
  }
  .btn-rose:hover {
    @apply shadow-skin-rose-hover -translate-y-0.5;
  }

  /* 3. Editorial headline – serif, tight tracking, responsive sizes */
  .headline-editorial {
    @apply font-serif tracking-tight
           text-2xl sm:text-3xl md:text-4xl lg:text-5xl;
  }

  /* 4. Body text – sans, light weight; pair with modifier for context */
  .body-text {
    @apply font-sans font-light text-skin-text;
    line-height: 1.65;
  }
  .body-text-on-dark {
    @apply font-sans font-light text-skin-base/70;
    line-height: 1.65;
  }
}

```


--- SOUBOR: src/main.jsx ---
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```


--- SOUBOR: src/setupTests.js ---
```javascript
import '@testing-library/jest-dom';
```


--- SOUBOR: src/utils/helpers.js ---
```javascript
/** Normalized category: STANDARD (cosmetics) vs PMU. Handles legacy lowercase 'pmu'. */
function normalizeCategory(category) {
  const c = (category || 'STANDARD').toString().toUpperCase();
  return c === 'PMU' ? 'PMU' : 'STANDARD';
}

/** Known PMU service name substrings – used when category is not set in Firestore. */
const KNOWN_PMU_NAMES = ['meziřasová linka', 'rty', 'pudrové obočí', 'soft lips'];

function isPmuByName(name) {
  if (!name || typeof name !== 'string') return false;
  const lower = name.toLowerCase();
  return KNOWN_PMU_NAMES.some((pattern) => lower.includes(pattern));
}

/** True if service is PMU (category 'PMU' or 'pmu', or known PMU name when category missing). */
export function isPmuService(service) {
  if (!service) return false;
  if (service.category !== undefined && service.category !== null && String(service.category).trim() !== '') {
    return normalizeCategory(service.category) === 'PMU';
  }
  return isPmuByName(service.name);
}

/** Služby bez PMU: category === 'STANDARD' nebo ne-PMU. PMU = category 'PMU' nebo známé PMU názvy. */
export function filterCosmeticsServices(services) {
  if (!Array.isArray(services)) return [];
  return services.filter((s) => !isPmuService(s));
}

/** Služby s category === 'PMU' (case-insensitive). */
export function filterPmuServices(services) {
  if (!Array.isArray(services)) return [];
  return services.filter((s) => isPmuService(s));
}

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

  /** dateKey DD-MM-YYYY → krátký den v týdnu (Po, Út, …) */
  getDayOfWeekShort: (dateKey) => {
    if (!dateKey) return '';
    const [d, m, y] = dateKey.split('-').map(Number);
    const day = new Date(y, m - 1, d).getDay();
    const labels = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
    return labels[day] || '';
  },

  /** dateKey → "Po 02/02" pro zobrazení v seznamu směn */
  formatDateWithDayShort: (dateKey) => {
    if (!dateKey) return '';
    const [d, m, y] = dateKey.split('-').map(Number);
    const dayIdx = new Date(y, m - 1, d).getDay();
    const labels = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
    return `${labels[dayIdx] || ''} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
  },

  /** dateKey → "Úterý 03/02" pro nadpis editace */
  formatDateWithDayLong: (dateKey) => {
    if (!dateKey) return '';
    const [d, m, y] = dateKey.split('-').map(Number);
    const dayIdx = new Date(y, m - 1, d).getDay();
    const labels = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
    return `${labels[dayIdx] || ''} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
  },

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
/**
 * Unit testy pro src/utils/helpers.js
 * Testují převody času, formátování dat, filtraci služeb (kosmetika vs PMU) a logiku volných slotů (getSmartSlots).
 */
import { describe, it, expect } from 'vitest';
import { filterCosmeticsServices, filterPmuServices, isPmuService, Utils } from './helpers';

describe('isPmuService and filterPmuServices', () => {
  it('isPmuService returns true for category PMU or pmu (case-insensitive)', () => {
    expect(isPmuService({ category: 'PMU' })).toBe(true);
    expect(isPmuService({ category: 'pmu' })).toBe(true);
    expect(isPmuService({ category: 'Pmu' })).toBe(true);
    expect(isPmuService({ category: 'STANDARD' })).toBe(false);
    expect(isPmuService({ category: undefined })).toBe(false);
    expect(isPmuService(null)).toBe(false);
  });

  it('isPmuService treats known PMU names as PMU when category is missing', () => {
    expect(isPmuService({ name: 'Meziřasová linka' })).toBe(true);
    expect(isPmuService({ name: 'Rty - Soft Lips' })).toBe(true);
    expect(isPmuService({ name: 'Pudrové obočí' })).toBe(true);
    expect(isPmuService({ name: 'Laminace' })).toBe(false);
  });

  it('filterPmuServices returns only PMU services (case-insensitive)', () => {
    const mixed = [
      { id: 'c1', name: 'Čištění', category: 'STANDARD' },
      { id: 'p1', name: 'PMU obočí', category: 'PMU' },
      { id: 'p2', name: 'PMU rty', category: 'pmu' },
    ];
    const result = filterPmuServices(mixed);
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual(['p1', 'p2']);
  });
});

describe('filterCosmeticsServices', () => {
  // Na /rezervace (kosmetika) se smí zobrazit jen STANDARD – PMU služby se tam nesmí dostat.
  it('returns only STANDARD (cosmetics) services, excludes PMU', () => {
    const mixed = [
      { id: 'c1', name: 'Čištění pleti', category: 'STANDARD' },
      { id: 'p1', name: 'PMU obočí', category: 'PMU' },
      { id: 'c2', name: 'Masáž', category: 'STANDARD' },
    ];
    const result = filterCosmeticsServices(mixed);
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual(['c1', 'c2']);
    expect(result.some((s) => s.category === 'PMU')).toBe(false);
  });

  it('treats missing category as STANDARD (cosmetics)', () => {
    const withMissing = [
      { id: 'a', name: 'Služba bez category', category: undefined },
      { id: 'b', name: 'PMU', category: 'PMU' },
    ];
    const result = filterCosmeticsServices(withMissing);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('returns empty array for empty or non-array input', () => {
    expect(filterCosmeticsServices([])).toEqual([]);
    expect(filterCosmeticsServices(null)).toEqual([]);
    expect(filterCosmeticsServices(undefined)).toEqual([]);
  });

  it('returns all when all are STANDARD', () => {
    const all = [
      { id: '1', name: 'A', category: 'STANDARD' },
      { id: '2', name: 'B' },
    ];
    expect(filterCosmeticsServices(all)).toHaveLength(2);
  });

  it('excludes lowercase pmu (case-insensitive normalization)', () => {
    const withLowerPmu = [
      { id: 'a', name: 'Kosmetika', category: 'STANDARD' },
      { id: 'b', name: 'PMU', category: 'pmu' },
    ];
    const result = filterCosmeticsServices(withLowerPmu);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('excludes known PMU services by name when category is missing', () => {
    const withPmuNames = [
      { id: 'c1', name: 'Laminace', category: 'STANDARD' },
      { id: 'p1', name: 'Meziřasová linka' },
      { id: 'p2', name: 'Rty - Soft Lips' },
      { id: 'c2', name: 'Peeling' },
    ];
    const result = filterCosmeticsServices(withPmuNames);
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual(['c1', 'c2']);
  });
});

describe('Utils Helper Functions', () => {
  // --- Čas: převod řetězec ↔ minuty ---
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

  // --- getSmartSlots: „magnet“ režim pro krátké služby (≤30 min) při existující rezervaci ---
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

  // Dlouhá služba (60 min) nebo prázdný den: všechny volné sloty jsou povolené.
  it('Free Logic: 60 min service can be anywhere', () => {
    const periods = [{ start: '09:00', end: '17:00' }];
    const duration = 60;
    const booked = [{ start: 960, end: 990 }]; // 16:00-16:30

    const slots = Utils.getSmartSlots(periods, duration, booked);

    expect(slots).toContain('09:00');
    expect(slots).toContain('10:00');
  });

  // Žádný slot nesmí kolidovat s obsazeným intervalem (10:00–11:00).
  it('excludes slots that collide with existing booking', () => {
    const periods = [{ start: '09:00', end: '12:00' }];
    const duration = 60;
    const booked = [{ start: 600, end: 660 }]; // 10:00-11:00

    const slots = Utils.getSmartSlots(periods, duration, booked);

    expect(slots).not.toContain('09:30'); // překrývá 10:00-11:00
    expect(slots).not.toContain('10:00');
    expect(slots).toContain('09:00');
    expect(slots).toContain('11:00');
  });
});

describe('Utils date helpers', () => {
  // formatDateKey: objekt Date → klíč ve formátu DD-MM-YYYY pro rozvrh.
  it('formatDateKey formats Date to DD-MM-YYYY', () => {
    const d = new Date(2026, 0, 15); // 15.1.2026
    expect(Utils.formatDateKey(d)).toBe('15-01-2026');
  });

  it('formatDateKey pads single digit day and month', () => {
    const d = new Date(2026, 0, 5);
    expect(Utils.formatDateKey(d)).toBe('05-01-2026');
  });

  // getDateKeyFromISO: ISO řetězec (YYYY-MM-DD) → DD-MM-YYYY.
  it('getDateKeyFromISO parses ISO date (YYYY-MM-DD) to DD-MM-YYYY', () => {
    expect(Utils.getDateKeyFromISO('2026-01-26')).toBe('26-01-2026');
  });

  it('getDateKeyFromISO returns empty string for null/undefined', () => {
    expect(Utils.getDateKeyFromISO(null)).toBe('');
    expect(Utils.getDateKeyFromISO('')).toBe('');
  });

  it('formatDateDisplay returns empty string for falsy input', () => {
    expect(Utils.formatDateDisplay('')).toBe('');
  });
});

describe('Utils createGoogleCalendarLink', () => {
  // Odkaz pro přidání události do Google kalendáře: základní URL a parametry včetně dates.
  it('builds valid Google Calendar URL with date in DD-MM-YYYY format', () => {
    const url = Utils.createGoogleCalendarLink(
      '26-01-2026', '10:00', 60, 'Test', 'Desc'
    );
    expect(url).toContain('https://www.google.com/calendar/render');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('text=Test');
    expect(url).toContain('details=Desc');
    expect(url).toContain('location=Skin+Studio');
    expect(url).toMatch(/dates=\d{8}T\d{6}Z/);
  });

  // Podpora obou formátů data (DD-MM-YYYY i YYYY-MM-DD).
  it('builds valid URL with date in YYYY-MM-DD format', () => {
    const url = Utils.createGoogleCalendarLink(
      '2026-01-26', '14:30', 30, 'Rezervace', 'Popis'
    );
    expect(url).toContain('https://www.google.com/calendar/render');
    expect(url).toContain('text=Rezervace');
  });
});
```



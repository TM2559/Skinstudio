import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, Clock, LogOut, PlusCircle, Archive, Instagram, Package, Image as ImageIcon, Scissors, ScanFace } from 'lucide-react';
import { addDoc, deleteDoc, updateDoc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { startRegistration } from '@simplewebauthn/browser';
import { platformAuthenticatorIsAvailable } from '@simplewebauthn/browser';
import { Utils } from '../utils/helpers';
import {
  getCollectionPath,
  getDocPath,
  EMAILJS_CONFIG,
  callSendConfirmationSms,
  callSendReminderSms,
  getAdminWebAuthnRegistrationOptions,
  verifyAdminWebAuthnRegistration,
} from '../firebaseConfig';

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
  const initialDateSetRef = useRef(false);
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
  const [showFaceIdModal, setShowFaceIdModal] = useState(false);
  const [faceIdPassword, setFaceIdPassword] = useState('');
  const [faceIdError, setFaceIdError] = useState('');
  const [faceIdLoading, setFaceIdLoading] = useState(false);
  const [faceIdAvailable, setFaceIdAvailable] = useState(false);

  useEffect(() => {
    platformAuthenticatorIsAvailable().then((ok) => setFaceIdAvailable(!!ok));
  }, []);

  const handleSetupFaceId = async (e) => {
    e.preventDefault();
    setFaceIdError('');
    setFaceIdLoading(true);
    try {
      const origin = window.location.origin;
      const { data: options } = await getAdminWebAuthnRegistrationOptions({ password: faceIdPassword, origin });
      if (!options) throw new Error('Nepodařilo načíst možnosti registrace.');
      const credential = await startRegistration(options);
      const { data } = await verifyAdminWebAuthnRegistration({ password: faceIdPassword, origin, credential });
      if (data?.verified) {
        setShowFaceIdModal(false);
        setFaceIdPassword('');
      } else {
        setFaceIdError('Registrace Face ID selhala.');
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setFaceIdError('Registrace byla zrušena.');
      } else {
        setFaceIdError(err.message || 'Nastavení Face ID selhalo.');
      }
    } finally {
      setFaceIdLoading(false);
    }
  };

  // Při načtení: pokud dnešek nemá rezervace, aktivní datum = nejbližší den s rezervací
  useEffect(() => {
    if (reservations.length === 0 || initialDateSetRef.current) return;
    setAdminDateInput(Utils.getNearestDateWithReservations(reservations));
    initialDateSetRef.current = true;
  }, [reservations]);

  const getComparableDate = (dateStr) => {
    if (!dateStr) return 0;
    const [d, m, y] = dateStr.split('-');
    return parseInt(`${y}${m}${d}`);
  };

  const todayKey = Utils.formatDateKey(new Date());
  const todayComparable = getComparableDate(todayKey);

  const matchSearch = (r, term) => {
    if (!term || term.length < 3) return true;
    const t = term.toLowerCase().trim();
    return (
      (r.name && r.name.toLowerCase().includes(t)) ||
      (r.phone && String(r.phone).includes(term)) ||
      (r.email && r.email.toLowerCase().includes(t)) ||
      (r.serviceName && r.serviceName.toLowerCase().includes(t)) ||
      (r.id && r.id.toLowerCase().includes(t))
    );
  };

  const { dailyReservations, historyReservations, isGlobalSearchMode } = useMemo(() => {
    const sorted = [...reservations].sort((a, b) => {
      const dateDiff = getComparableDate(a.date) - getComparableDate(b.date);
      if (dateDiff !== 0) return dateDiff;
      return a.time.localeCompare(b.time);
    });
    const filtered = sorted.filter((r) => matchSearch(r, searchTerm));
    const selectedDateKey = Utils.getDateKeyFromISO(adminDateInput);
    const isGlobal = searchTerm.length >= 3;
    const daily = isGlobal
      ? filtered.filter((r) => getComparableDate(r.date) >= todayComparable)
      : filtered.filter((r) => r.date === selectedDateKey);
    const history = filtered
      .filter((r) => getComparableDate(r.date) < todayComparable)
      .reverse();
    return { dailyReservations: daily, historyReservations: history, isGlobalSearchMode: isGlobal };
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
    const withPhone = remindersList.filter((r) => r.phone && String(r.phone).trim());
    const withEmail = remindersList.filter((r) => r.email && String(r.email).trim());
    let smsSent = 0;
    let emailSent = 0;

    if (withPhone.length > 0) {
      try {
        const payload = {
          reservations: withPhone.map((r) => ({
            id: r.id,
            phone: r.phone,
            name: r.name,
            date: r.date,
            time: r.time,
            serviceName: r.serviceName || 'rezervace',
          })),
        };
        const result = await callSendReminderSms(payload);
        smsSent = result?.data?.sent ?? 0;
      } catch (e) {
        console.error('SMS připomínky:', e);
      }
    }

    for (const res of withEmail) {
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
        emailSent++;
      } catch (e) {
        console.error(e);
      }
    }

    setIsSendingReminders(false);
    setShowReminderModal(false);
    const parts = [];
    if (smsSent > 0) parts.push(`${smsSent} SMS`);
    if (emailSent > 0) parts.push(`${emailSent} e-mail`);
    alert(parts.length ? `Odesláno: ${parts.join(', ')}.` : 'Připomínky se nepodařilo odeslat.');
  };

  const openReminders = () => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const key = Utils.formatDateKey(tmr);
    const hasContact = (r) => (r.phone && r.phone.trim()) || (r.email && r.email.trim());
    setRemindersList(reservations.filter((r) => r.date === key && !r.reminderSent && hasContact(r)));
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
      if (sendNotification && phone) {
        try {
          await callSendConfirmationSms({
            phone,
            name: manualForm.name,
            date: manualDateKey,
            time: manualForm.time,
            serviceName: selectedSrv?.name || 'Manual Booking',
            duration: parseInt(selectedSrv?.duration || 60),
          });
        } catch (smsErr) {
          console.warn('SMS potvrzení se nepodařilo odeslat:', smsErr);
        }
      }
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
            {faceIdAvailable && (
              <button
                onClick={() => setShowFaceIdModal(true)}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-all"
                title="Nastavit Face ID pro rychlé přihlášení"
              >
                <ScanFace size={18} />
              </button>
            )}
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
            onAddReservation={() => setShowManualBooking(true)}
            todayKey={todayKey}
            reservations={reservations}
            isGlobalSearchMode={isGlobalSearchMode}
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

      {showFaceIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !faceIdLoading && setShowFaceIdModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-lg text-stone-800 mb-2">Nastavit Face ID</h3>
            <p className="text-sm text-stone-500 mb-4">Pro příště se budete moci přihlásit rychle pomocí Face ID. Zadejte heslo.</p>
            <form onSubmit={handleSetupFaceId} className="space-y-3">
              <input
                type="password"
                placeholder="Heslo"
                value={faceIdPassword}
                onChange={(e) => setFaceIdPassword(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-200 outline-none focus:ring-1 focus:ring-stone-400"
                autoFocus
              />
              {faceIdError && <p className="text-red-500 text-xs">{faceIdError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowFaceIdModal(false); setFaceIdError(''); setFaceIdPassword(''); }}
                  className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={faceIdLoading || !faceIdPassword}
                  className="flex-1 py-2 rounded-xl bg-stone-800 text-white text-sm font-medium disabled:opacity-50"
                >
                  {faceIdLoading ? 'Nastavuji…' : 'Nastavit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;

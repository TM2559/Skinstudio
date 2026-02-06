import React, { useState, useMemo } from 'react';
import { Calendar, Clock, LogOut, PlusCircle, Archive, Instagram } from 'lucide-react';
import { addDoc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { Utils } from '../utils/helpers';
import { getCollectionPath, getDocPath, EMAILJS_CONFIG } from '../firebaseConfig';

import AdminBookingsTab from './admin/AdminBookingsTab';
import AdminHistoryTab from './admin/AdminHistoryTab';
import AdminSettingsTab from './admin/AdminSettingsTab';
import AdminInstagramTab from './admin/AdminInstagramTab';
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
  const [serviceForm, setServiceForm] = useState({ name: '', price: '', duration: '60', description: '' });
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
      description: (serviceForm.description || '').trim(),
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
    setServiceForm({ name: '', price: '', duration: '60', description: '' });
  };

  const handleDeleteService = async (id) => {
    if (confirm('Smazat tuto proceduru?')) await deleteDoc(getDocPath('services', id));
  };

  const startEdit = (s) => {
    setActiveTab('settings');
    setEditingServiceId(s.id);
    setServiceForm({ name: s.name, price: s.price, duration: s.duration, description: s.description || '' });
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
          <button
            onClick={() => {
              setActiveTab('instagram');
              setSearchTerm('');
            }}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'instagram' ? 'border-stone-800 text-stone-900 font-bold' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
          >
            <Instagram size={16} /> Instagram
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
        {activeTab === 'instagram' && <AdminInstagramTab />}
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
              setServiceForm({ name: '', price: '', duration: '60', description: '' });
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

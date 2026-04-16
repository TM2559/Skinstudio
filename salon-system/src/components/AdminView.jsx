import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, Clock, LogOut, PlusCircle, Archive, Instagram, Package, Image as ImageIcon, Scissors, ScanFace, Gift, ShoppingBag } from 'lucide-react';
import { addDoc, deleteDoc, updateDoc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { startRegistration } from '@simplewebauthn/browser';
import { platformAuthenticatorIsAvailable } from '@simplewebauthn/browser';
import { Utils } from '../utils/helpers';
import { ensureAnonymousAuthForCallable, packWebAuthnCredentialForCallable } from '../utils/webAuthnCallable';
import {
  auth,
  getCollectionPath,
  getDocPath,
  getAdminWebAuthnRegistrationOptions,
  verifyAdminWebAuthnRegistration,
} from '../firebaseConfig';
import { PMU_DURATIONS, CONTACT, COLLECTIONS } from '../constants/config';
import {
  syncServiceGiftVoucherTemplate,
  backfillGiftVouchersFromServices,
  servicesNeedingGiftVoucherTemplate,
} from '../utils/syncServiceGiftVoucherTemplate';
import { normalizeVoucherType } from '../utils/voucherHelpers';
import { sendBookingConfirmations, sendReminders } from '../services/notificationService';

import { useToastContext } from '../contexts/ToastContext';
import AdminBookingsTab from './admin/AdminBookingsTab';
import AdminHistoryTab from './admin/AdminHistoryTab';
import AdminShiftsTab from './admin/AdminShiftsTab';
import AdminServicesTab from './admin/AdminServicesTab';
import AdminAddonsTab from './admin/AdminAddonsTab';
import AdminInstagramTab from './admin/AdminInstagramTab';
import AdminPhotosTab from './admin/AdminPhotosTab';
import AdminVouchersTab from './admin/AdminVouchersTab';
import AdminOrdersTab from './admin/AdminOrdersTab';
import ManualBookingModal from './admin/ManualBookingModal';
import RemindersModal from './admin/RemindersModal';
import OrderDetailModal from './admin/OrderDetailModal';

const AdminView = ({ services, schedule, schedulePmu = {}, reservations, addons = [], serviceAddonLinks = [], voucherTemplates = [], voucherOrders = [], onLogout }) => {
  const toast = useToastContext();
  const [activeTab, setActiveTab] = useState('bookings');
  const [searchTerm, setSearchTerm] = useState('');
  const [adminDateInput, setAdminDateInput] = useState(Utils.getLocalISODate());
  const initialDateSetRef = useRef(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    price: '',
    duration: '60',
    description: '',
    category: 'STANDARD',
    isStartingPrice: false,
    availableForGiftVoucher: false,
  });
  /** Automatické doplnění šablon poukazů pro služby se zaškrtnutým poukazem (data před zavedením sync při uložení). */
  const giftVoucherBackfillInFlight = useRef(false);
  const giftVoucherBackfillErrorStop = useRef(false);
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
  const [manualPrefillTime, setManualPrefillTime] = useState(null);
  const [manualPrefillSlot, setManualPrefillSlot] = useState(null);
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [shiftDraftModal, setShiftDraftModal] = useState({
    open: false,
    isoDate: '',
    start: '',
    end: '',
    isSaving: false,
  });
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
      await ensureAnonymousAuthForCallable();
      const origin = window.location.origin;
      const { data: options } = await getAdminWebAuthnRegistrationOptions({ password: faceIdPassword, origin });
      if (!options) throw new Error('Nepodařilo načíst možnosti registrace.');
      const credential = await startRegistration({ optionsJSON: options });
      const { data } = await verifyAdminWebAuthnRegistration({
        password: faceIdPassword,
        origin,
        credential: packWebAuthnCredentialForCallable(credential),
      });
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

  const { dailyReservations, historyReservations, isGlobalSearchMode, upcomingReservations } = useMemo(() => {
    const sorted = [...reservations].sort((a, b) => {
      const dateDiff = getComparableDate(a.date) - getComparableDate(b.date);
      if (dateDiff !== 0) return dateDiff;
      return Utils.timeToMinutes(a.time) - Utils.timeToMinutes(b.time);
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
    const upcoming = sorted.filter((r) => getComparableDate(r.date) >= todayComparable);
    return { dailyReservations: daily, historyReservations: history, isGlobalSearchMode: isGlobal, upcomingReservations: upcoming };
  }, [reservations, searchTerm, adminDateInput, todayComparable]);

  const handleSaveDay = async (dateKey, payload) => {
    const scheduleRef = getDocPath(COLLECTIONS.SCHEDULE, dateKey);
    const schedulePmuRef = getDocPath(COLLECTIONS.SCHEDULE_PMU, dateKey);
    const kosmetikaPeriods = Array.isArray(payload?.kosmetika) ? payload.kosmetika : [];
    const pmuPeriods = Array.isArray(payload?.pmu) ? payload.pmu : [];
    const saveStandard = kosmetikaPeriods.length > 0
      ? setDoc(scheduleRef, { periods: kosmetikaPeriods })
      : deleteDoc(scheduleRef).catch(() => {});
    const savePmu = pmuPeriods.length > 0
      ? setDoc(schedulePmuRef, { periods: pmuPeriods })
      : deleteDoc(schedulePmuRef).catch(() => {});
    await Promise.all([saveStandard, savePmu]);
  };

  const saveServiceAddonLinks = async (mainServiceId) => {
    const col = getCollectionPath(COLLECTIONS.SERVICE_ADDON_LINKS);
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
      availableForGiftVoucher: !!serviceForm.availableForGiftVoucher,
      order: editingServiceId ? undefined : services.length,
    };
    const updateData = { ...data };
    if (updateData.order === undefined) delete updateData.order;

    let savedServiceId = editingServiceId;
    try {
      await auth.currentUser?.getIdToken(true);
    } catch (_) {
      /* best-effort */
    }

    if (editingServiceId) {
      await updateDoc(getDocPath(COLLECTIONS.SERVICES, editingServiceId), updateData);
      await saveServiceAddonLinks(editingServiceId);
      setEditingServiceId(null);
      setEditingAddonLinks([]);
    } else {
      const ref = await addDoc(getCollectionPath(COLLECTIONS.SERVICES), data);
      savedServiceId = ref.id;
    }

    try {
      await syncServiceGiftVoucherTemplate({
        serviceId: savedServiceId,
        serviceForm,
        voucherTemplates,
        getCollectionPath,
        COLLECTIONS,
        addDoc,
        updateDoc,
        deleteDoc,
        getDocs,
        query,
        where,
      });
    } catch (err) {
      console.error('syncServiceGiftVoucherTemplate:', err);
      toast.error(
        'Služba byla uložena, ale synchronizace dárkového poukazu se nepovedla. Zkuste službu uložit znovu.'
      );
    }

    setServiceForm({
      name: '',
      price: '',
      duration: '60',
      description: '',
      category: 'STANDARD',
      isStartingPrice: false,
      availableForGiftVoucher: false,
    });
  };

  const handleDeleteService = async (id) => {
    if (!confirm('Smazat tuto proceduru?')) return;
    try {
      await auth.currentUser?.getIdToken(true);
    } catch (_) {
      /* best-effort */
    }
    try {
      const tSnap = await getDocs(
        query(getCollectionPath(COLLECTIONS.VOUCHER_TEMPLATES), where('service_id', '==', id))
      );
      await Promise.all(tSnap.docs.map((d) => deleteDoc(d.ref)));
    } catch (err) {
      console.error('delete voucher templates for service:', err);
    }
    await deleteDoc(getDocPath(COLLECTIONS.SERVICES, id));
  };

  const handleSaveVoucher = async (payload, editingId) => {
    const col = getCollectionPath(COLLECTIONS.VOUCHER_TEMPLATES);
    const isValue = normalizeVoucherType(payload.type) === 'value';
    const data = {
      type: normalizeVoucherType(payload.type),
      service_id: payload.service_id || null,
      category:
        payload.category ||
        (isValue ? 'value' : 'cosmetics'),
      name: payload.name,
      description: payload.description || '',
      price: payload.price,
      is_active: payload.is_active !== false,
      is_custom_amount: isValue && !!payload.is_custom_amount,
      sort_order: editingId ? undefined : voucherTemplates.length,
    };
    try {
      // Obnovit token, aby obsahoval custom claim admin: true (nastavený po přihlášení)
      await auth.currentUser?.getIdToken(true);
      if (editingId) {
        const updateData = { ...data };
        delete updateData.sort_order;
        await updateDoc(getDocPath(COLLECTIONS.VOUCHER_TEMPLATES, editingId), updateData);
        toast.success('Poukaz byl uložen.');
      } else {
        await addDoc(col, data);
        toast.success('Poukaz byl vytvořen.');
      }
    } catch (err) {
      console.error('Save voucher failed:', err);
      const msg = err?.message || '';
      if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
        toast.error('Nemáte oprávnění ukládat poukazy. Zkuste se znovu přihlásit do adminu.');
      } else {
        toast.error('Poukaz se nepodařilo uložit. Zkuste to znovu.');
      }
      throw err;
    }
  };

  const handleDeleteVoucher = async (id) => {
    if (!confirm('Smazat tento dárkový poukaz?')) return;
    try {
      await auth.currentUser?.getIdToken(true);
      await deleteDoc(getDocPath(COLLECTIONS.VOUCHER_TEMPLATES, id));
      toast.success('Poukaz byl smazán.');
    } catch (err) {
      console.error('Delete voucher failed:', err);
      toast.error('Poukaz se nepodařilo smazat. Zkuste to znovu.');
    }
  };

  const handleToggleVoucherActive = async (id, isActive) => {
    try {
      await auth.currentUser?.getIdToken(true);
      await updateDoc(getDocPath(COLLECTIONS.VOUCHER_TEMPLATES, id), { is_active: isActive });
    } catch (err) {
      console.error('Toggle voucher active:', err);
      toast.error('Změna stavu se nepovedla.');
    }
  };

  useEffect(() => {
    if (giftVoucherBackfillErrorStop.current) return;
    if (!services?.length) return;
    const pending = servicesNeedingGiftVoucherTemplate(services, voucherTemplates);
    if (pending.length === 0) return;
    if (giftVoucherBackfillInFlight.current) return;

    giftVoucherBackfillInFlight.current = true;
    (async () => {
      try {
        await auth.currentUser?.getIdToken(true);
        await backfillGiftVouchersFromServices(services, voucherTemplates, {
          getCollectionPath,
          COLLECTIONS,
          addDoc,
          updateDoc,
          deleteDoc,
          getDocs,
          query,
          where,
        });
      } catch (err) {
        console.error('backfillGiftVouchersFromServices:', err);
        giftVoucherBackfillErrorStop.current = true;
        toast.error(
          'Dárkové poukazy ze služeb se nepodařilo doplnit automaticky. U každé služby dejte Uložit změny, nebo obnovte stránku později.'
        );
      } finally {
        giftVoucherBackfillInFlight.current = false;
      }
    })();
  }, [services, voucherTemplates]);

  // PMU_DURATIONS imported from constants/config
  const startEdit = (s) => {
    setActiveTab('services');
    setEditingServiceId(s.id);
    const category = s.category || 'STANDARD';
    const duration = category === 'PMU' && !PMU_DURATIONS.includes(Number(s.duration))
      ? 180
      : s.duration;
    setServiceForm({
      name: s.name,
      price: s.price,
      duration,
      description: s.description || '',
      category,
      isStartingPrice: !!s.isStartingPrice,
      availableForGiftVoucher: !!s.availableForGiftVoucher,
    });
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
      updateDoc(getDocPath(COLLECTIONS.SERVICES, service.id), { order: idx })
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
      updateDoc(getDocPath(COLLECTIONS.SERVICES, service.id), { order: index })
    );
    await Promise.all(updatePromises);
  };

  const handleDeleteRes = async (id) => {
    if (confirm('Smazat rezervaci?')) {
      await deleteDoc(getDocPath(COLLECTIONS.RESERVATIONS, id));
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
    try {
      const { smsSent, emailSent } = await sendReminders(remindersList);
      for (const res of remindersList) {
        try {
          await updateDoc(getDocPath(COLLECTIONS.RESERVATIONS, res.id), { reminderSent: true });
        } catch (e) {
          console.error('Failed to mark reminder sent:', e);
        }
      }
      const parts = [];
      if (smsSent > 0) parts.push(`${smsSent} SMS`);
      if (emailSent > 0) parts.push(`${emailSent} e-mail`);
      parts.length ? toast.success(`Odesláno: ${parts.join(', ')}.`) : toast.error('Připomínky se nepodařilo odeslat.');
    } catch (e) {
      console.error('Reminders failed:', e);
      toast.error('Připomínky se nepodařilo odeslat.');
    } finally {
      setIsSendingReminders(false);
      setShowReminderModal(false);
    }
  };

  const openReminders = () => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const key = Utils.formatDateKey(tmr);
    const hasContact = (r) => (r.phone && r.phone.trim()) || (r.email && r.email.trim());
    setRemindersList(reservations.filter((r) => r.date === key && !r.reminderSent && hasContact(r)));
    setShowReminderModal(true);
  };

  const createShiftForDateFromReservations = (isoDate) => {
    const dateKey = Utils.getDateKeyFromISO(isoDate);
    const dayReservations = (reservations || []).filter((r) => r.date === dateKey && r.time);
    if (dayReservations.length === 0) {
      toast.info('Pro tento den nejsou žádné rezervace, ze kterých by šla vytvořit směna.');
      return;
    }

    const starts = dayReservations.map((r) => Utils.timeToMinutes(r.time));
    const ends = dayReservations.map(
      (r) => Utils.timeToMinutes(r.time) + (Number(r.duration) > 0 ? Number(r.duration) : 60)
    );
    const minStart = Math.min(...starts);
    const maxEnd = Math.max(...ends);
    const period = {
      start: Utils.minutesToTime(minStart),
      end: Utils.minutesToTime(maxEnd),
    };

    setShiftDraftModal({
      open: true,
      isoDate,
      start: period.start,
      end: period.end,
      isSaving: false,
    });
  };

  const handleConfirmCreateShift = async () => {
    const dateKey = Utils.getDateKeyFromISO(shiftDraftModal.isoDate);
    if (!shiftDraftModal.start || !shiftDraftModal.end) {
      toast.info('Vyplňte začátek i konec směny.');
      return;
    }
    if (Utils.timeToMinutes(shiftDraftModal.end) <= Utils.timeToMinutes(shiftDraftModal.start)) {
      toast.info('Konec směny musí být později než začátek.');
      return;
    }

    const period = {
      start: shiftDraftModal.start,
      end: shiftDraftModal.end,
    };

    setShiftDraftModal((s) => ({ ...s, isSaving: true }));
    try {
      await setDoc(getDocPath(COLLECTIONS.SCHEDULE, dateKey), { periods: [period] });
      toast.success(`Směna ${period.start}–${period.end} byla vypsána.`);
      setShiftDraftModal({ open: false, isoDate: '', start: '', end: '', isSaving: false });
    } catch (e) {
      console.error(e);
      toast.error('Směnu se nepodařilo vypsat.');
      setShiftDraftModal((s) => ({ ...s, isSaving: false }));
    }
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

  useEffect(() => {
    if (!showManualBooking || manualPrefillTime == null) return;

    if (!hasShifts) {
      const opts = Utils.generateTimeOptions();
      if (opts.includes(manualPrefillTime)) {
        setManualForm((f) => ({ ...f, time: manualPrefillTime }));
      }
      setManualPrefillTime(null);
      return;
    }

    if (!manualForm.serviceId) return;

    if (manualAvailableSlots.includes(manualPrefillTime)) {
      setManualForm((f) => ({ ...f, time: manualPrefillTime }));
      setManualPrefillTime(null);
    }
  }, [showManualBooking, manualPrefillTime, manualForm.serviceId, hasShifts, manualAvailableSlots]);

  const openManualBooking = () => {
    setManualPrefillTime(null);
    setManualPrefillSlot(null);
    setShowManualBooking(true);
  };

  const openManualBookingFromSlot = (isoDate, slot) => {
    setManualPrefillTime(slot?.startTime || null);
    setManualPrefillSlot(slot || null);
    setManualForm((f) => ({ ...f, date: isoDate, time: slot?.startTime || '' }));
    setShowManualBooking(true);
  };

  const ensureScheduleCoversManualReservation = async (dateKey, startTime, duration, category) => {
    const targetCollection = category === 'pmu' ? COLLECTIONS.SCHEDULE_PMU : COLLECTIONS.SCHEDULE;
    const sourceSchedule = category === 'pmu' ? (schedulePmu || {}) : (schedule || {});
    const day = sourceSchedule[dateKey];
    const existingPeriods =
      day?.periods?.length > 0
        ? day.periods
        : day?.start
          ? [{ start: day.start, end: day.end }]
          : [];

    const startMin = Utils.timeToMinutes(startTime);
    const endMin = startMin + (Number(duration) > 0 ? Number(duration) : 60);

    const isCovered = existingPeriods.some((p) => {
      const pStart = Utils.timeToMinutes(p.start);
      const pEnd = Utils.timeToMinutes(p.end);
      return startMin >= pStart && endMin <= pEnd;
    });
    if (isCovered) return;

    const intervals = existingPeriods.map((p) => [
      Utils.timeToMinutes(p.start),
      Utils.timeToMinutes(p.end),
    ]);
    intervals.push([startMin, endMin]);
    intervals.sort((a, b) => a[0] - b[0]);

    const merged = [];
    for (const [s, e] of intervals) {
      const prev = merged[merged.length - 1];
      if (!prev || s > prev[1]) merged.push([s, e]);
      else prev[1] = Math.max(prev[1], e);
    }

    const periods = merged.map(([s, e]) => ({
      start: Utils.minutesToTime(s),
      end: Utils.minutesToTime(e),
    }));
    await setDoc(getDocPath(targetCollection, dateKey), { periods });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.serviceId || !manualForm.time || !manualForm.name) return;
    const sendNotification = manualForm.sendNotification !== false;
    if (sendNotification) {
      const hasContact = (manualForm.phone || '').trim() || (manualForm.email || '').trim();
      if (!hasContact) {
        toast.info('Pro odeslání potvrzení vyplňte alespoň telefon nebo e-mail.');
        return;
      }
    }
    setIsManualSubmitting(true);
    const selectedSrv = services.find((s) => s.id === manualForm.serviceId);
    const phone = (manualForm.phone || '').trim() || null;
    const email = (manualForm.email || '').trim() || null;
    try {
      await addDoc(getCollectionPath(COLLECTIONS.RESERVATIONS), {
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
      await ensureScheduleCoversManualReservation(
        manualDateKey,
        manualForm.time,
        parseInt(selectedSrv?.duration || 60),
        manualForm.category
      );
      if (sendNotification) {
        const dur = parseInt(selectedSrv?.duration || 60);
        const svcName = selectedSrv?.name || 'Manual Booking';
        const calTitle = `REZERVACE: ${svcName} (${manualForm.name})`;
        const calDesc = `Klient: ${manualForm.name}, Tel: ${manualForm.phone || ''}`;
        const calendarLink = Utils.createGoogleCalendarLink(
          manualDateKey, manualForm.time, dur, calTitle, calDesc
        );
        const calendarIcsLink = Utils.createCalendarIcsHttpUrl(
          import.meta.env.VITE_FIREBASE_PROJECT_ID,
          manualDateKey,
          manualForm.time,
          dur,
          calTitle,
          calDesc
        );
        await sendBookingConfirmations({
          name: manualForm.name,
          phone,
          email,
          date: manualDateKey,
          time: manualForm.time,
          serviceName: svcName,
          duration: dur,
          calendarLink,
          calendarIcsLink,
        });
      }
      setShowManualBooking(false);
      setManualPrefillTime(null);
      setManualPrefillSlot(null);
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
      toast.error('Chyba při ukládání.');
    } finally {
      setIsManualSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[80vh] min-w-0 overflow-x-hidden">
      <div className="bg-white sticky top-0 z-30 border border-stone-200 rounded-xl px-2 sm:px-6 pt-3 sm:pt-4 pb-0 mb-4 sm:mb-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <span className="font-display font-bold uppercase tracking-widest text-xs text-stone-400">
            Admin Panel
          </span>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={openManualBooking}
              className="skin-accent px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase flex items-center gap-2 transition-all shadow-sm"
            >
              <PlusCircle size={14} /> <span>Nová rezervace</span>
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

        <div className="mobile-carousel-strip grid grid-cols-3 sm:grid-cols-4 lg:flex lg:overflow-x-auto gap-2 text-xs sm:text-sm font-medium pb-2">
          <button
            onClick={() => {
              setActiveTab('bookings');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item py-2 px-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 min-w-0 ${activeTab === 'bookings' ? 'border-stone-800 text-stone-900 font-bold bg-stone-50' : 'border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
          >
            <Calendar size={16} /> Rezervace
          </button>
          <button
            onClick={() => {
              setActiveTab('shifts');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item py-2 px-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 min-w-0 ${activeTab === 'shifts' ? 'border-stone-800 text-stone-900 font-bold bg-stone-50' : 'border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
          >
            <Clock size={16} /> Směny
          </button>
          <button
            onClick={() => {
              setActiveTab('services');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item py-2 px-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 min-w-0 ${activeTab === 'services' ? 'border-stone-800 text-stone-900 font-bold bg-stone-50' : 'border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
          >
            <Scissors size={16} /> Služby
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item py-2 px-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 min-w-0 ${activeTab === 'history' ? 'border-stone-800 text-stone-900 font-bold bg-stone-50' : 'border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
          >
            <Archive size={16} /> Archiv
          </button>
          <button
            onClick={() => {
              setActiveTab('addons');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item py-2 px-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 min-w-0 ${activeTab === 'addons' ? 'border-stone-800 text-stone-900 font-bold bg-stone-50' : 'border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
          >
            <Package size={16} /> Add-ony
          </button>
          <button
            onClick={() => {
              setActiveTab('instagram');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item py-2 px-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 min-w-0 ${activeTab === 'instagram' ? 'border-stone-800 text-stone-900 font-bold bg-stone-50' : 'border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
          >
            <Instagram size={16} /> Instagram
          </button>
          <button
            onClick={() => {
              setActiveTab('photos');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item py-2 px-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 min-w-0 ${activeTab === 'photos' ? 'border-stone-800 text-stone-900 font-bold bg-stone-50' : 'border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
          >
            <ImageIcon size={16} /> Fotografie
          </button>
          <button
            onClick={() => {
              setActiveTab('vouchers');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item py-2 px-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 min-w-0 ${activeTab === 'vouchers' ? 'border-stone-800 text-stone-900 font-bold bg-stone-50' : 'border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
          >
            <Gift size={16} /> Dárkové poukazy
          </button>
          <button
            onClick={() => {
              setActiveTab('orders');
              setSearchTerm('');
            }}
            className={`mobile-carousel-strip-item py-2 px-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 min-w-0 ${activeTab === 'orders' ? 'border-stone-800 text-stone-900 font-bold bg-stone-50' : 'border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
          >
            <ShoppingBag size={16} /> Objednávky
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
            onAddReservation={openManualBooking}
            onManualBookingFromSlot={openManualBookingFromSlot}
            onCreateShiftForDay={createShiftForDateFromReservations}
            schedule={schedule}
            todayKey={todayKey}
            reservations={reservations}
            upcomingReservations={upcomingReservations}
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
              setServiceForm({
                name: '',
                price: '',
                duration: '60',
                description: '',
                category: 'STANDARD',
                isStartingPrice: false,
                availableForGiftVoucher: false,
              });
              setEditingAddonLinks([]);
            }}
            addons={addons}
            editingAddonLinks={editingAddonLinks}
            setEditingAddonLinks={setEditingAddonLinks}
          />
        )}
        {activeTab === 'vouchers' && (
          <AdminVouchersTab
            voucherTemplates={voucherTemplates}
            services={services}
            onSave={handleSaveVoucher}
            onDelete={handleDeleteVoucher}
            onToggleActive={handleToggleVoucherActive}
          />
        )}
        {activeTab === 'orders' && (
          <AdminOrdersTab
            voucherOrders={voucherOrders}
            voucherTemplates={voucherTemplates}
          />
        )}
      </div>

      <ManualBookingModal
        open={showManualBooking}
        onClose={() => {
          setShowManualBooking(false);
          setManualPrefillTime(null);
          setManualPrefillSlot(null);
        }}
        services={services}
        manualForm={manualForm}
        setManualForm={setManualForm}
        manualAvailableSlots={manualAvailableSlots}
        manualPrefillSlot={manualPrefillSlot}
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

      {shiftDraftModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !shiftDraftModal.isSaving && setShiftDraftModal({ open: false, isoDate: '', start: '', end: '', isSaving: false })}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-lg text-stone-800 mb-2">Vypsat směnu</h3>
            <p className="text-sm text-stone-500 mb-4">
              Nastavte čas směny pro {Utils.formatDateDisplay(Utils.getDateKeyFromISO(shiftDraftModal.isoDate))}.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-stone-400 block mb-1.5">Od</label>
                <input
                  type="time"
                  value={shiftDraftModal.start}
                  onChange={(e) => setShiftDraftModal((s) => ({ ...s, start: e.target.value }))}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-stone-400 block mb-1.5">Do</label>
                <input
                  type="time"
                  value={shiftDraftModal.end}
                  onChange={(e) => setShiftDraftModal((s) => ({ ...s, end: e.target.value }))}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShiftDraftModal({ open: false, isoDate: '', start: '', end: '', isSaving: false })}
                disabled={shiftDraftModal.isSaving}
                className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium disabled:opacity-50"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateShift}
                disabled={shiftDraftModal.isSaving}
                className="flex-1 py-2 rounded-xl bg-stone-800 text-white text-sm font-medium disabled:opacity-50"
              >
                {shiftDraftModal.isSaving ? 'Ukládám…' : 'Vypsat směnu'}
              </button>
            </div>
          </div>
        </div>
      )}

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

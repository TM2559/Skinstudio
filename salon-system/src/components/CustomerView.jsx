import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc } from "firebase/firestore";
import { Utils, isPmuService, filterCosmeticsServices } from '../utils/helpers';
import { getCollectionPath } from '../firebaseConfig';
import { BOOKING, CONTACT, COLLECTIONS } from '../constants/config';
import { sendBookingConfirmations } from '../services/notificationService';
import { useToastContext } from '../contexts/ToastContext';
import ServiceSelector from './booking/ServiceSelector';
import DateStrip from './booking/DateStrip';
import TimeGrid from './booking/TimeGrid';
import BookingSummaryForm, { calculateReservationTotal } from './booking/BookingSummaryForm';
import PrivacySlideOver from './PrivacySlideOver';

const CustomerView = ({ services, schedule, schedulePmu = {}, reservations, onBookingSuccess, initialServiceId, theme = 'light' }) => {
  const navigate = useNavigate();
  const toast = useToastContext();
  const isDark = theme === 'dark';

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
  const [selectedUpsells, setSelectedUpsells] = useState([]);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

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
    for (let i = 0; i < BOOKING.DAYS_AHEAD; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = Utils.formatDateKey(d);
      const dayData = effectiveSchedule[key];
      if (dayData && (dayData.periods?.length > 0 || dayData.start)) dates.push(d);
    }
    return dates;
  }, [effectiveSchedule]);

  const activeDateStr = selectedDateStr || (clientDates.length > 0 ? Utils.formatDateKey(clientDates[0]) : null);

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
      map.set(key, Utils.getSmartSlots(periods, duration, bookedIntervals).length);
    });
    return map;
  }, [clientDates, selectedService, effectiveSchedule, reservations]);

  const availableSlots = useMemo(() => {
    if (!activeDateStr || !selectedService) return [];
    const dayData = effectiveSchedule[activeDateStr];
    if (!dayData) return [];
    const periods = dayData.periods || (dayData.start ? [{ start: dayData.start, end: dayData.end }] : []);
    const bookedIntervals = reservations
      .filter(r => r.date === activeDateStr)
      .map(r => ({ start: Utils.timeToMinutes(r.time), end: Utils.timeToMinutes(r.time) + (r.duration || 60) }));
    return Utils.getSmartSlots(periods, parseInt(selectedService.duration), bookedIntervals);
  }, [activeDateStr, selectedService, effectiveSchedule, reservations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTime || !selectedService || !formData.email) return;
    setIsSending(true);

    try {
      const calendarTitle = `REZERVACE: ${selectedService.name} (${formData.name})`;
      const calendarDesc = `Klient: ${formData.name}, Tel: ${formData.phone}`;
      const calendarLink = Utils.createGoogleCalendarLink(
        activeDateStr, selectedTime, parseInt(selectedService.duration),
        calendarTitle, calendarDesc
      );
      const calendarIcsLink = Utils.createCalendarIcsHttpUrl(
        import.meta.env.VITE_FIREBASE_PROJECT_ID,
        activeDateStr,
        selectedTime,
        parseInt(selectedService.duration),
        calendarTitle,
        calendarDesc
      );

      await addDoc(getCollectionPath(COLLECTIONS.RESERVATIONS), {
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

      await sendBookingConfirmations({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        date: activeDateStr,
        time: selectedTime,
        serviceName: selectedService.name,
        duration: parseInt(selectedService.duration),
        calendarLink,
        calendarIcsLink,
      });

      if (onBookingSuccess) onBookingSuccess();

      navigate('/dekujeme', {
        state: {
          serviceName: selectedService.name,
          date: activeDateStr,
          time: selectedTime,
          duration: parseInt(selectedService.duration),
          customerName: formData.name,
          price: calculateReservationTotal(selectedService, selectedUpsells),
          theme: isDark ? 'dark' : 'light',
        },
      });

    } catch (err) {
      console.error(err);
      toast.error("Chyba při rezervaci. Zkuste to prosím znovu.");
    } finally {
      setIsSending(false);
    }
  };

  const handleServiceSelect = (s) => {
    setSelectedService(s);
    setSelectedTime(null);
  };

  const handleDateSelect = (key) => {
    setSelectedDateStr(key);
    setSelectedTime(null);
  };

  return (
    <div className="flex flex-col gap-10 md:grid md:grid-cols-2 md:gap-12">
      <div className="flex flex-col gap-10">
        <ServiceSelector
          services={displayServices}
          selectedService={selectedService}
          selectedUpsells={selectedUpsells}
          isDark={isDark}
          onSelect={handleServiceSelect}
          onUpsellToggle={handleUpsellToggle}
        />

        <div className={`min-w-0 ${!selectedService ? 'opacity-20 pointer-events-none' : ''}`}>
          <DateStrip
            dates={clientDates}
            activeDateStr={activeDateStr}
            slotsPerDate={slotsPerDate}
            selectedService={selectedService}
            isDark={isDark}
            onSelect={handleDateSelect}
          />
        </div>

        <div className={!activeDateStr ? 'opacity-20 pointer-events-none' : ''}>
          <TimeGrid
            slots={availableSlots}
            selectedTime={selectedTime}
            isDark={isDark}
            onSelect={setSelectedTime}
          />
        </div>

        <div className={`pt-6 mt-2 border-t text-center md:text-left ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <p className={`mb-1.5 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Nenašli jste vhodný termín? Zavolejte a najdeme řešení společně.
          </p>
          <a
            href={CONTACT.PHONE_LINK}
            className="text-lg font-semibold hover:underline transition-all focus:outline-none focus:ring-2 focus:ring-[#a88a7d]/50 rounded"
            style={{ color: isDark ? '#daa59c' : 'var(--skin-gold-dark)' }}
          >
            {CONTACT.PHONE}
          </a>
        </div>
      </div>

      <BookingSummaryForm
        selectedService={selectedService}
        selectedUpsells={selectedUpsells}
        selectedTime={selectedTime}
        activeDateStr={activeDateStr}
        isDark={isDark}
        formData={formData}
        setFormData={setFormData}
        isSending={isSending}
        onSubmit={handleSubmit}
        onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
      />
      <PrivacySlideOver
        open={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        isDark={isDark}
      />
    </div>
  );
};

export default CustomerView;

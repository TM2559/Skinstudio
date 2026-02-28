import { callSendConfirmationSms, callSendReminderSms } from '../firebaseConfig';
import { sendBookingConfirmationEmail, sendAdminNotificationEmail, sendReminderEmail } from './emailService';
import { Utils } from '../utils/helpers';

/**
 * Send all booking confirmation notifications (SMS + email to client + email to admin).
 * Failures are logged but don't throw – booking is already saved at this point.
 */
export async function sendBookingConfirmations({ name, phone, email, date, time, serviceName, duration, calendarLink }) {
  const dateDisplay = Utils.formatDateDisplay(date);
  const results = { sms: false, email: false, adminEmail: false };

  if (phone?.trim()) {
    try {
      await callSendConfirmationSms({ phone: phone.trim(), name, date, time, serviceName, duration });
      results.sms = true;
    } catch (err) {
      console.warn('SMS confirmation failed:', err);
    }
  }

  if (email?.trim()) {
    results.email = await sendBookingConfirmationEmail({ name, email, date: dateDisplay, time, serviceName });
    results.adminEmail = await sendAdminNotificationEmail({ name, email, phone, date: dateDisplay, time, serviceName, calendarLink });
  }

  return results;
}

/**
 * Send reminder notifications for a batch of reservations.
 * Returns { smsSent, emailSent }.
 */
export async function sendReminders(reservationsList) {
  const withPhone = reservationsList.filter((r) => r.phone?.trim());
  const withEmail = reservationsList.filter((r) => r.email?.trim());
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
    } catch (err) {
      console.error('SMS reminders failed:', err);
    }
  }

  for (const res of withEmail) {
    const ok = await sendReminderEmail({
      name: res.name,
      email: res.email,
      date: Utils.formatDateDisplay(res.date),
      time: res.time,
      serviceName: res.serviceName,
    });
    if (ok) emailSent++;
  }

  return { smsSent, emailSent };
}

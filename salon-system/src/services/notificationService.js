import {
  callSendBookingEmails,
  callSendConfirmationSms,
  callSendReminderEmails,
  callSendReminderSms,
} from '../firebaseConfig';
import { sendBookingConfirmationEmail, sendAdminNotificationEmail, sendReminderEmail } from './emailService';
import { Utils } from '../utils/helpers';

/**
 * Send all booking confirmation notifications (SMS + email to client + email to admin).
 * Failures are logged but don't throw – booking is already saved at this point.
 */
export async function sendBookingConfirmations({ name, phone, email, date, time, serviceName, duration, calendarLink, calendarIcsLink }) {
  const dateDisplay = Utils.formatDateDisplay(date);
  const results = { sms: false, email: false, adminEmail: false };
  const emailAddress = typeof email === 'string' ? email.trim() : '';
  const phoneNumber = typeof phone === 'string' ? phone.trim() : '';

  if (phoneNumber) {
    try {
      await callSendConfirmationSms({ phone: phoneNumber, name, date, time, serviceName, duration });
      results.sms = true;
    } catch (err) {
      console.warn('SMS confirmation failed:', err);
    }
  }

  if (emailAddress) {
    try {
      const resendResult = await callSendBookingEmails({
        name,
        email: emailAddress,
        phone: phoneNumber,
        date: dateDisplay,
        time,
        serviceName,
        calendarLink,
        calendarIcsLink,
      });
      results.email = Boolean(resendResult?.data?.clientOk);
      results.adminEmail = Boolean(resendResult?.data?.adminOk);

      // If bulk endpoint returns partial/failed result, retry only missing parts
      // through dedicated callables to maximize delivery reliability.
      if (!results.email) {
        console.warn('sendBookingEmails returned clientOk=false, trying direct fallback');
        results.email = await sendBookingConfirmationEmail({
          name,
          email: emailAddress,
          date: dateDisplay,
          time,
          serviceName,
          calendarIcsLink,
        });
      }
      if (!results.adminEmail) {
        console.warn('sendBookingEmails returned adminOk=false, trying direct fallback');
        results.adminEmail = await sendAdminNotificationEmail({
          name,
          email: emailAddress,
          phone: phoneNumber,
          date: dateDisplay,
          time,
          serviceName,
          calendarLink,
          calendarIcsLink,
        });
      }
    } catch (err) {
      console.warn('sendBookingEmails callable failed, fallback to single-email callables:', err);
      results.email = await sendBookingConfirmationEmail({
        name, email: emailAddress, date: dateDisplay, time, serviceName, calendarIcsLink,
      });
      results.adminEmail = await sendAdminNotificationEmail({
        name, email: emailAddress, phone: phoneNumber, date: dateDisplay, time, serviceName, calendarLink, calendarIcsLink,
      });
    }
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

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
  const reminderEmailPayload = withEmail.map((res) => {
    const duration = Number(res.duration) || 60;
    return {
      id: res.id,
      name: res.name,
      email: res.email,
      date: Utils.formatDateDisplay(res.date),
      time: res.time,
      serviceName: res.serviceName || 'rezervace',
      calendarIcsLink: Utils.createCalendarIcsHttpUrl(
        projectId,
        res.date,
        res.time,
        duration,
        `REZERVACE: ${res.serviceName || 'rezervace'}`,
        res.name ? `Klient: ${res.name}` : ''
      ),
    };
  });

  if (reminderEmailPayload.length > 0) {
    try {
      const resendResult = await callSendReminderEmails({ reservations: reminderEmailPayload });
      emailSent = resendResult?.data?.sent ?? 0;
    } catch (err) {
      console.warn('sendReminderEmails failed, fallback to per-reservation email callable:', err);
      for (const res of reminderEmailPayload) {
        const ok = await sendReminderEmail({
          name: res.name,
          email: res.email,
          date: res.date,
          time: res.time,
          serviceName: res.serviceName,
          calendarIcsLink: res.calendarIcsLink,
        });
        if (ok) emailSent++;
      }
    }
  }

  return { smsSent, emailSent };
}

import {
  callSendBookingEmails,
  callSendReminderEmails,
  useResendEmails,
  EMAILJS_CONFIG,
} from '../firebaseConfig';
import { CONTACT } from '../constants/config';
import { Utils } from '../utils/helpers';

const EMAILJS_API = 'https://api.emailjs.com/api/v1.0/email/send';

function isEmailJsConfigured() {
  return Boolean(EMAILJS_CONFIG.PUBLIC_KEY && EMAILJS_CONFIG.SERVICE_ID);
}

async function emailJsSend(templateId, templateParams) {
  if (!isEmailJsConfigured() || !templateId) return false;
  try {
    const res = await fetch(EMAILJS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.SERVICE_ID,
        template_id: templateId,
        user_id: EMAILJS_CONFIG.PUBLIC_KEY,
        template_params: templateParams,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('EmailJS send failed:', err);
    return false;
  }
}

/**
 * Potvrzení klientovi + kopie adminovi – Resend (callable) nebo EmailJS (fetch).
 */
export async function sendBookingConfirmationAndAdminEmails({
  name,
  email,
  phone,
  date,
  time,
  serviceName,
  calendarLink,
}) {
  if (useResendEmails()) {
    try {
      const result = await callSendBookingEmails({
        name,
        email,
        phone,
        date,
        time,
        serviceName,
        calendarLink,
      });
      const data = result?.data || {};
      return {
        clientOk: Boolean(data.clientOk),
        adminOk: Boolean(data.adminOk),
        clientError: typeof data.clientError === 'string' ? data.clientError : '',
        adminError: typeof data.adminError === 'string' ? data.adminError : '',
      };
    } catch (err) {
      const code = err?.code ?? err?.name;
      const message = err?.message ?? String(err);
      console.error('sendBookingEmails callable failed:', code, message, err);
      return {
        clientOk: false,
        adminOk: false,
        clientError: message,
        adminError: '',
      };
    }
  }

  const clientOk = await emailJsSend(EMAILJS_CONFIG.CONFIRM_TEMPLATE, {
    name,
    to_email: email,
    date,
    time,
    service: serviceName,
    reply_to: CONTACT.EMAIL_PUBLIC,
    calendar_link: calendarLink || '',
  });

  let adminOk = true;
  if (EMAILJS_CONFIG.ADMIN_TEMPLATE) {
    adminOk = await emailJsSend(EMAILJS_CONFIG.ADMIN_TEMPLATE, {
      name,
      to_email: CONTACT.EMAIL_PUBLIC,
      date,
      time,
      service: serviceName,
      phone: phone || '',
      reply_to: email,
      calendar_link: calendarLink || '',
    });
  }

  return { clientOk, adminOk, clientError: '', adminError: '' };
}

/**
 * Připomínky e-mailem – Resend batch callable nebo EmailJS po jednom.
 */
export async function sendReminderEmailsBatch(reservations) {
  if (!reservations.length) return { sent: 0 };

  if (useResendEmails()) {
    try {
      const result = await callSendReminderEmails({ reservations });
      return { sent: result?.data?.sent ?? 0 };
    } catch (err) {
      console.error('sendReminderEmails callable failed:', err);
      return { sent: 0 };
    }
  }

  let sent = 0;
  for (const r of reservations) {
    const dateDisplay = Utils.formatDateDisplay(r.date);
    const ok = await emailJsSend(EMAILJS_CONFIG.REMINDER_TEMPLATE, {
      name: r.name,
      to_email: r.email,
      date: dateDisplay,
      time: r.time,
      service: r.serviceName,
      reply_to: CONTACT.EMAIL_RESERVATIONS,
    });
    if (ok) sent++;
  }
  return { sent };
}

import { EMAILJS_CONFIG } from '../firebaseConfig';
import { CONTACT } from '../constants/config';

const EMAILJS_API = 'https://api.emailjs.com/api/v1.0/email/send';

function isConfigured() {
  return Boolean(EMAILJS_CONFIG.PUBLIC_KEY && EMAILJS_CONFIG.SERVICE_ID);
}

async function send(templateId, templateParams) {
  if (!isConfigured() || !templateId) return false;
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

export async function sendBookingConfirmationEmail({ name, email, date, time, serviceName, calendarIcsLink }) {
  return send(EMAILJS_CONFIG.CONFIRM_TEMPLATE, {
    greeting_line: 'Dobrý den,',
    name,
    to_email: email,
    date,
    time,
    service: serviceName,
    calendar_ics_link: calendarIcsLink || '',
    reply_to: CONTACT.EMAIL_PUBLIC,
  });
}

export async function sendAdminNotificationEmail({ name, email, phone, date, time, serviceName, calendarLink, calendarIcsLink }) {
  if (!EMAILJS_CONFIG.ADMIN_TEMPLATE) return false;
  return send(EMAILJS_CONFIG.ADMIN_TEMPLATE, {
    greeting_line: 'Dobrý den,',
    name,
    to_email: CONTACT.EMAIL_PUBLIC,
    date,
    time,
    service: serviceName,
    phone,
    reply_to: email,
    calendar_link: calendarLink,
    calendar_ics_link: calendarIcsLink || '',
  });
}

export async function sendReminderEmail({ name, email, date, time, serviceName, calendarIcsLink }) {
  return send(EMAILJS_CONFIG.REMINDER_TEMPLATE, {
    greeting_line: 'Dobrý den,',
    name,
    to_email: email,
    date,
    time,
    service: serviceName,
    calendar_ics_link: calendarIcsLink || '',
    reply_to: CONTACT.EMAIL_RESERVATIONS,
  });
}

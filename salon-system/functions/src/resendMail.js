import { Resend } from 'resend';
import {
  getAdminTo,
  getFrom,
  getReplyTo,
  getResendApiKey,
} from './resendEnv.js';

import {
  renderAdminNotificationHtml,
  renderBookingConfirmationHtml,
  renderReminderHtml,
} from '../email/mail.jsx';

function getResendClient() {
  const key = getResendApiKey();
  if (!key) return null;
  return new Resend(key);
}

export { isResendConfigured } from './resendEnv.js';

function resendErrText(err) {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (typeof err.message === 'string' && err.message) return err.message;
  try {
    return JSON.stringify(err).slice(0, 400);
  } catch {
    return String(err);
  }
}

/**
 * Odešle potvrzení klientovi a kopii na admin.
 * @returns {{ clientOk: boolean, adminOk: boolean, clientError?: string, adminError?: string }}
 */
export async function sendBookingEmailsInternal({
  name,
  email,
  phone,
  date,
  time,
  serviceName,
  calendarLink,
}) {
  const from = getFrom();
  const replyTo = getReplyTo();
  const adminTo = getAdminTo();
  const resend = getResendClient();

  if (!getResendApiKey()) {
    return { clientOk: false, adminOk: false, clientError: 'Chybí RESEND_API_KEY (functions / Firebase secrets).' };
  }
  if (!from) {
    return { clientOk: false, adminOk: false, clientError: 'Chybí RESEND_FROM (ověřený odesílatel v Resend).' };
  }
  if (!resend) {
    return { clientOk: false, adminOk: false, clientError: 'Nelze vytvořit Resend klienta.' };
  }

  const clientHtml = await renderBookingConfirmationHtml({
    name,
    date,
    time,
    serviceName,
    calendarLink,
  });

  const clientResult = await resend.emails.send({
    from,
    to: [email],
    replyTo: replyTo || undefined,
    subject: `Potvrzení rezervace – ${serviceName || 'Skin Studio'}`,
    html: clientHtml,
  });

  let clientError = '';
  if (clientResult.error) {
    clientError = resendErrText(clientResult.error);
    console.error('Resend booking → klient:', clientResult.error);
  }
  const clientOk = !clientResult.error;

  let adminOk = true;
  let adminError = '';
  if (adminTo) {
    const adminHtml = await renderAdminNotificationHtml({
      name,
      email,
      phone,
      date,
      time,
      serviceName,
      calendarLink,
    });
    const adminResult = await resend.emails.send({
      from,
      to: [adminTo],
      replyTo: email || replyTo || undefined,
      subject: `Nová rezervace – ${serviceName || 'rezervace'}`,
      html: adminHtml,
    });
    if (adminResult.error) {
      adminError = resendErrText(adminResult.error);
      console.error('Resend booking → admin:', adminResult.error);
    }
    adminOk = !adminResult.error;
  }

  const out = { clientOk, adminOk };
  if (clientError) out.clientError = clientError;
  if (adminError) out.adminError = adminError;
  return out;
}

/**
 * @param {{ name?: string, email: string, date: string, time?: string, serviceName?: string }} params
 */
export async function sendReminderEmailInternal(params) {
  const { name, email, date, time, serviceName } = params;
  const from = getFrom();
  const replyTo = getReplyTo();
  const resend = getResendClient();
  if (!resend || !from || !email) return false;

  const html = await renderReminderHtml({ name, date, time, serviceName });
  const result = await resend.emails.send({
    from,
    to: [email],
    replyTo: replyTo || undefined,
    subject: `Připomínka rezervace – ${date || ''}`.trim(),
    html,
  });
  return !result.error;
}

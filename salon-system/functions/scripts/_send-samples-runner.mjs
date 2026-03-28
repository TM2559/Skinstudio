/**
 * Bundluje se esbuildem z send-resend-samples.mjs – pouze šablony z email/mail.jsx.
 */
import { Resend } from 'resend';
import {
  renderBookingConfirmationHtml,
  renderAdminNotificationHtml,
  renderReminderHtml,
} from '../email/mail.jsx';

export async function run({ to, apiKey, from, replyTo }) {
  const resend = new Resend(apiKey);
  const sample = {
    name: 'Testovací klient',
    date: '28. 03. 2026',
    time: '10:00',
    serviceName: 'Ukázková procedura (test Resend)',
    calendarLink: 'https://calendar.google.com/calendar/render?action=TEMPLATE',
  };
  const sampleAdmin = {
    ...sample,
    email: 'klient@example.cz',
    phone: '+420 777 123 456',
  };

  const html1 = await renderBookingConfirmationHtml(sample);
  const html2 = await renderAdminNotificationHtml(sampleAdmin);
  const html3 = await renderReminderHtml({
    name: sample.name,
    date: sample.date,
    time: sample.time,
    serviceName: sample.serviceName,
  });

  const sends = [
    { subject: '[Skin Studio TEST] Potvrzení rezervace – klient', html: html1 },
    { subject: '[Skin Studio TEST] Nová rezervace (web) – admin', html: html2 },
    { subject: '[Skin Studio TEST] Připomínka rezervace', html: html3 },
  ];

  const out = [];
  for (const s of sends) {
    const r = await resend.emails.send({
      from,
      to: [to],
      replyTo: replyTo || undefined,
      subject: s.subject,
      html: s.html,
    });
    if (r.error) {
      out.push({ subject: s.subject, ok: false, error: r.error });
    } else {
      out.push({ subject: s.subject, ok: true, id: r.data?.id });
    }
  }
  return out;
}

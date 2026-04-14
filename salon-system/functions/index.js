import { randomUUID } from 'node:crypto';
import https from 'node:https';
import { onCall, HttpsError, onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { defineString } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { buildVoucherReadySms, buildVoucherOrderConfirmationSms } from './smsTemplates.js';
import { sendVoucherOrderEmailsInternal, sendVoucherReadyEmailInternal } from './voucherResendMail.js';
import { isResendConfigured } from './lib/chunk-CAD7T5TA.js';

async function loadResendMail() {
  return import('./lib/resendMail-WCKHW2GS.js');
}

/** ICS pro e-mail / Apple Kalendář (GET calendarIcs?start=&end=&sum=…) */
const COMPACT_UTC_RE = /^\d{8}T\d{6}Z$/;
function escapeIcsText(text) {
  if (text == null) return '';
  return String(text).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}
function buildIcsBody({ start, end, summary, description, location }) {
  const uid = `${randomUUID()}@skinstudio.cz`;
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Skin Studio//Rezervace//CS',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(summary)}`,
  ];
  if (description) lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
  lines.push(`LOCATION:${escapeIcsText(location || 'Skin Studio')}`, 'END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}
function firstQueryString(q, key) {
  const v = q[key];
  if (v == null) return '';
  return Array.isArray(v) ? String(v[0] ?? '') : String(v);
}
function icsFromQuery(query) {
  const start = firstQueryString(query, 'start');
  const end = firstQueryString(query, 'end');
  const sum = firstQueryString(query, 'sum');
  if (!start || !end || !sum.trim()) {
    return { error: 'Chybí start, end nebo sum.' };
  }
  if (!COMPACT_UTC_RE.test(start) || !COMPACT_UTC_RE.test(end)) {
    return { error: 'Neplatný formát start/end (očekává se YYYYMMDDTHHmmssZ).' };
  }
  const desc = firstQueryString(query, 'desc');
  const loc = firstQueryString(query, 'loc');
  return {
    body: buildIcsBody({
      start,
      end,
      summary: sum.slice(0, 500),
      description: desc.slice(0, 4000),
      location: loc.slice(0, 500) || 'Masarykovo nám. 72, Uherský Brod',
    }),
  };
}

/** HTTPS odkaz na calendarIcs pro rezervaci (stejná logika jako klient). */
function buildCalendarIcsUrlForReservation(res) {
  const project = process.env.GCLOUD_PROJECT || '';
  if (!project || !res?.date || !res?.time) return '';
  const duration = Number(res.duration) || 60;
  const dateStr = String(res.date);
  const timeStr = String(res.time);
  let year;
  let month;
  let day;
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) {
      [year, month, day] = parts;
    } else {
      [day, month, year] = parts;
    }
  } else {
    return '';
  }
  const title = `REZERVACE: ${res.serviceName || 'rezervace'}`;
  const desc = res.name ? `Klient: ${res.name}` : '';
  const startDate = new Date(`${year}-${month}-${day}T${timeStr}:00`);
  if (Number.isNaN(startDate.getTime())) return '';
  const endDate = new Date(startDate.getTime() + duration * 60000);
  const compact = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const base = `https://europe-west1-${project}.cloudfunctions.net/calendarIcs`;
  const params = new URLSearchParams({
    start: compact(startDate),
    end: compact(endDate),
    sum: title.slice(0, 500),
  });
  if (desc) params.set('desc', desc.slice(0, 4000));
  params.set('loc', 'Masarykovo nám. 72, Uherský Brod');
  return `${base}?${params.toString()}`;
}

initializeApp();
const db = getFirestore();

/** Připojí záznam do voucher_orders.activity_log (transakce kvůli souběžným zápisům). */
async function appendVoucherOrderActivity(orderRef, entry) {
  const at = entry?.at?.toMillis ? entry.at : Timestamp.now();
  const { at: _dropAt, ...rest } = entry || {};
  try {
    await db.runTransaction(async (t) => {
      const snap = await t.get(orderRef);
      if (!snap.exists) return;
      const prev = snap.data().activity_log;
      const list = Array.isArray(prev) ? [...prev] : [];
      list.push({ ...rest, at });
      t.update(orderRef, { activity_log: list });
    });
  } catch (e) {
    console.error('appendVoucherOrderActivity:', e);
  }
}

const adminPasswordParam = defineString('ADMIN_PASSWORD', { default: '' });
const applicationId = defineString('BULKGATE_APPLICATION_ID', { default: '' });
const applicationToken = defineString('BULKGATE_APPLICATION_TOKEN', { default: '' });
/** Shortcode: např. sender_id = "gShort", sender_id_value = "90999" (vaše krátké číslo). */
const senderId = defineString('BULKGATE_SENDER_ID', { default: '' });
const senderIdValue = defineString('BULKGATE_SENDER_ID_VALUE', { default: '' });
const geminiApiKey = defineString('GEMINI_API_KEY', { default: '' });

const BULKGATE_URL = 'https://portal.bulkgate.com/api/1.0/simple/transactional';

/** Normalize Czech phone to E.164 (420...) */
function toE164(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 9 && /^[67]/.test(digits)) return `420${digits}`;
  if (digits.length === 12 && digits.startsWith('420')) return digits;
  if (digits.length >= 9) return `420${digits.slice(-9)}`;
  return null;
}

/** Strip diacritics for GSM 03.38 (160 chars), avoid corruption on devices. */
function removeDiacritics(str) {
  if (!str || typeof str !== 'string') return '';
  const map = {
    á: 'a', č: 'c', ď: 'd', é: 'e', ě: 'e', í: 'i', ň: 'n', ó: 'o', ř: 'r', š: 's', ť: 't', ú: 'u', ů: 'u', ý: 'y', ž: 'z',
    Á: 'A', Č: 'C', Ď: 'D', É: 'E', Ě: 'E', Í: 'I', Ň: 'N', Ó: 'O', Ř: 'R', Š: 'S', Ť: 'T', Ú: 'U', Ů: 'U', Ý: 'Y', Ž: 'Z',
  };
  return str.replace(/./g, (c) => {
    if (map[c]) return map[c];
    const n = c.normalize('NFD');
    return n.length > 1 ? n.replace(/\p{M}/gu, '') : c;
  });
}

/** Date → Czech "D. M." (e.g. "14. 2."). Accepts DD-MM-YYYY or YYYY-MM-DD. Non-breaking space after dot. */
function formatDateForSmsCzech(date) {
  if (!date) return '';
  const s = String(date).trim();
  const parts = s.includes('-') ? s.split('-') : [];
  if (parts.length === 3) {
    const [a, b, c] = parts;
    const day = a.length === 4 ? c : a;
    const month = a.length === 4 ? b : b;
    const dayNum = parseInt(day, 10) || 0;
    const monthNum = parseInt(month, 10) || 0;
    const nbsp = '\u00A0';
    return `${dayNum}.${nbsp}${monthNum}.`;
  }
  return '';
}

/** Time → HH:mm. */
function formatTimeForSms(time) {
  if (!time) return '';
  const t = String(time).trim();
  const match = t.match(/^(\d{1,2}):(\d{1,2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`;
  return t;
}

/** Confirmation SMS: full Czech diacritics, Czech date format (D. M.), clean layout. */
function buildConfirmationSmsMessage(serviceName, date, time, duration) {
  const service = (serviceName || 'rezervace').trim();
  const d = formatDateForSmsCzech(date);
  const t = formatTimeForSms(time);
  const dur = duration ? ` (${duration} min)` : '';
  return `Skin Studio: Váš termín je potvrzen\nSlužba: ${service}${dur}\nKdy: ${d} v ${t}\nKde: Masarykovo nám. 72, Uherský Brod\n\nTěším se na vás, Lucie.`;
}

/** Build reminder SMS text (Czech, short). Bez jména – nelze spolehlivě skloňovat. */
function buildReminderText(dateDisplay, time, serviceName) {
  return `Skin Studio: Dobrý den, připomínáme zítřejší rezervaci ${dateDisplay} v ${time} - ${serviceName}. Těšíme se.`;
}

/** Send one SMS via BulkGate (shared). Uses node:https to avoid undici/HTTP2 issues. */
async function sendOneSms(appId, appToken, number, text, unicode = true, senderIdOpt, senderIdValueOpt) {
  const payload = {
    application_id: parseInt(appId, 10) || appId,
    application_token: appToken,
    number,
    text,
    unicode,
  };
  if (senderIdOpt && senderIdValueOpt) {
    payload.sender_id = senderIdOpt;
    payload.sender_id_value = senderIdValueOpt;
  }
  const body = JSON.stringify(payload);
  console.log(`sendOneSms → number=${number} appId=${appId} bodyLen=${body.length}`);
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'portal.bulkgate.com',
        port: 443,
        path: '/api/1.0/simple/transactional',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 15000,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          let data = {};
          try { data = JSON.parse(raw); } catch { /* non-JSON response */ }
          console.log(`sendOneSms ← status=${res.statusCode} body=${raw.slice(0, 200)}`);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, data });
        });
      }
    );
    req.on('timeout', () => {
      console.error('sendOneSms timeout → destroying socket');
      req.destroy(new Error('BulkGate request timed out'));
    });
    req.on('error', (err) => {
      console.error('sendOneSms error:', err.message);
      resolve({ ok: false, data: { error: err.message } });
    });
    req.write(body);
    req.end();
  });
}

/**
 * Callable: sendReminderSms
 * Body: { reservations: Array<{ id, phone, name, date, time, serviceName }>, firestoreReservationsPrefix?: string }
 * firestoreReservationsPrefix: např. "artifacts/APP_ID/public/data" pro Canvas, jinak prázdné = root "reservations".
 * Odesílá SMS přes BulkGate a nastaví reminderSent ve Firestore.
 */
export const sendReminderSms = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const appId = applicationId.value();
    const appToken = applicationToken.value();
    if (!appId || !appToken) {
      console.error('sendReminderSms: BULKGATE_APPLICATION_ID nebo BULKGATE_APPLICATION_TOKEN chybí.');
      throw new HttpsError('failed-precondition', 'BulkGate není nakonfigurován (BULKGATE_APPLICATION_ID / BULKGATE_APPLICATION_TOKEN). Nastav je v functions/.env a znovu nasaď funkci.');
    }

    const { reservations, firestoreReservationsPrefix } = request.data || {};
    if (!Array.isArray(reservations) || reservations.length === 0) {
      return { sent: 0, errors: [], message: 'Žádné rezervace k odeslání.' };
    }

    const reservationDocPath = (id) => {
      const base = firestoreReservationsPrefix && String(firestoreReservationsPrefix).trim();
      return base ? `${base}/reservations/${id}` : `reservations/${id}`;
    };

    let sent = 0;
    const errors = [];

    for (const res of reservations) {
      const number = toE164(res.phone);
      if (!number) {
        errors.push({ id: res.id, reason: 'Neplatné nebo chybějící telefonní číslo' });
        continue;
      }

      const dateDisplay = res.date ? res.date.replace(/-/g, '/') : '';
      const text = buildReminderText(dateDisplay, res.time || '', res.serviceName || 'rezervace');

      const sid = senderId.value();
      const sidVal = senderIdValue.value();
      try {
        const { ok, data } = await sendOneSms(appId, appToken, number, text, true, sid || undefined, sidVal || undefined);
        if (!ok) {
          const reason = data.error || data.message || 'BulkGate API chyba';
          console.warn('BulkGate API chyba:', reason, data);
          errors.push({ id: res.id, reason });
          continue;
        }

        const docPath = reservationDocPath(res.id);
        await db.doc(docPath).update({ reminderSent: true });
        sent++;
      } catch (err) {
        console.error('sendReminderSms položka:', res.id, err);
        errors.push({ id: res.id, reason: err.message || 'Chyba odeslání' });
      }
    }

    return { sent, errors, message: `Odesláno ${sent} SMS.` };
  }
);

export const sendBookingEmails = onCall({ region: 'europe-west1' }, async (request) => {
  if (!isResendConfigured()) {
    throw new HttpsError(
      'failed-precondition',
      'Resend není nakonfigurován (RESEND_API_KEY, RESEND_FROM). Nastav v prostředí functions a znovu nasaď.'
    );
  }

  const { name, email, phone, date, time, serviceName, calendarLink, calendarIcsLink } = request.data || {};
  if (!email || typeof email !== 'string' || !email.trim()) {
    throw new HttpsError('invalid-argument', 'E-mail je povinný.');
  }
  if (!date || !time || !serviceName) {
    throw new HttpsError('invalid-argument', 'Chybí datum, čas nebo služba.');
  }

  const { sendBookingEmailsInternal } = await loadResendMail();
  const result = await sendBookingEmailsInternal({
    name: typeof name === 'string' ? name : '',
    email: email.trim(),
    phone: typeof phone === 'string' ? phone : '',
    date,
    time,
    serviceName,
    calendarLink: typeof calendarLink === 'string' ? calendarLink : '',
    calendarIcsLink: typeof calendarIcsLink === 'string' ? calendarIcsLink : '',
  });

  const { clientOk, adminOk, clientError, adminError } = result;
  return {
    clientOk,
    adminOk,
    ...(clientError ? { clientError } : {}),
    ...(adminError ? { adminError } : {}),
  };
});

/** Samostatné callable pro klienta (fallback z webu / opakování po chybě). */
export const sendBookingConfirmationEmail = onCall({ region: 'europe-west1' }, async (request) => {
  if (!isResendConfigured()) {
    throw new HttpsError(
      'failed-precondition',
      'Resend není nakonfigurován (RESEND_API_KEY, RESEND_FROM). Nastav v prostředí functions a znovu nasaď.'
    );
  }
  const { name, email, date, time, serviceName, calendarIcsLink } = request.data || {};
  if (!email || typeof email !== 'string' || !email.trim()) {
    throw new HttpsError('invalid-argument', 'E-mail je povinný.');
  }
  if (!date || !time || !serviceName) {
    throw new HttpsError('invalid-argument', 'Chybí datum, čas nebo služba.');
  }
  const { sendBookingEmailsInternal } = await loadResendMail();
  const result = await sendBookingEmailsInternal({
    name: typeof name === 'string' ? name : '',
    email: email.trim(),
    phone: '',
    date,
    time,
    serviceName,
    calendarLink: '',
    calendarIcsLink: typeof calendarIcsLink === 'string' ? calendarIcsLink : '',
    mode: 'clientOnly',
  });
  return { sent: result.clientOk };
});

/** Samostatné callable pro admin notifikaci (fallback z webu). */
export const sendAdminNotificationEmail = onCall({ region: 'europe-west1' }, async (request) => {
  if (!isResendConfigured()) {
    throw new HttpsError(
      'failed-precondition',
      'Resend není nakonfigurován (RESEND_API_KEY, RESEND_FROM). Nastav v prostředí functions a znovu nasaď.'
    );
  }
  const { name, email, phone, date, time, serviceName, calendarLink, calendarIcsLink } = request.data || {};
  if (!date || !time || !serviceName) {
    throw new HttpsError('invalid-argument', 'Chybí datum, čas nebo služba.');
  }
  const { sendBookingEmailsInternal } = await loadResendMail();
  const result = await sendBookingEmailsInternal({
    name: typeof name === 'string' ? name : '',
    email: typeof email === 'string' ? email : '',
    phone: typeof phone === 'string' ? phone : '',
    date,
    time,
    serviceName,
    calendarLink: typeof calendarLink === 'string' ? calendarLink : '',
    calendarIcsLink: typeof calendarIcsLink === 'string' ? calendarIcsLink : '',
    mode: 'adminOnly',
  });
  return { sent: result.adminOk };
});

/** Jednotlivá připomínka e-mailem (fallback když batch sendReminderEmails selže). */
export const sendReminderEmailCallable = onCall({ region: 'europe-west1' }, async (request) => {
  if (!isResendConfigured()) {
    throw new HttpsError(
      'failed-precondition',
      'Resend není nakonfigurován (RESEND_API_KEY, RESEND_FROM). Nastav v prostředí functions a znovu nasaď.'
    );
  }
  const { name, email, date, time, serviceName, calendarIcsLink } = request.data || {};
  if (!email || typeof email !== 'string' || !email.trim()) {
    throw new HttpsError('invalid-argument', 'E-mail je povinný.');
  }
  const { sendReminderEmailInternal } = await loadResendMail();
  const ok = await sendReminderEmailInternal({
    name,
    email: email.trim(),
    date,
    time,
    serviceName: serviceName || 'rezervace',
    calendarIcsLink: typeof calendarIcsLink === 'string' ? calendarIcsLink : '',
  });
  return { sent: ok };
});

export const sendReminderEmails = onCall({ region: 'europe-west1' }, async (request) => {
  if (!isResendConfigured()) {
    throw new HttpsError('failed-precondition', 'Resend není nakonfigurován (RESEND_API_KEY, RESEND_FROM).');
  }
  const { reservations } = request.data || {};
  if (!Array.isArray(reservations) || reservations.length === 0) {
    return { sent: 0, errors: [], message: 'Žádné e-maily k odeslání.' };
  }

  let sent = 0;
  const errors = [];
  const { sendReminderEmailInternal } = await loadResendMail();
  for (const r of reservations) {
    const addr = r.email && typeof r.email === 'string' ? r.email.trim() : '';
    if (!addr) {
      errors.push({ id: r.id, reason: 'Chybějící e-mail' });
      continue;
    }
    try {
      const dateDisplay =
        typeof r.date === 'string' ? r.date.replace(/-/g, '/') : String(r.date || '').replace(/-/g, '/');
      const ok = await sendReminderEmailInternal({
        name: r.name,
        email: addr,
        date: dateDisplay,
        time: r.time,
        serviceName: r.serviceName || 'rezervace',
        calendarIcsLink: typeof r.calendarIcsLink === 'string' ? r.calendarIcsLink : '',
      });
      if (ok) sent++;
      else errors.push({ id: r.id, reason: 'Resend odmítl odeslání' });
    } catch (err) {
      console.error('sendReminderEmails položka:', r.id, err);
      errors.push({ id: r.id, reason: err.message || 'Chyba odeslání' });
    }
  }
  return { sent, errors, message: `Odesláno ${sent} e-mailů.` };
});

/**
 * Callable: sendConfirmationSms
 * Body: { phone, name, date, time, serviceName, duration } – po vytvoření rezervace, jedna SMS na číslo klienta.
 */
export const sendConfirmationSms = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const appId = applicationId.value();
    const appToken = applicationToken.value();
    if (!appId || !appToken) {
      throw new HttpsError('failed-precondition', 'BulkGate není nakonfigurován (BULKGATE_APPLICATION_ID / BULKGATE_APPLICATION_TOKEN).');
    }

    const { phone, date, time, serviceName, duration } = request.data || {};
    const number = toE164(phone);
    if (!number) {
      throw new HttpsError('invalid-argument', 'Neplatné nebo chybějící telefonní číslo.');
    }

    const text = buildConfirmationSmsMessage(serviceName, date, time, duration);
    const sid = senderId.value();
    const sidVal = senderIdValue.value();

    const { ok, data } = await sendOneSms(appId, appToken, number, text, true, sid || undefined, sidVal || undefined);
    if (!ok) {
      console.warn('BulkGate sendConfirmationSms:', data);
      throw new HttpsError('internal', data.error || data.message || 'BulkGate API chyba.');
    }

    return { sent: true, message: 'SMS potvrzení odeslána.' };
  }
);

// --- format-content API (AI Magic Wand). Set GEMINI_API_KEY in Firebase Console or .env. ---
const FORMAT_SYSTEM_PROMPT = `You are a luxury copywriter for Skin Studio. Your tone is 'Quiet Luxury'—minimalist, professional, and empathetic.
Convert the user's raw notes into a Markdown-formatted description for a beauty service.
Rules:
1. Write the entire output in Czech.
2. Use **bold** for key benefits.
3. Use bullet points for clear structure.
4. Keep it editorial and soft-sell (don't be pushy).
5. Output only the Markdown content.`;

async function formatWithGemini(rawText, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${FORMAT_SYSTEM_PROMPT}\n\nUser raw notes:\n${rawText}` }] }],
        generationConfig: { temperature: 0.5 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text == null) throw new Error('No text in Gemini response');
  return text.trim();
}

export const formatContent = onRequest(
  { region: 'europe-west1', timeoutSeconds: 60 },
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    const send = (status, data) => {
      try {
        res.status(status).json(data);
      } catch (e) {
        console.error('formatContent send error', e);
      }
    };
    try {
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }
      if (req.method !== 'POST') {
        send(405, { error: 'Method not allowed' });
        return;
      }
      const body = req.body || {};
      const rawText = body.rawText;
      if (typeof rawText !== 'string') {
        send(400, { error: 'Missing or invalid rawText' });
        return;
      }
      const trimmed = rawText.trim();
      if (!trimmed) {
        send(400, { error: 'rawText is empty' });
        return;
      }
      let key = '';
      try {
        key = geminiApiKey.value() || process.env.GEMINI_API_KEY || '';
      } catch (_) {
        key = process.env.GEMINI_API_KEY || '';
      }
      if (!key) {
        send(503, { error: 'No LLM configured. Set GEMINI_API_KEY in env or params.' });
        return;
      }
      const formattedMarkdown = await formatWithGemini(trimmed, key);
      send(200, { formattedMarkdown });
    } catch (err) {
      console.error('formatContent error', err);
      send(500, { error: err.message || 'Formatting failed' });
    }
  }
);

/**
 * Callable: verifyAdminPassword
 * Body: { password }
 * Server-side admin password verification – password never exposed in client bundle.
 */
export const verifyAdminPassword = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const adminPw = adminPasswordParam.value();
    if (!adminPw) throw new HttpsError('failed-precondition', 'ADMIN_PASSWORD není nastaven v prostředí functions.');
    const { password } = request.data || {};
    if (!password || typeof password !== 'string') {
      throw new HttpsError('invalid-argument', 'Heslo je povinné.');
    }
    if (password !== adminPw) {
      throw new HttpsError('permission-denied', 'Chybné heslo.');
    }

    const uid = request.auth?.uid;
    if (uid) {
      await getAuth().setCustomUserClaims(uid, { admin: true });
    }

    return { verified: true };
  }
);

/** Czech phone: +420 and 9 digits (optional spaces). */
function normalizeCzechPhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 9 && /^[67]/.test(digits)) return `+420${digits}`;
  if (digits.length === 12 && digits.startsWith('420')) return `+${digits}`;
  if (digits.length >= 9) return `+420${digits.slice(-9)}`;
  return null;
}

/**
 * Callable: createVoucherOrder
 * Creates a pending voucher order (cash on pickup). Re-calculates total_price server-side.
 */
export const createVoucherOrder = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const data = request.data || {};
    const {
      voucherId,
      customAmountKc,
      packaging,
      pickupDateType,
      customPickupDate,
      contactPhone,
      contactEmail,
    } = data;

    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Pro objednání je nutné být přihlášen.');
    }

    if (!['envelope', 'box'].includes(packaging)) {
      throw new HttpsError('invalid-argument', 'Neplatný typ balení.');
    }
    const phone = normalizeCzechPhone(contactPhone);
    if (!phone) {
      throw new HttpsError('invalid-argument', 'Zadejte platné české telefonní číslo (+420 a 9 číslic).');
    }
    const email = (contactEmail && typeof contactEmail === 'string') ? contactEmail.trim() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpsError('invalid-argument', 'Zadejte platný e-mail.');
    }

    let targetPickupDate;
    if (pickupDateType === 'tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      targetPickupDate = d.toISOString().slice(0, 10);
    } else if (pickupDateType === 'later' && customPickupDate && typeof customPickupDate === 'string') {
      const minLater = new Date();
      minLater.setDate(minLater.getDate() + 2);
      const minStr = minLater.toISOString().slice(0, 10);
      if (customPickupDate < minStr) {
        throw new HttpsError('invalid-argument', 'Datum vyzvednutí musí být nejdříve pozítří.');
      }
      targetPickupDate = customPickupDate.slice(0, 10);
    } else {
      throw new HttpsError('invalid-argument', 'Vyberte datum vyzvednutí.');
    }

    const hasCustomAmount =
      customAmountKc !== undefined && customAmountKc !== null && customAmountKc !== '';

    if (!voucherId || typeof voucherId !== 'string') {
      throw new HttpsError('invalid-argument', 'Neplatný výběr poukazu.');
    }

    const voucherSnap = await db.collection('voucher_templates').doc(voucherId).get();
    if (!voucherSnap.exists) {
      throw new HttpsError('not-found', 'Vybraný poukaz nebyl nalezen.');
    }
    const voucherData = voucherSnap.data();
    const templateCustom = voucherData.is_custom_amount === true;

    let voucherPrice;
    const resolvedVoucherId = voucherId;
    let isCustomAmount = false;

    if (templateCustom) {
      if (!hasCustomAmount) {
        throw new HttpsError('invalid-argument', 'Zadejte částku poukazu.');
      }
      const amt = typeof customAmountKc === 'number' ? customAmountKc : parseInt(String(customAmountKc), 10);
      const minFromTemplate =
        typeof voucherData.price === 'number' ? voucherData.price : parseInt(voucherData.price, 10) || 500;
      const floor = Math.max(500, minFromTemplate);
      if (!Number.isFinite(amt) || amt < floor || amt > 500000) {
        throw new HttpsError(
          'invalid-argument',
          `Zadejte platnou částku (${floor.toLocaleString('cs-CZ')}–500 000 Kč).`
        );
      }
      voucherPrice = Math.floor(amt);
      isCustomAmount = true;
    } else {
      if (hasCustomAmount) {
        throw new HttpsError('invalid-argument', 'Tento poukaz má pevnou cenu.');
      }
      voucherPrice = typeof voucherData.price === 'number' ? voucherData.price : parseInt(voucherData.price, 10) || 0;
      if (!Number.isFinite(voucherPrice) || voucherPrice <= 0) {
        throw new HttpsError('failed-precondition', 'Neplatná cena poukazu.');
      }
    }

    const totalPrice = voucherPrice + (packaging === 'box' ? 100 : 0);

    const orderData = {
      voucher_id: resolvedVoucherId,
      packaging,
      target_pickup_date: targetPickupDate,
      contact_phone: phone,
      contact_email: email,
      total_price: totalPrice,
      status: 'new',
      created_at: FieldValue.serverTimestamp(),
      activity_log: [
        {
          at: Timestamp.now(),
          kind: 'order_created',
        },
      ],
      ...(isCustomAmount
        ? { is_custom_amount: true, custom_amount_kc: voucherPrice }
        : {}),
    };

    const ref = await db.collection('voucher_orders').add(orderData);

    const voucherLabel = isCustomAmount
      ? `Poukaz na ${voucherPrice.toLocaleString('cs-CZ')} Kč`
      : (voucherData.name || 'Dárkový poukaz');

    void sendVoucherOrderEmailsInternal({
      orderId: ref.id,
      voucherLabel,
      packaging,
      targetPickupDate,
      contactEmail: email,
      contactPhone: phone,
      totalPriceKc: totalPrice,
    })
      .then(async (result) => {
        await appendVoucherOrderActivity(ref, {
          kind: 'emails_confirmation',
          client_ok: !!result.clientOk,
          admin_ok: !!result.adminOk,
        });
      })
      .catch(async (err) => {
        console.error('createVoucherOrder confirmation emails:', err);
        await appendVoucherOrderActivity(ref, {
          kind: 'emails_confirmation',
          error: err?.message || String(err),
        });
      });

    // Initial order confirmation SMS (fire-and-forget; do not block response)
    const number = toE164(phone);
    if (number) {
      const appId = applicationId.value();
      const appToken = applicationToken.value();
      if (appId && appToken) {
        const rawText = buildVoucherOrderConfirmationSms(totalPrice);
        const text = removeDiacritics(rawText);
        const sid = senderId.value();
        const sidVal = senderIdValue.value();
        sendOneSms(appId, appToken, number, text, false, sid || undefined, sidVal || undefined)
          .then(async ({ ok, data: resData }) => {
            if (!ok) console.warn('createVoucherOrder confirmation SMS BulkGate:', resData);
            await appendVoucherOrderActivity(ref, {
              kind: 'sms_order_confirmation',
              ok: !!ok,
            });
          })
          .catch(async (err) => {
            console.error('createVoucherOrder confirmation SMS failed:', err);
            await appendVoucherOrderActivity(ref, {
              kind: 'sms_order_confirmation',
              ok: false,
              error: err?.message || String(err),
            });
          });
      } else {
        void appendVoucherOrderActivity(ref, {
          kind: 'sms_order_confirmation',
          skipped: true,
          reason: 'bulkgate_not_configured',
        });
      }
    } else {
      void appendVoucherOrderActivity(ref, {
        kind: 'sms_order_confirmation',
        skipped: true,
        reason: 'invalid_phone',
      });
    }

    return { orderId: ref.id, total_price: totalPrice };
  }
);

const VOUCHER_ORDER_STATUSES = ['new', 'ready', 'completed', 'cancelled'];

/**
 * Callable: updateVoucherOrderStatus
 * Body: { orderId: string, status: 'new' | 'ready' | 'completed' | 'cancelled' }
 * Při přechodu new -> ready odešle SMS přes BulkGate (poukaz připraven k vyzvednutí).
 */
export const updateVoucherOrderStatus = onCall(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Pro změnu stavu je nutné být přihlášen.');
    }

    const { orderId, status } = request.data || {};
    if (!orderId || typeof orderId !== 'string') {
      throw new HttpsError('invalid-argument', 'Chybí nebo neplatné orderId.');
    }
    if (!VOUCHER_ORDER_STATUSES.includes(status)) {
      throw new HttpsError('invalid-argument', `Neplatný stav. Povolené: ${VOUCHER_ORDER_STATUSES.join(', ')}.`);
    }

    const ref = db.collection('voucher_orders').doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Objednávka nebyla nalezena.');
    }

    const data = snap.data();
    const previousStatus = data.status || 'new';

    let smsSent = false;
    let smsReadySkippedReason = null;
    const wasPendingOrNew = previousStatus === 'new' || previousStatus === 'pending';
    if (wasPendingOrNew && status === 'ready') {
      const appId = applicationId.value();
      const appToken = applicationToken.value();
      const phone = data.contact_phone;
      const totalPrice = data.total_price;

      if (!appId || !appToken) {
        smsReadySkippedReason = 'bulkgate_not_configured';
      } else if (!phone) {
        smsReadySkippedReason = 'missing_phone';
      } else {
        const number = toE164(phone);
        if (!number) {
          smsReadySkippedReason = 'invalid_phone';
        } else {
          const rawText = buildVoucherReadySms(totalPrice);
          const text = removeDiacritics(rawText);
          const sid = senderId.value();
          const sidVal = senderIdValue.value();
          try {
            const { ok, data: resData } = await sendOneSms(appId, appToken, number, text, false, sid || undefined, sidVal || undefined);
            if (ok) {
              smsSent = true;
            } else {
              console.warn('updateVoucherOrderStatus BulkGate:', resData);
              smsReadySkippedReason = 'send_failed';
            }
          } catch (err) {
            console.error('updateVoucherOrderStatus SMS:', err);
            smsReadySkippedReason = 'send_failed';
          }
        }
      }
    }

    // Email zákazníkovi při přechodu na „Připraveno" (fire-and-forget)
    let emailReadySent = false;
    if (wasPendingOrNew && status === 'ready' && data.contact_email) {
      try {
        // Dohledání názvu poukazu ze šablony
        let voucherLabel = 'Dárkový poukaz';
        if (data.is_custom_amount && data.custom_amount_kc) {
          voucherLabel = `Poukaz na ${Number(data.custom_amount_kc).toLocaleString('cs-CZ')} Kč`;
        } else if (data.voucher_id) {
          const tSnap = await db.collection('voucher_templates').doc(data.voucher_id).get();
          if (tSnap.exists) voucherLabel = tSnap.data().name || voucherLabel;
        }
        const emailResult = await sendVoucherReadyEmailInternal({
          contactEmail: data.contact_email,
          voucherLabel,
          totalPriceKc: data.total_price,
        });
        emailReadySent = emailResult.ok;
        if (!emailResult.ok) {
          console.warn('updateVoucherOrderStatus: email ready failed:', emailResult.error);
        }
      } catch (err) {
        console.error('updateVoucherOrderStatus: email ready error:', err);
      }
    }

    const logEntry = {
      at: Timestamp.now(),
      kind: 'status_change',
      from: previousStatus,
      to: status,
    };
    if (wasPendingOrNew && status === 'ready') {
      logEntry.sms_ready_sent = smsSent;
      if (!smsSent && smsReadySkippedReason) {
        logEntry.sms_ready_skipped = smsReadySkippedReason;
      }
      logEntry.email_ready_sent = emailReadySent;
    }

    await db.runTransaction(async (t) => {
      const fresh = await t.get(ref);
      if (!fresh.exists) {
        throw new HttpsError('not-found', 'Objednávka nebyla nalezena.');
      }
      const prevLog = fresh.data().activity_log;
      const list = Array.isArray(prevLog) ? [...prevLog] : [];
      list.push(logEntry);
      t.update(ref, { status, activity_log: list });
    });

    return { success: true, smsSent };
  }
);

// --- Admin WebAuthn (Face ID / Touch ID) ---
const ADMIN_WEBAUTHN_DOC = 'config/admin_webauthn';
const ADMIN_WEBAUTHN_CHALLENGE_DOC = 'config/admin_webauthn_challenge';
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

function getAllowedOrigins() {
  return [
    'http://localhost',
    'http://localhost:5173',
    'http://127.0.0.1',
    'http://127.0.0.1:5173',
    'https://localhost',
    'https://tm-reservations.web.app',
    'https://tm-reservations.firebaseapp.com',
    'http://skinstudio.cz',
    'https://skinstudio.cz',
    'http://www.skinstudio.cz',
    'https://www.skinstudio.cz',
  ];
}

function getExtraOriginHosts() {
  try {
    const raw = process.env.WEBAPP_ORIGIN_HOSTS || '';
    return raw.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}

function isOriginAllowed(origin) {
  if (!origin || typeof origin !== 'string') return false;
  const o = origin.replace(/\/$/, '').trim();
  if (!o) return false;
  if (getAllowedOrigins().includes(o)) return true;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.web.app') || host.endsWith('.firebaseapp.com')) return true;
    if (getExtraOriginHosts().includes(host)) return true;
    return false;
  } catch {
    return false;
  }
}

/** Získá origin z request.data nebo z HTTP hlaviček (pro callable). */
function getOriginFromRequest(request) {
  const fromData = request.data?.origin;
  if (fromData && typeof fromData === 'string' && fromData.trim()) return fromData.trim();
  const raw = request.rawRequest;
  const h = raw?.headers;
  const originVal = (h && (typeof h.get === 'function' ? h.get('origin') : h.origin)) ?? null;
  if (typeof originVal === 'string' && originVal.trim()) return originVal.trim();
  const referer = (h && (typeof h.get === 'function' ? h.get('referer') : h.referer)) ?? null;
  if (typeof referer === 'string' && referer.trim()) {
    try {
      const u = new URL(referer);
      return `${u.protocol}//${u.host}`;
    } catch (_) {}
  }
  return null;
}

function getRpIdFromOrigin(origin) {
  try {
    return new URL(origin).hostname;
  } catch {
    return 'localhost';
  }
}

/** @simplewebauthn/server vyžaduje u authentication response shodu id a rawId (base64url). */
function normalizeAuthenticationAssertion(assertion) {
  if (!assertion || typeof assertion !== 'object') return assertion;
  const rawId = typeof assertion.rawId === 'string' ? assertion.rawId : assertion.id;
  if (!rawId || typeof rawId !== 'string') return assertion;
  return { ...assertion, id: rawId, rawId };
}

async function findCredentialByAssertionId(creds, assertionId) {
  if (!assertionId || typeof assertionId !== 'string') return undefined;
  const direct = creds.find((c) => c && typeof c.id === 'string' && c.id === assertionId);
  if (direct) return direct;
  const { isoBase64URL } = await import('@simplewebauthn/server/helpers');
  let bufAssertion;
  try {
    bufAssertion = isoBase64URL.toBuffer(assertionId);
  } catch {
    return undefined;
  }
  for (const c of creds) {
    if (!c || typeof c.id !== 'string') continue;
    try {
      const bufC = isoBase64URL.toBuffer(c.id);
      if (bufC.length === bufAssertion.length && bufC.every((v, i) => v === bufAssertion[i])) return c;
    } catch {
      /* další credential */
    }
  }
  return undefined;
}

/** Callable: getAdminWebAuthnRegistrationOptions. Tělo: { password, origin }. */
export const getAdminWebAuthnRegistrationOptions = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const { generateRegistrationOptions } = await import('@simplewebauthn/server');
    const adminPw = adminPasswordParam.value();
    if (!adminPw) throw new HttpsError('failed-precondition', 'ADMIN_PASSWORD není nastaven v prostředí functions.');
    const { password } = request.data || {};
    const origin = getOriginFromRequest(request);
    if (password !== adminPw) throw new HttpsError('permission-denied', 'Chybné heslo.');
    if (!origin || !isOriginAllowed(origin)) {
      throw new HttpsError('invalid-argument', `Neplatný origin. Obdrženo: ${origin ?? '(prázdné)'}`);
    }
    const rpID = getRpIdFromOrigin(origin);
    const rpName = 'Skin Studio Admin';
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: 'admin',
      userDisplayName: 'Admin',
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
        authenticatorAttachment: 'platform',
      },
      supportedAlgorithmIDs: [-7, -257],
    });
    await db.doc(ADMIN_WEBAUTHN_CHALLENGE_DOC).set({
      challenge: options.challenge,
      createdAt: Date.now(),
      type: 'registration',
    });
    return options;
  }
);

/** Callable: verifyAdminWebAuthnRegistration. Tělo: { password, origin, credential }. */
export const verifyAdminWebAuthnRegistration = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const { verifyRegistrationResponse } = await import('@simplewebauthn/server');
    const adminPw = adminPasswordParam.value();
    if (!adminPw) throw new HttpsError('failed-precondition', 'ADMIN_PASSWORD není nastaven.');
    const { password, credential: rawCredential } = request.data || {};
    const credential = normalizeAuthenticationAssertion(rawCredential);
    if (!credential || !credential.response) {
      throw new HttpsError('invalid-argument', 'Chybí odpověď WebAuthn (credential).');
    }
    const origin = getOriginFromRequest(request);
    if (password !== adminPw) throw new HttpsError('permission-denied', 'Chybné heslo.');
    if (!origin || !isOriginAllowed(origin)) {
      throw new HttpsError('invalid-argument', `Neplatný origin. Obdrženo: ${origin ?? '(prázdné)'}`);
    }
    const rpID = getRpIdFromOrigin(origin);
    const snap = await db.doc(ADMIN_WEBAUTHN_CHALLENGE_DOC).get();
    const data = snap.data();
    if (!data || data.type !== 'registration' || Date.now() - (data.createdAt || 0) > CHALLENGE_TTL_MS) {
      throw new HttpsError('failed-precondition', 'Vypršela platnost registrace. Zkuste znovu.');
    }
    const expectedChallenge = data.challenge;
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch (err) {
      console.error('verifyAdminWebAuthnRegistration', err);
      throw new HttpsError('invalid-argument', err.message || 'Ověření registrace selhalo.');
    }
    await db.doc(ADMIN_WEBAUTHN_CHALLENGE_DOC).delete();
    if (!verification.verified || !verification.registrationInfo) {
      throw new HttpsError('invalid-argument', 'Registrace nebyla ověřena.');
    }
    const { credential: regCred, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    const publicKeyB64 = Buffer.from(regCred.publicKey).toString('base64');
    const newCred = {
      id: regCred.id,
      publicKey: publicKeyB64,
      counter: regCred.counter,
      transports: regCred.transports || [],
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    };
    const docRef = db.doc(ADMIN_WEBAUTHN_DOC);
    const existingSnap = await docRef.get();
    const existingData = existingSnap.data();
    const existingCreds = (existingData && existingData.credentials) || [];
    const alreadyExists = existingCreds.some((c) => c.id === regCred.id);
    if (alreadyExists) {
      throw new HttpsError('invalid-argument', 'Toto zařízení už je zaregistrované.');
    }
    const credentials = [...existingCreds, newCred];
    await docRef.set({ credentials });
    return { verified: true };
  }
);

/**
 * Callable: getAdminWebAuthnConfigured. Tělo: { origin }.
 * Pouze zjistí, zda je uložen alespoň jeden klíč — nezasahuje do challenge dokumentu.
 * (Probe přes getAdminWebAuthnLoginOptions by jinak závodil s kliknutím na Face ID a přepisoval challenge.)
 */
export const getAdminWebAuthnConfigured = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const origin = getOriginFromRequest(request);
    if (!origin || !isOriginAllowed(origin)) {
      throw new HttpsError('invalid-argument', `Neplatný origin. Obdrženo: ${origin ?? '(prázdné)'}`);
    }
    const docSnap = await db.doc(ADMIN_WEBAUTHN_DOC).get();
    const creds = (docSnap.data() && docSnap.data().credentials) || [];
    console.log(`getAdminWebAuthnConfigured: origin=${origin} creds=${creds.length}`);
    return { configured: creds.length > 0 };
  }
);

/** Callable: getAdminWebAuthnLoginOptions. Tělo: { origin }. */
export const getAdminWebAuthnLoginOptions = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const { generateAuthenticationOptions } = await import('@simplewebauthn/server');
    const origin = getOriginFromRequest(request);
    if (!origin || !isOriginAllowed(origin)) {
      throw new HttpsError('invalid-argument', `Neplatný origin. Obdrženo: ${origin ?? '(prázdné)'}`);
    }
    const rpID = getRpIdFromOrigin(origin);
    const docSnap = await db.doc(ADMIN_WEBAUTHN_DOC).get();
    const data = docSnap.data();
    const creds = (data && data.credentials) || [];
    if (creds.length === 0) throw new HttpsError('failed-precondition', 'Face ID není nastaven. Nejprve se přihlaste heslem a nastavte Face ID.');
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: creds.map((c) => ({ id: c.id, type: 'public-key', transports: c.transports })),
      userVerification: 'required',
    });
    await db.doc(ADMIN_WEBAUTHN_CHALLENGE_DOC).set({
      challenge: options.challenge,
      createdAt: Date.now(),
      type: 'authentication',
    });
    return options;
  }
);

/** Callable: verifyAdminWebAuthnLogin. Tělo: { origin, assertion }. */
export const verifyAdminWebAuthnLogin = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const { verifyAuthenticationResponse } = await import('@simplewebauthn/server');
    const { assertion: rawAssertion } = request.data || {};
    const assertion = normalizeAuthenticationAssertion(rawAssertion);
    if (!assertion || !assertion.response) {
      throw new HttpsError('invalid-argument', 'Chybí odpověď WebAuthn (assertion).');
    }
    const origin = getOriginFromRequest(request);
    if (!origin || !isOriginAllowed(origin)) {
      throw new HttpsError('invalid-argument', `Neplatný origin. Obdrženo: ${origin ?? '(prázdné)'}`);
    }
    const rpID = getRpIdFromOrigin(origin);
    const docSnap = await db.doc(ADMIN_WEBAUTHN_DOC).get();
    const creds = (docSnap.data() && docSnap.data().credentials) || [];
    const challengeSnap = await db.doc(ADMIN_WEBAUTHN_CHALLENGE_DOC).get();
    const challengeData = challengeSnap.data();
    if (!challengeData || challengeData.type !== 'authentication' || Date.now() - (challengeData.createdAt || 0) > CHALLENGE_TTL_MS) {
      throw new HttpsError('failed-precondition', 'Vypršela platnost přihlášení. Zkuste znovu.');
    }
    const assertionId = assertion.id || assertion.rawId;
    const cred = await findCredentialByAssertionId(creds, assertionId);
    if (!cred) throw new HttpsError('permission-denied', 'Neznámý přihlašovací klíč.');
    const publicKey = new Uint8Array(Buffer.from(cred.publicKey, 'base64'));
    const counter =
      typeof cred.counter === 'number' && !Number.isNaN(cred.counter)
        ? cred.counter
        : parseInt(String(cred.counter), 10) || 0;
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: assertion,
        expectedChallenge: challengeData.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: cred.id,
          publicKey,
          counter,
          transports: cred.transports,
        },
      });
    } catch (err) {
      console.error('verifyAdminWebAuthnLogin', err);
      throw new HttpsError('invalid-argument', err.message || 'Ověření přihlášení selhalo.');
    }
    await db.doc(ADMIN_WEBAUTHN_CHALLENGE_DOC).delete();
    if (!verification.verified) throw new HttpsError('permission-denied', 'Přihlášení nebylo ověřeno.');
    const { newCounter } = verification.authenticationInfo || {};
    if (typeof newCounter === 'number') {
      const updated = creds.map((c) => (c.id === cred.id ? { ...c, counter: newCounter } : c));
      await db.doc(ADMIN_WEBAUTHN_DOC).update({ credentials: updated });
    }
    const uid = request.auth?.uid;
    if (uid) {
      await getAuth().setCustomUserClaims(uid, { admin: true });
    }
    return { verified: true };
  }
);

/**
 * GET /calendarIcs?start=YYYYMMDDTHHmmssZ&end=...&sum=...&desc=...&loc=...
 * Odpověď: text/calendar pro „Přidat do kalendáře“ z e-mailu (Apple / Outlook).
 */
export const calendarIcs = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).set('Allow', 'GET, OPTIONS').send('Method Not Allowed');
    return;
  }
  const result = icsFromQuery(req.query || {});
  if (result.error) {
    res.status(400).set('Content-Type', 'text/plain; charset=utf-8').send(result.error);
    return;
  }
  res.set('Content-Type', 'text/calendar; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="skin-studio-rezervace.ics"');
  res.set('Cache-Control', 'private, max-age=300');
  res.send(result.body);
});

/** Vrátí klíč data ve formátu DD-MM-YYYY pro zítřek (lokální čas). */
function getTomorrowDateKey() {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  const d = t.getDate();
  const m = t.getMonth() + 1;
  const y = t.getFullYear();
  return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
}

/** Formát data pro zobrazení (DD/MM/YYYY). */
function formatDateDisplay(dateKey) {
  return dateKey ? String(dateKey).replace(/-/g, '/') : '';
}

/**
 * Naplánovaná funkce: každý den v 16:00 (Praha) odešle připomínky na zítřek.
 * SMS přes BulkGate; e-mail primárně přes Resend, fallback přes EmailJS.
 */
export const sendDailyReminders = onSchedule(
  {
    schedule: '0 16 * * *',
    timeZone: 'Europe/Prague',
    region: 'europe-west1',
  },
  async () => {
    const tomorrowKey = getTomorrowDateKey();
    const snap = await db.collection('reservations').where('date', '==', tomorrowKey).get();
    const reservations = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((r) => !r.reminderSent);

    if (reservations.length === 0) {
      console.log('sendDailyReminders: žádné rezervace na zítřek k připomenutí.');
      return;
    }

    const appId = applicationId.value();
    const appToken = applicationToken.value();
    const sid = senderId.value();
    const sidVal = senderIdValue.value();
    const hasSms = Boolean(appId && appToken);

    const useResend = isResendConfigured();
    /** EmailJS fallback pouze z process.env (volitelné). */
    const emailServiceId = process.env.EMAILJS_SERVICE_ID || '';
    const emailTemplateId = process.env.EMAILJS_REMINDER_TEMPLATE_ID || '';
    const emailPublicKey = process.env.EMAILJS_PUBLIC_KEY || '';
    const useEmailJsFallback = !useResend && Boolean(emailServiceId && emailTemplateId && emailPublicKey);
    const hasEmailChannel = useResend || useEmailJsFallback;

    let smsSent = 0;
    let emailSent = 0;
    let sendReminderEmailInternal = null;
    if (useResend) {
      ({ sendReminderEmailInternal } = await loadResendMail());
    }

    for (const res of reservations) {
      const dateDisplay = formatDateDisplay(res.date);

      if (hasSms && res.phone) {
        const number = toE164(res.phone);
        if (number) {
          try {
            const text = buildReminderText(dateDisplay, res.time || '', res.serviceName || 'rezervace');
            const { ok } = await sendOneSms(appId, appToken, number, text, true, sid || undefined, sidVal || undefined);
            if (ok) {
              await db.doc(`reservations/${res.id}`).update({ reminderSent: true });
              smsSent++;
            }
          } catch (err) {
            console.error('sendDailyReminders SMS', res.id, err);
          }
        }
      }

      if (hasEmailChannel && res.email) {
        try {
          if (useResend) {
            const ok = await sendReminderEmailInternal({
              name: res.name,
              email: String(res.email).trim(),
              date: dateDisplay,
              time: res.time,
              serviceName: res.serviceName || 'rezervace',
              calendarIcsLink: buildCalendarIcsUrlForReservation(res),
            });
            if (ok) {
              await db.doc(`reservations/${res.id}`).update({ reminderSent: true });
              emailSent++;
            }
          } else {
            const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                service_id: emailServiceId,
                template_id: emailTemplateId,
                user_id: emailPublicKey,
                template_params: {
                  greeting_line: 'Dobrý den,',
                  name: res.name,
                  to_email: res.email,
                  date: dateDisplay,
                  time: res.time,
                  service: res.serviceName,
                  calendar_ics_link: buildCalendarIcsUrlForReservation(res),
                  reply_to: 'rezervace@skinstudio.cz',
                },
              }),
            });
            if (emailRes.ok) {
              await db.doc(`reservations/${res.id}`).update({ reminderSent: true });
              emailSent++;
            }
          }
        } catch (err) {
          console.error('sendDailyReminders email', res.id, err);
        }
      }
    }

    console.log(`sendDailyReminders: ${tomorrowKey} – odesláno ${smsSent} SMS, ${emailSent} e-mailů.`);
  }
);

export const updateVoucherOrder = onCall(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Nutné přihlášení.');
    const { orderId, contactPhone, contactEmail, targetPickupDate, packaging } = request.data || {};
    if (!orderId || typeof orderId !== 'string') throw new HttpsError('invalid-argument', 'Chybí orderId.');

    const ref = db.collection('voucher_orders').doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Objednávka nenalezena.');

    const updates = {};
    if (contactPhone !== undefined) updates.contact_phone = String(contactPhone).trim();
    if (contactEmail !== undefined) updates.contact_email = String(contactEmail).trim();
    if (targetPickupDate !== undefined) updates.target_pickup_date = String(targetPickupDate).trim();
    if (packaging !== undefined && ['envelope', 'box'].includes(packaging)) updates.packaging = packaging;

    if (Object.keys(updates).length === 0) throw new HttpsError('invalid-argument', 'Žádná pole ke změně.');

    await ref.update(updates);
    return { success: true };
  }
);

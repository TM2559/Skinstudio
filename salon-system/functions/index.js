import { onCall, HttpsError, onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import { defineString } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';

initializeApp();
const db = getFirestore();

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

/** Build reminder SMS text (Czech, short). */
function buildReminderText(name, dateDisplay, time, serviceName) {
  return `Skin Studio: Dobrý den ${name}, připomínáme zítřejší rezervaci ${dateDisplay} v ${time} - ${serviceName}. Těšíme se.`;
}

/** Send one SMS via BulkGate (shared). @param unicode - false for GSM 03.38 (160 chars). */
async function sendOneSms(appId, appToken, number, text, unicode = true, senderIdOpt, senderIdValueOpt) {
  const payload = {
    application_id: appId,
    application_token: appToken,
    number,
    text,
    unicode,
  };
  if (senderIdOpt && senderIdValueOpt) {
    payload.sender_id = senderIdOpt;
    payload.sender_id_value = senderIdValueOpt;
  }
  const response = await fetch(BULKGATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
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
      const text = buildReminderText(res.name || '', dateDisplay, res.time || '', res.serviceName || 'rezervace');

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
    const { password, credential } = request.data || {};
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
    const credentials = [
      {
        id: regCred.id,
        publicKey: publicKeyB64,
        counter: regCred.counter,
        transports: regCred.transports || [],
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      },
    ];
    await db.doc(ADMIN_WEBAUTHN_DOC).set({ credentials });
    return { verified: true };
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
    const { assertion } = request.data || {};
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
    const cred = creds.find((c) => c.id === assertion.id);
    if (!cred) throw new HttpsError('permission-denied', 'Neznámý přihlašovací klíč.');
    const publicKey = new Uint8Array(Buffer.from(cred.publicKey, 'base64'));
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
          counter: cred.counter,
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
    return { verified: true };
  }
);

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
 * SMS přes BulkGate (rezervace s telefonem), e-mail přes EmailJS (rezervace s e-mailem).
 * Vyžaduje: BULKGATE_* pro SMS; EMAILJS_* volitelně pro e-mail.
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

    /** EmailJS pouze z process.env (volitelné), aby deploy v non-interactive nevyžadoval tyto proměnné. */
    const emailServiceId = process.env.EMAILJS_SERVICE_ID || '';
    const emailTemplateId = process.env.EMAILJS_REMINDER_TEMPLATE_ID || '';
    const emailPublicKey = process.env.EMAILJS_PUBLIC_KEY || '';
    const hasEmail = Boolean(emailServiceId && emailTemplateId && emailPublicKey);

    let smsSent = 0;
    let emailSent = 0;

    for (const res of reservations) {
      const dateDisplay = formatDateDisplay(res.date);

      if (hasSms && res.phone) {
        const number = toE164(res.phone);
        if (number) {
          try {
            const text = buildReminderText(res.name || '', dateDisplay, res.time || '', res.serviceName || 'rezervace');
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

      if (hasEmail && res.email) {
        try {
          const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              service_id: emailServiceId,
              template_id: emailTemplateId,
              user_id: emailPublicKey,
              template_params: {
                name: res.name,
                to_email: res.email,
                date: dateDisplay,
                time: res.time,
                service: res.serviceName,
                reply_to: 'rezervace@skinstudio.cz',
              },
            }),
          });
          if (emailRes.ok) {
            await db.doc(`reservations/${res.id}`).update({ reminderSent: true });
            emailSent++;
          }
        } catch (err) {
          console.error('sendDailyReminders email', res.id, err);
        }
      }
    }

    console.log(`sendDailyReminders: ${tomorrowKey} – odesláno ${smsSent} SMS, ${emailSent} e-mailů.`);
  }
);

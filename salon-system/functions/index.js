import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { defineString } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';

initializeApp();
const db = getFirestore();

const applicationId = defineString('BULKGATE_APPLICATION_ID', { default: '' });
const applicationToken = defineString('BULKGATE_APPLICATION_TOKEN', { default: '' });

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
function buildConfirmationSmsMessage(serviceName, date, time) {
  const service = (serviceName || 'rezervace').trim();
  const d = formatDateForSmsCzech(date);
  const t = formatTimeForSms(time);
  return `Skin Studio: Potvrzujeme vaši rezervaci.\n\nSLUŽBA: ${service}\nTERMÍN: ${d} v ${t}\n\nTěšíme se na vás.`;
}

/** Build reminder SMS text (Czech, short). */
function buildReminderText(name, dateDisplay, time, serviceName) {
  return `Skin Studio: Dobrý den ${name}, připomínáme zítřejší rezervaci ${dateDisplay} v ${time} - ${serviceName}. Těšíme se.`;
}

/** Send one SMS via BulkGate (shared). @param unicode - false for GSM 03.38 (160 chars). */
async function sendOneSms(appId, appToken, number, text, unicode = true) {
  const response = await fetch(BULKGATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      application_id: appId,
      application_token: appToken,
      number,
      text,
      unicode,
    }),
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

      try {
        const { ok, data } = await sendOneSms(appId, appToken, number, text);
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
 * Body: { phone, name, date, time, serviceName } – po vytvoření rezervace, jedna SMS na číslo klienta.
 */
export const sendConfirmationSms = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const appId = applicationId.value();
    const appToken = applicationToken.value();
    if (!appId || !appToken) {
      throw new HttpsError('failed-precondition', 'BulkGate není nakonfigurován (BULKGATE_APPLICATION_ID / BULKGATE_APPLICATION_TOKEN).');
    }

    const { phone, date, time, serviceName } = request.data || {};
    const number = toE164(phone);
    if (!number) {
      throw new HttpsError('invalid-argument', 'Neplatné nebo chybějící telefonní číslo.');
    }

    const text = buildConfirmationSmsMessage(serviceName, date, time);

    const { ok, data } = await sendOneSms(appId, appToken, number, text, true);
    if (!ok) {
      console.warn('BulkGate sendConfirmationSms:', data);
      throw new HttpsError('internal', data.error || data.message || 'BulkGate API chyba.');
    }

    return { sent: true, message: 'SMS potvrzení odeslána.' };
  }
);

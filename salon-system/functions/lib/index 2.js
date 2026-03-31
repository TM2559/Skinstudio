import {
  isResendConfigured
} from "./chunk-CAD7T5TA.js";

// src/index.js
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";
import { defineString } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// src/calendarIcs.js
import { randomUUID } from "node:crypto";
var COMPACT_UTC_RE = /^\d{8}T\d{6}Z$/;
function escapeIcsText(text) {
  if (text == null) return "";
  return String(text).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}
function buildIcsBody({ start, end, summary, description, location }) {
  const uid = `${randomUUID()}@skinstudio.cz`;
  const dtstamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Skin Studio//Rezervace//CS",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(summary)}`
  ];
  if (description) {
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
  }
  lines.push(`LOCATION:${escapeIcsText(location || "Skin Studio")}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}
function firstString(q, key) {
  const v = q[key];
  if (v == null) return "";
  return Array.isArray(v) ? String(v[0] ?? "") : String(v);
}
function icsFromQuery(query) {
  const start = firstString(query, "start");
  const end = firstString(query, "end");
  const sum = firstString(query, "sum");
  if (!start || !end || !sum.trim()) {
    return { error: "Chyb\xED start, end nebo sum." };
  }
  if (!COMPACT_UTC_RE.test(start) || !COMPACT_UTC_RE.test(end)) {
    return { error: "Neplatn\xFD form\xE1t start/end (o\u010Dek\xE1v\xE1 se YYYYMMDDTHHmmssZ)." };
  }
  const desc = firstString(query, "desc");
  const loc = firstString(query, "loc");
  return {
    body: buildIcsBody({
      start,
      end,
      summary: sum.slice(0, 500),
      description: desc.slice(0, 4e3),
      location: loc.slice(0, 500) || "Masarykovo n\xE1m. 72, Uhersk\xFD Brod"
    })
  };
}

// src/index.js
function loadResendMail() {
  return import("./resendMail-WCKHW2GS.js");
}
initializeApp();
var db = getFirestore();
var adminPasswordParam = defineString("ADMIN_PASSWORD", { default: "" });
var applicationId = defineString("BULKGATE_APPLICATION_ID", { default: "" });
var applicationToken = defineString("BULKGATE_APPLICATION_TOKEN", { default: "" });
var senderId = defineString("BULKGATE_SENDER_ID", { default: "" });
var senderIdValue = defineString("BULKGATE_SENDER_ID_VALUE", { default: "" });
var geminiApiKey = defineString("GEMINI_API_KEY", { default: "" });
var BULKGATE_URL = "https://portal.bulkgate.com/api/1.0/simple/transactional";
function toE164(phone) {
  if (!phone || typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 9 && /^[67]/.test(digits)) return `420${digits}`;
  if (digits.length === 12 && digits.startsWith("420")) return digits;
  if (digits.length >= 9) return `420${digits.slice(-9)}`;
  return null;
}
function formatDateForSmsCzech(date) {
  if (!date) return "";
  const s = String(date).trim();
  const parts = s.includes("-") ? s.split("-") : [];
  if (parts.length === 3) {
    const [a, b, c] = parts;
    const day = a.length === 4 ? c : a;
    const month = a.length === 4 ? b : b;
    const dayNum = parseInt(day, 10) || 0;
    const monthNum = parseInt(month, 10) || 0;
    const nbsp = "\xA0";
    return `${dayNum}.${nbsp}${monthNum}.`;
  }
  return "";
}
function formatTimeForSms(time) {
  if (!time) return "";
  const t = String(time).trim();
  const match = t.match(/^(\d{1,2}):(\d{1,2})/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2].padStart(2, "0")}`;
  return t;
}
function buildConfirmationSmsMessage(serviceName, date, time, duration) {
  const service = (serviceName || "rezervace").trim();
  const d = formatDateForSmsCzech(date);
  const t = formatTimeForSms(time);
  const dur = duration ? ` (${duration} min)` : "";
  return `Skin Studio: V\xE1\u0161 term\xEDn je potvrzen
Slu\u017Eba: ${service}${dur}
Kdy: ${d} v ${t}
Kde: Masarykovo n\xE1m. 72, Uhersk\xFD Brod

T\u011B\u0161\xEDm se na v\xE1s, Lucie.`;
}
function buildReminderText(name, dateDisplay, time, serviceName) {
  return `Skin Studio: Dobr\xFD den ${name}, p\u0159ipom\xEDn\xE1me z\xEDt\u0159ej\u0161\xED rezervaci ${dateDisplay} v ${time} - ${serviceName}. T\u011B\u0161\xEDme se.`;
}
async function sendOneSms(appId, appToken, number, text, unicode = true, senderIdOpt, senderIdValueOpt) {
  const payload = {
    application_id: appId,
    application_token: appToken,
    number,
    text,
    unicode
  };
  if (senderIdOpt && senderIdValueOpt) {
    payload.sender_id = senderIdOpt;
    payload.sender_id_value = senderIdValueOpt;
  }
  const response = await fetch(BULKGATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
}
var sendReminderSms = onCall(
  { region: "europe-west1" },
  async (request) => {
    const appId = applicationId.value();
    const appToken = applicationToken.value();
    if (!appId || !appToken) {
      console.error("sendReminderSms: BULKGATE_APPLICATION_ID nebo BULKGATE_APPLICATION_TOKEN chyb\xED.");
      throw new HttpsError("failed-precondition", "BulkGate nen\xED nakonfigurov\xE1n (BULKGATE_APPLICATION_ID / BULKGATE_APPLICATION_TOKEN). Nastav je v functions/.env a znovu nasa\u010F funkci.");
    }
    const { reservations, firestoreReservationsPrefix } = request.data || {};
    if (!Array.isArray(reservations) || reservations.length === 0) {
      return { sent: 0, errors: [], message: "\u017D\xE1dn\xE9 rezervace k odesl\xE1n\xED." };
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
        errors.push({ id: res.id, reason: "Neplatn\xE9 nebo chyb\u011Bj\xEDc\xED telefonn\xED \u010D\xEDslo" });
        continue;
      }
      const dateDisplay = res.date ? res.date.replace(/-/g, "/") : "";
      const text = buildReminderText(res.name || "", dateDisplay, res.time || "", res.serviceName || "rezervace");
      const sid = senderId.value();
      const sidVal = senderIdValue.value();
      try {
        const { ok, data } = await sendOneSms(appId, appToken, number, text, true, sid || void 0, sidVal || void 0);
        if (!ok) {
          const reason = data.error || data.message || "BulkGate API chyba";
          console.warn("BulkGate API chyba:", reason, data);
          errors.push({ id: res.id, reason });
          continue;
        }
        const docPath = reservationDocPath(res.id);
        await db.doc(docPath).update({ reminderSent: true });
        sent++;
      } catch (err) {
        console.error("sendReminderSms polo\u017Eka:", res.id, err);
        errors.push({ id: res.id, reason: err.message || "Chyba odesl\xE1n\xED" });
      }
    }
    return { sent, errors, message: `Odesl\xE1no ${sent} SMS.` };
  }
);
var sendConfirmationSms = onCall(
  { region: "europe-west1" },
  async (request) => {
    const appId = applicationId.value();
    const appToken = applicationToken.value();
    if (!appId || !appToken) {
      throw new HttpsError("failed-precondition", "BulkGate nen\xED nakonfigurov\xE1n (BULKGATE_APPLICATION_ID / BULKGATE_APPLICATION_TOKEN).");
    }
    const { phone, date, time, serviceName, duration } = request.data || {};
    const number = toE164(phone);
    if (!number) {
      throw new HttpsError("invalid-argument", "Neplatn\xE9 nebo chyb\u011Bj\xEDc\xED telefonn\xED \u010D\xEDslo.");
    }
    const text = buildConfirmationSmsMessage(serviceName, date, time, duration);
    const sid = senderId.value();
    const sidVal = senderIdValue.value();
    const { ok, data } = await sendOneSms(appId, appToken, number, text, true, sid || void 0, sidVal || void 0);
    if (!ok) {
      console.warn("BulkGate sendConfirmationSms:", data);
      throw new HttpsError("internal", data.error || data.message || "BulkGate API chyba.");
    }
    return { sent: true, message: "SMS potvrzen\xED odesl\xE1na." };
  }
);
var sendBookingEmails = onCall({ region: "europe-west1" }, async (request) => {
  if (!isResendConfigured()) {
    throw new HttpsError(
      "failed-precondition",
      "Resend nen\xED nakonfigurov\xE1n (RESEND_API_KEY, RESEND_FROM). Nastav v prost\u0159ed\xED functions a znovu nasa\u010F."
    );
  }
  const { name, email, phone, date, time, serviceName, calendarLink, calendarIcsLink } = request.data || {};
  if (!email || typeof email !== "string" || !email.trim()) {
    throw new HttpsError("invalid-argument", "E-mail je povinn\xFD.");
  }
  if (!date || !time || !serviceName) {
    throw new HttpsError("invalid-argument", "Chyb\xED datum, \u010Das nebo slu\u017Eba.");
  }
  const { sendBookingEmailsInternal } = await loadResendMail();
  const result = await sendBookingEmailsInternal({
    name: typeof name === "string" ? name : "",
    email: email.trim(),
    phone: typeof phone === "string" ? phone : "",
    date,
    time,
    serviceName,
    calendarLink: typeof calendarLink === "string" ? calendarLink : "",
    calendarIcsLink: typeof calendarIcsLink === "string" ? calendarIcsLink : ""
  });
  const { clientOk, adminOk, clientError, adminError } = result;
  return {
    clientOk,
    adminOk,
    ...clientError ? { clientError } : {},
    ...adminError ? { adminError } : {}
  };
});
var sendReminderEmails = onCall({ region: "europe-west1" }, async (request) => {
  if (!isResendConfigured()) {
    throw new HttpsError(
      "failed-precondition",
      "Resend nen\xED nakonfigurov\xE1n (RESEND_API_KEY, RESEND_FROM)."
    );
  }
  const { reservations } = request.data || {};
  if (!Array.isArray(reservations) || reservations.length === 0) {
    return { sent: 0, errors: [], message: "\u017D\xE1dn\xE9 e-maily k odesl\xE1n\xED." };
  }
  let sent = 0;
  const errors = [];
  const { sendReminderEmailInternal } = await loadResendMail();
  for (const r of reservations) {
    const addr = r.email && typeof r.email === "string" ? r.email.trim() : "";
    if (!addr) {
      errors.push({ id: r.id, reason: "Chyb\u011Bj\xEDc\xED e-mail" });
      continue;
    }
    try {
      const dateDisplay = typeof r.date === "string" ? r.date.replace(/-/g, "/") : String(r.date || "").replace(/-/g, "/");
      const ok = await sendReminderEmailInternal({
        name: r.name,
        email: addr,
        date: dateDisplay,
        time: r.time,
        serviceName: r.serviceName || "rezervace",
        calendarIcsLink: typeof r.calendarIcsLink === "string" ? r.calendarIcsLink : ""
      });
      if (ok) sent++;
      else errors.push({ id: r.id, reason: "Resend odm\xEDtl odesl\xE1n\xED" });
    } catch (err) {
      console.error("sendReminderEmails polo\u017Eka:", r.id, err);
      errors.push({ id: r.id, reason: err.message || "Chyba odesl\xE1n\xED" });
    }
  }
  return { sent, errors, message: `Odesl\xE1no ${sent} e-mail\u016F.` };
});
var calendarIcs = onRequest({ region: "europe-west1" }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "GET") {
    res.status(405).set("Allow", "GET, OPTIONS").send("Method Not Allowed");
    return;
  }
  const result = icsFromQuery(req.query || {});
  if (result.error) {
    res.status(400).set("Content-Type", "text/plain; charset=utf-8").send(result.error);
    return;
  }
  res.set("Content-Type", "text/calendar; charset=utf-8");
  res.set("Content-Disposition", 'attachment; filename="skin-studio-rezervace.ics"');
  res.set("Cache-Control", "private, max-age=300");
  res.send(result.body);
});
var FORMAT_SYSTEM_PROMPT = `You are a luxury copywriter for Skin Studio. Your tone is 'Quiet Luxury'\u2014minimalist, professional, and empathetic.
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${FORMAT_SYSTEM_PROMPT}

User raw notes:
${rawText}` }] }],
        generationConfig: { temperature: 0.5 }
      })
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text == null) throw new Error("No text in Gemini response");
  return text.trim();
}
var formatContent = onRequest(
  { region: "europe-west1", timeoutSeconds: 60 },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    const send = (status, data) => {
      try {
        res.status(status).json(data);
      } catch (e) {
        console.error("formatContent send error", e);
      }
    };
    try {
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }
      if (req.method !== "POST") {
        send(405, { error: "Method not allowed" });
        return;
      }
      const body = req.body || {};
      const rawText = body.rawText;
      if (typeof rawText !== "string") {
        send(400, { error: "Missing or invalid rawText" });
        return;
      }
      const trimmed = rawText.trim();
      if (!trimmed) {
        send(400, { error: "rawText is empty" });
        return;
      }
      let key = "";
      try {
        key = geminiApiKey.value() || process.env.GEMINI_API_KEY || "";
      } catch (_) {
        key = process.env.GEMINI_API_KEY || "";
      }
      if (!key) {
        send(503, { error: "No LLM configured. Set GEMINI_API_KEY in env or params." });
        return;
      }
      const formattedMarkdown = await formatWithGemini(trimmed, key);
      send(200, { formattedMarkdown });
    } catch (err) {
      console.error("formatContent error", err);
      send(500, { error: err.message || "Formatting failed" });
    }
  }
);
var verifyAdminPassword = onCall(
  { region: "europe-west1" },
  async (request) => {
    const adminPw = adminPasswordParam.value();
    if (!adminPw) throw new HttpsError("failed-precondition", "ADMIN_PASSWORD nen\xED nastaven v prost\u0159ed\xED functions.");
    const { password } = request.data || {};
    if (!password || typeof password !== "string") {
      throw new HttpsError("invalid-argument", "Heslo je povinn\xE9.");
    }
    if (password !== adminPw) {
      throw new HttpsError("permission-denied", "Chybn\xE9 heslo.");
    }
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError(
        "failed-precondition",
        "Chyb\xED p\u0159ihl\xE1\u0161en\xED (anonymn\xED \xFA\u010Det). Na\u010Dt\u011Bte str\xE1nku znovu, chvilku po\u010Dkejte a zkuste heslo znovu."
      );
    }
    await getAuth().setCustomUserClaims(uid, { admin: true });
    return { verified: true };
  }
);
var ADMIN_WEBAUTHN_DOC = "config/admin_webauthn";
var ADMIN_WEBAUTHN_CHALLENGE_DOC = "config/admin_webauthn_challenge";
var CHALLENGE_TTL_MS = 5 * 60 * 1e3;
function getAllowedOrigins() {
  return [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1",
    "http://127.0.0.1:5173",
    "https://localhost",
    "https://tm-reservations.web.app",
    "https://tm-reservations.firebaseapp.com",
    "http://skinstudio.cz",
    "https://skinstudio.cz",
    "http://www.skinstudio.cz",
    "https://www.skinstudio.cz"
  ];
}
function getExtraOriginHosts() {
  try {
    const raw = process.env.WEBAPP_ORIGIN_HOSTS || "";
    return raw.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}
function isOriginAllowed(origin) {
  if (!origin || typeof origin !== "string") return false;
  const o = origin.replace(/\/$/, "").trim();
  if (!o) return false;
  if (getAllowedOrigins().includes(o)) return true;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".web.app") || host.endsWith(".firebaseapp.com")) {
      return true;
    }
    if (getExtraOriginHosts().includes(host)) return true;
    return false;
  } catch {
    return false;
  }
}
function getOriginFromRequest(request) {
  const fromData = request.data?.origin;
  if (fromData && typeof fromData === "string" && fromData.trim()) return fromData.trim();
  const raw = request.rawRequest;
  const h = raw?.headers;
  const originVal = (h && (typeof h.get === "function" ? h.get("origin") : h.origin)) ?? null;
  if (typeof originVal === "string" && originVal.trim()) return originVal.trim();
  const referer = (h && (typeof h.get === "function" ? h.get("referer") : h.referer)) ?? null;
  if (typeof referer === "string" && referer.trim()) {
    try {
      const u = new URL(referer);
      return `${u.protocol}//${u.host}`;
    } catch (_) {
    }
  }
  return null;
}
function getRpIdFromOrigin(origin) {
  try {
    return new URL(origin).hostname;
  } catch {
    return "localhost";
  }
}
var getAdminWebAuthnRegistrationOptions = onCall(
  { region: "europe-west1" },
  async (request) => {
    const { generateRegistrationOptions } = await import("@simplewebauthn/server");
    const adminPw = adminPasswordParam.value();
    if (!adminPw) throw new HttpsError("failed-precondition", "ADMIN_PASSWORD nen\xED nastaven v prost\u0159ed\xED functions.");
    const { password } = request.data || {};
    const origin = getOriginFromRequest(request);
    if (password !== adminPw) throw new HttpsError("permission-denied", "Chybn\xE9 heslo.");
    if (!origin || !isOriginAllowed(origin)) {
      throw new HttpsError("invalid-argument", `Neplatn\xFD origin. Obdr\u017Eeno: ${origin ?? "(pr\xE1zdn\xE9)"}`);
    }
    const rpID = getRpIdFromOrigin(origin);
    const rpName = "Skin Studio Admin";
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: "admin",
      userDisplayName: "Admin",
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
        authenticatorAttachment: "platform"
      },
      supportedAlgorithmIDs: [-7, -257]
    });
    await db.doc(ADMIN_WEBAUTHN_CHALLENGE_DOC).set({
      challenge: options.challenge,
      createdAt: Date.now(),
      type: "registration"
    });
    return options;
  }
);
var verifyAdminWebAuthnRegistration = onCall(
  { region: "europe-west1" },
  async (request) => {
    const { verifyRegistrationResponse } = await import("@simplewebauthn/server");
    const adminPw = adminPasswordParam.value();
    if (!adminPw) throw new HttpsError("failed-precondition", "ADMIN_PASSWORD nen\xED nastaven.");
    const { password, credential } = request.data || {};
    const origin = getOriginFromRequest(request);
    if (password !== adminPw) throw new HttpsError("permission-denied", "Chybn\xE9 heslo.");
    if (!origin || !isOriginAllowed(origin)) {
      throw new HttpsError("invalid-argument", `Neplatn\xFD origin. Obdr\u017Eeno: ${origin ?? "(pr\xE1zdn\xE9)"}`);
    }
    const rpID = getRpIdFromOrigin(origin);
    const snap = await db.doc(ADMIN_WEBAUTHN_CHALLENGE_DOC).get();
    const data = snap.data();
    if (!data || data.type !== "registration" || Date.now() - (data.createdAt || 0) > CHALLENGE_TTL_MS) {
      throw new HttpsError("failed-precondition", "Vypr\u0161ela platnost registrace. Zkuste znovu.");
    }
    const expectedChallenge = data.challenge;
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID
      });
    } catch (err) {
      console.error("verifyAdminWebAuthnRegistration", err);
      throw new HttpsError("invalid-argument", err.message || "Ov\u011B\u0159en\xED registrace selhalo.");
    }
    await db.doc(ADMIN_WEBAUTHN_CHALLENGE_DOC).delete();
    if (!verification.verified || !verification.registrationInfo) {
      throw new HttpsError("invalid-argument", "Registrace nebyla ov\u011B\u0159ena.");
    }
    const { credential: regCred, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    const publicKeyB64 = Buffer.from(regCred.publicKey).toString("base64");
    const newCred = {
      id: regCred.id,
      publicKey: publicKeyB64,
      counter: regCred.counter,
      transports: regCred.transports || [],
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp
    };
    const docRef = db.doc(ADMIN_WEBAUTHN_DOC);
    const existingSnap = await docRef.get();
    const existingData = existingSnap.data();
    const existingCreds = existingData && existingData.credentials || [];
    const alreadyExists = existingCreds.some((c) => c.id === regCred.id);
    if (alreadyExists) {
      throw new HttpsError("invalid-argument", "Toto za\u0159\xEDzen\xED u\u017E je zaregistrovan\xE9.");
    }
    const credentials = [...existingCreds, newCred];
    await docRef.set({ credentials });
    return { verified: true };
  }
);
var getAdminWebAuthnLoginOptions = onCall(
  { region: "europe-west1" },
  async (request) => {
    const { generateAuthenticationOptions } = await import("@simplewebauthn/server");
    const origin = getOriginFromRequest(request);
    if (!origin || !isOriginAllowed(origin)) {
      throw new HttpsError("invalid-argument", `Neplatn\xFD origin. Obdr\u017Eeno: ${origin ?? "(pr\xE1zdn\xE9)"}`);
    }
    const rpID = getRpIdFromOrigin(origin);
    const docSnap = await db.doc(ADMIN_WEBAUTHN_DOC).get();
    const data = docSnap.data();
    const creds = data && data.credentials || [];
    if (creds.length === 0) throw new HttpsError("failed-precondition", "Face ID nen\xED nastaven. Nejprve se p\u0159ihlaste heslem a nastavte Face ID.");
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: creds.map((c) => ({ id: c.id, type: "public-key", transports: c.transports })),
      userVerification: "required"
    });
    await db.doc(ADMIN_WEBAUTHN_CHALLENGE_DOC).set({
      challenge: options.challenge,
      createdAt: Date.now(),
      type: "authentication"
    });
    return options;
  }
);
var verifyAdminWebAuthnLogin = onCall(
  { region: "europe-west1" },
  async (request) => {
    const { verifyAuthenticationResponse } = await import("@simplewebauthn/server");
    const { assertion } = request.data || {};
    const origin = getOriginFromRequest(request);
    if (!origin || !isOriginAllowed(origin)) {
      throw new HttpsError("invalid-argument", `Neplatn\xFD origin. Obdr\u017Eeno: ${origin ?? "(pr\xE1zdn\xE9)"}`);
    }
    const rpID = getRpIdFromOrigin(origin);
    const docSnap = await db.doc(ADMIN_WEBAUTHN_DOC).get();
    const creds = docSnap.data() && docSnap.data().credentials || [];
    const challengeSnap = await db.doc(ADMIN_WEBAUTHN_CHALLENGE_DOC).get();
    const challengeData = challengeSnap.data();
    if (!challengeData || challengeData.type !== "authentication" || Date.now() - (challengeData.createdAt || 0) > CHALLENGE_TTL_MS) {
      throw new HttpsError("failed-precondition", "Vypr\u0161ela platnost p\u0159ihl\xE1\u0161en\xED. Zkuste znovu.");
    }
    const cred = creds.find((c) => c.id === assertion.id);
    if (!cred) throw new HttpsError("permission-denied", "Nezn\xE1m\xFD p\u0159ihla\u0161ovac\xED kl\xED\u010D.");
    const publicKey = new Uint8Array(Buffer.from(cred.publicKey, "base64"));
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
          transports: cred.transports
        }
      });
    } catch (err) {
      console.error("verifyAdminWebAuthnLogin", err);
      throw new HttpsError("invalid-argument", err.message || "Ov\u011B\u0159en\xED p\u0159ihl\xE1\u0161en\xED selhalo.");
    }
    await db.doc(ADMIN_WEBAUTHN_CHALLENGE_DOC).delete();
    if (!verification.verified) throw new HttpsError("permission-denied", "P\u0159ihl\xE1\u0161en\xED nebylo ov\u011B\u0159eno.");
    const { newCounter } = verification.authenticationInfo || {};
    if (typeof newCounter === "number") {
      const updated = creds.map((c) => c.id === cred.id ? { ...c, counter: newCounter } : c);
      await db.doc(ADMIN_WEBAUTHN_DOC).update({ credentials: updated });
    }
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError(
        "failed-precondition",
        "Chyb\xED p\u0159ihl\xE1\u0161en\xED pro ud\u011Blen\xED opr\xE1vn\u011Bn\xED. Obnovte str\xE1nku a zkuste Face ID znovu."
      );
    }
    await getAuth().setCustomUserClaims(uid, { admin: true });
    return { verified: true };
  }
);
var createVoucherOrder = onCall(
  { region: "europe-west1" },
  async () => {
    throw new HttpsError("unimplemented", "Funkce d\xE1rkov\xFDch poukaz\u016F je do\u010Dasn\u011B nedostupn\xE1.");
  }
);
var updateVoucherOrderStatus = onCall(
  { region: "europe-west1" },
  async () => {
    throw new HttpsError("unimplemented", "Funkce d\xE1rkov\xFDch poukaz\u016F je do\u010Dasn\u011B nedostupn\xE1.");
  }
);
function getTomorrowDateKey() {
  const t = /* @__PURE__ */ new Date();
  t.setDate(t.getDate() + 1);
  const d = t.getDate();
  const m = t.getMonth() + 1;
  const y = t.getFullYear();
  return `${String(d).padStart(2, "0")}-${String(m).padStart(2, "0")}-${y}`;
}
function formatDateDisplay(dateKey) {
  return dateKey ? String(dateKey).replace(/-/g, "/") : "";
}
function hasEmailJsReminderEnv() {
  const sid = process.env.EMAILJS_SERVICE_ID || "";
  const tid = process.env.EMAILJS_REMINDER_TEMPLATE_ID || "";
  const pk = process.env.EMAILJS_PUBLIC_KEY || "";
  return Boolean(sid && tid && pk);
}
var sendDailyReminders = onSchedule(
  {
    schedule: "0 16 * * *",
    timeZone: "Europe/Prague",
    region: "europe-west1"
  },
  async () => {
    const tomorrowKey = getTomorrowDateKey();
    const snap = await db.collection("reservations").where("date", "==", tomorrowKey).get();
    const reservations = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => !r.reminderSent);
    if (reservations.length === 0) {
      console.log("sendDailyReminders: \u017E\xE1dn\xE9 rezervace na z\xEDt\u0159ek k p\u0159ipomenut\xED.");
      return;
    }
    const appId = applicationId.value();
    const appToken = applicationToken.value();
    const sid = senderId.value();
    const sidVal = senderIdValue.value();
    const hasSms = Boolean(appId && appToken);
    const useResend = isResendConfigured();
    const useEmailJs = !useResend && hasEmailJsReminderEnv();
    const hasEmailChannel = useResend || useEmailJs;
    const emailServiceId = process.env.EMAILJS_SERVICE_ID || "";
    const emailTemplateId = process.env.EMAILJS_REMINDER_TEMPLATE_ID || "";
    const emailPublicKey = process.env.EMAILJS_PUBLIC_KEY || "";
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
            const text = buildReminderText(res.name || "", dateDisplay, res.time || "", res.serviceName || "rezervace");
            const { ok } = await sendOneSms(appId, appToken, number, text, true, sid || void 0, sidVal || void 0);
            if (ok) {
              await db.doc(`reservations/${res.id}`).update({ reminderSent: true });
              smsSent++;
            }
          } catch (err) {
            console.error("sendDailyReminders SMS", res.id, err);
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
              serviceName: res.serviceName || "rezervace"
            });
            if (ok) {
              await db.doc(`reservations/${res.id}`).update({ reminderSent: true });
              emailSent++;
            }
          } else {
            const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
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
                  reply_to: "rezervace@skinstudio.cz"
                }
              })
            });
            if (emailRes.ok) {
              await db.doc(`reservations/${res.id}`).update({ reminderSent: true });
              emailSent++;
            }
          }
        } catch (err) {
          console.error("sendDailyReminders email", res.id, err);
        }
      }
    }
    console.log(`sendDailyReminders: ${tomorrowKey} \u2013 odesl\xE1no ${smsSent} SMS, ${emailSent} e-mail\u016F.`);
  }
);
export {
  calendarIcs,
  createVoucherOrder,
  formatContent,
  getAdminWebAuthnLoginOptions,
  getAdminWebAuthnRegistrationOptions,
  sendBookingEmails,
  sendConfirmationSms,
  sendDailyReminders,
  sendReminderEmails,
  sendReminderSms,
  updateVoucherOrderStatus,
  verifyAdminPassword,
  verifyAdminWebAuthnLogin,
  verifyAdminWebAuthnRegistration
};

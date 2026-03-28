import { defineString } from 'firebase-functions/params';

const resendApiKeyParam = defineString('RESEND_API_KEY', { default: '' });
const resendFromParam = defineString('RESEND_FROM', { default: '' });
const resendReplyToParam = defineString('RESEND_REPLY_TO', { default: '' });
const resendAdminToParam = defineString('RESEND_ADMIN_TO', { default: '' });

/** Bez importu `resend` – ten zůstává jen v resendMail (lazy chunk), aby start emulátoru nevisel. */
export function getResendApiKey() {
  try {
    return resendApiKeyParam.value() || process.env.RESEND_API_KEY || '';
  } catch {
    return process.env.RESEND_API_KEY || '';
  }
}

export function getFrom() {
  try {
    return resendFromParam.value() || process.env.RESEND_FROM || '';
  } catch {
    return process.env.RESEND_FROM || '';
  }
}

export function getReplyTo() {
  try {
    return resendReplyToParam.value() || process.env.RESEND_REPLY_TO || '';
  } catch {
    return process.env.RESEND_REPLY_TO || '';
  }
}

export function getAdminTo() {
  try {
    return resendAdminToParam.value() || process.env.RESEND_ADMIN_TO || '';
  } catch {
    return process.env.RESEND_ADMIN_TO || '';
  }
}

export function isResendConfigured() {
  return Boolean(getResendApiKey() && getFrom());
}

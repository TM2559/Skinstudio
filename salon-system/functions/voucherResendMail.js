import { Resend } from 'resend';
import { buildAdminVoucherOrderHtml, buildVoucherConfirmationHtml } from './voucherEmailHtml.js';

function getResendApiKey() {
  return process.env.RESEND_API_KEY || '';
}

function getFrom() {
  return process.env.RESEND_FROM || '';
}

function getReplyTo() {
  return process.env.RESEND_REPLY_TO || '';
}

function getAdminTo() {
  return process.env.RESEND_ADMIN_TO || '';
}

function getResendClient() {
  const key = getResendApiKey();
  if (!key) return null;
  return new Resend(key);
}

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

export function isVoucherResendConfigured() {
  return Boolean(getResendApiKey() && getFrom());
}

/**
 * Odešle potvrzení zákazníkovi a souhrn adminovi (stejné env jako rezervační e-maily).
 */
export async function sendVoucherOrderEmailsInternal({
  orderId,
  voucherLabel,
  packaging,
  targetPickupDate,
  contactEmail,
  contactPhone,
  totalPriceKc,
}) {
  const from = getFrom();
  const replyTo = getReplyTo();
  const adminTo = getAdminTo();
  const resend = getResendClient();

  if (!getResendApiKey()) {
    return {
      clientOk: false,
      adminOk: false,
      clientError: 'Chybí RESEND_API_KEY (functions / Firebase secrets).',
    };
  }
  if (!from) {
    return {
      clientOk: false,
      adminOk: false,
      clientError: 'Chybí RESEND_FROM (ověřený odesílatel v Resend).',
    };
  }
  if (!resend) {
    return { clientOk: false, adminOk: false, clientError: 'Nelze vytvořit Resend klienta.' };
  }
  if (!contactEmail || typeof contactEmail !== 'string') {
    return { clientOk: false, adminOk: false, clientError: 'Chybí e-mail zákazníka.' };
  }

  const clientHtml = buildVoucherConfirmationHtml({
    voucherLabel,
    packaging,
    targetPickupDate,
    totalPriceKc,
  });

  const clientResult = await resend.emails.send({
    from,
    to: [contactEmail.trim()],
    replyTo: replyTo || undefined,
    subject: `Potvrzení objednávky poukazu — ${voucherLabel || 'Skin Studio'}`,
    html: clientHtml,
  });

  let clientError = '';
  if (clientResult.error) {
    clientError = resendErrText(clientResult.error);
    console.error('Resend voucher → klient:', clientResult.error);
  }
  const clientOk = !clientResult.error;

  let adminOk = true;
  let adminError = '';
  if (adminTo) {
    const adminHtml = buildAdminVoucherOrderHtml({
      orderId,
      voucherLabel,
      packaging,
      targetPickupDate,
      contactEmail,
      contactPhone,
      totalPriceKc,
    });
    const adminResult = await resend.emails.send({
      from,
      to: [adminTo],
      replyTo: contactEmail.trim() || replyTo || undefined,
      subject: `Nová objednávka poukazu — ${voucherLabel || orderId || 'web'}`,
      html: adminHtml,
    });
    if (adminResult.error) {
      adminError = resendErrText(adminResult.error);
      console.error('Resend voucher → admin:', adminResult.error);
    }
    adminOk = !adminResult.error;
  }

  const out = { clientOk, adminOk };
  if (clientError) out.clientError = clientError;
  if (adminError) out.adminError = adminError;
  return out;
}

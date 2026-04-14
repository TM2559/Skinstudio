/**
 * Odešle dva náhledové e-maily (zákazník + admin) na zadanou adresu.
 * Použití z kořene functions/: node --env-file=.env scripts/previewVoucherEmails.mjs
 */
import { Resend } from 'resend';
import {
  buildAdminVoucherOrderHtml,
  buildVoucherConfirmationHtml,
} from '../voucherEmailHtml.js';

const PREVIEW_TO = 'tomas@2559.cz';

const sample = {
  orderId: 'preview-7f3a9c',
  voucherLabel: 'Kosmetická péče — balíček Relax',
  packaging: 'box',
  targetPickupDate: '2026-03-31',
  contactEmail: 'zakaznik@example.cz',
  contactPhone: '+420 724 000 000',
  totalPriceKc: 3100,
};

const key = process.env.RESEND_API_KEY || '';
const from = process.env.RESEND_FROM || '';

if (!key || !from) {
  console.error('Chybí RESEND_API_KEY nebo RESEND_FROM v prostředí (např. .env ve functions/).');
  process.exit(1);
}

const resend = new Resend(key);

const r1 = await resend.emails.send({
  from,
  to: [PREVIEW_TO],
  subject: `[Náhled] Potvrzení objednávky poukazu — ${sample.voucherLabel}`,
  html: buildVoucherConfirmationHtml(sample),
});

if (r1.error) {
  console.error('Klient náhled:', r1.error);
  process.exit(1);
}

const r2 = await resend.emails.send({
  from,
  to: [PREVIEW_TO],
  subject: `[Náhled] Nová objednávka poukazu — ${sample.voucherLabel}`,
  html: buildAdminVoucherOrderHtml(sample),
});

if (r2.error) {
  console.error('Admin náhled:', r2.error);
  process.exit(1);
}

console.log(`Odeslány 2 náhledové e-maily na ${PREVIEW_TO}.`);

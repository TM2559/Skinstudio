import { Resend } from 'resend';
import { buildAdminVoucherOrderHtml, buildVoucherConfirmationHtml } from '../voucherEmailHtml.js';

const to = 'metelkova@2559.cz';
const key = process.env.RESEND_API_KEY || '';
const from = process.env.RESEND_FROM || '';

if (!key || !from) {
  throw new Error('Missing RESEND_API_KEY or RESEND_FROM');
}

const resend = new Resend(key);
const accent = '#d4a5a5';

function row(label, value) {
  return `<p style="margin:0 0 10px"><span style="display:inline-block;width:150px;font-size:12px;color:#8a5a5a;text-transform:uppercase;font-weight:700">${label}</span>${value}</p>`;
}

function baseMail(title, lead, rows, ctaHtml = '') {
  return `<!doctype html><html lang="cs"><body style="background:#f4f4f4;padding:20px;font-family:Helvetica,Arial,sans-serif;color:#333"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><img src="https://raw.githubusercontent.com/TM2559/Skinstudio/main/salon-system/public/skinstudio_titulka.png" style="display:block;width:100%;max-height:250px;object-fit:cover" alt="Skin Studio"><div style="padding:32px 30px"><h1 style="text-align:center;font-weight:300;letter-spacing:1px;margin:0 0 16px">${title}</h1><p style="margin:0 0 18px">${lead}</p><div style="background:#fff0f0;padding:16px;border-radius:6px">${rows}</div>${ctaHtml}<p style="margin-top:18px">Skin Studio · Masarykovo nám. 72, Uherský Brod · rezervace@skinstudio.cz</p></div></div></body></html>`;
}

const mails = [
  {
    subject: '[Náhled] Potvrzení rezervace',
    html: baseMail(
      'POTVRZENÍ REZERVACE',
      'Děkujeme za Vaši rezervaci. Termín je závazně blokován.',
      row('Služba', 'Hydratační ošetření') + row('Datum', '30. 3. 2026') + row('Čas', '14:30'),
      `<p style="margin-top:16px"><a href="https://example.com/test.ics" style="display:inline-block;background:${accent};color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Přidat do kalendáře</a></p>`
    ),
  },
  {
    subject: '[Náhled] Nová rezervace (admin)',
    html: `<!doctype html><html lang="cs"><body style="background:#f6f6f6;padding:24px;font-family:Helvetica,Arial,sans-serif"><div style="max-width:520px;margin:0 auto"><h1 style="font-size:22px;border-bottom:2px solid ${accent};padding-bottom:10px">Nová rezervace (web)</h1><div style="background:#fff;border:1px solid #e8e8e8;border-radius:8px;padding:18px"><p><b>Jméno:</b> Test Klient</p><p><b>E-mail:</b> ${to}</p><p><b>Telefon:</b> +420724000000</p><p><b>Služba:</b> Hydratační ošetření</p><p><b>Termín:</b> 30. 3. 2026 v 14:30</p></div></div></body></html>`,
  },
  {
    subject: '[Náhled] Připomenutí rezervace',
    html: baseMail(
      'PŘIPOMENUTÍ REZERVACE',
      'Dovoluji si Vám připomenout, že se blíží termín Vaší rezervace.',
      row('Služba', 'Hydratační ošetření') + row('Datum', '30. 3. 2026') + row('Čas', '14:30')
    ),
  },
  {
    subject: '[Náhled] Potvrzení objednávky poukazu',
    html: buildVoucherConfirmationHtml({
      voucherLabel: 'Kosmetická péče — balíček Relax',
      packaging: 'box',
      targetPickupDate: '2026-03-31',
      totalPriceKc: 3100,
    }),
  },
  {
    subject: '[Náhled] Nová objednávka poukazu',
    html: buildAdminVoucherOrderHtml({
      orderId: 'preview-all-templates',
      voucherLabel: 'Kosmetická péče — balíček Relax',
      packaging: 'box',
      targetPickupDate: '2026-03-31',
      contactEmail: to,
      contactPhone: '+420724000000',
      totalPriceKc: 3100,
    }),
  },
];

for (const mail of mails) {
  const result = await resend.emails.send({
    from,
    to: [to],
    subject: mail.subject,
    html: mail.html,
  });
  if (result.error) {
    throw new Error(`${mail.subject}: ${JSON.stringify(result.error)}`);
  }
}

console.log(`Odesláno ${mails.length} náhledů na ${to}.`);

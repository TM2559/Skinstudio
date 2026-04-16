/**
 * HTML e-mailů pro objednávku dárkového poukazu — stejný vizuální jazyk jako rezervační Resend šablony
 * (hlavička obrázek, #d4a5a5 akcent, box #fff0f0, patička Skin Studio).
 */

const BRAND = {
  name: 'Skin Studio',
  addressLine: 'Masarykovo nám. 72, Uherský Brod',
  phone: '+420 724 875 558',
  phoneTel: 'tel:+420724875558',
  emailInfo: 'info@skinstudio.cz',
  emailReservations: 'rezervace@skinstudio.cz',
  accent: '#d4a5a5',
  accentLabel: '#8a5a5a',
  detailBoxBg: '#fff0f0',
  headerImageUrl:
    'https://raw.githubusercontent.com/TM2559/Skinstudio/main/salon-system/public/skinstudio_titulka.png',
};

const fontStack = "'Helvetica Neue', Helvetica, Arial, sans-serif";

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** YYYY-MM-DD → české datum */
export function formatPickupDateCs(iso) {
  if (!iso) return '—';
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return escapeHtml(iso);
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

export function packagingLabelCs(packaging) {
  if (packaging === 'box') return 'Dárková krabička (+100 Kč)';
  return 'Obálka';
}

function mailFooterHtml() {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;">
    <tr><td style="border-top:1px solid #e8e8e8;padding:24px 0 16px;"></td></tr>
    <tr><td style="color:#888;font-size:13px;font-weight:600;margin:0 0 4px;">${escapeHtml(BRAND.name)}</td></tr>
    <tr><td style="color:#888;font-size:13px;line-height:20px;margin:0 0 4px;">${escapeHtml(BRAND.addressLine)}</td></tr>
    <tr><td style="color:#888;font-size:13px;line-height:20px;margin:0 0 4px;">
      <a href="${BRAND.phoneTel}" style="color:${BRAND.accent};text-decoration:none;">${escapeHtml(BRAND.phone)}</a>
      · <a href="mailto:${BRAND.emailReservations}" style="color:${BRAND.accent};text-decoration:none;">${BRAND.emailReservations}</a>
    </td></tr>
    <tr><td style="color:#aaa;font-size:12px;margin:8px 0 0;">
      <a href="mailto:${BRAND.emailInfo}" style="color:#999;text-decoration:none;">${BRAND.emailInfo}</a>
    </td></tr>
  </table>`;
}

const confirmBodyOuter = `background-color:#f4f4f4;margin:0;padding:20px;font-family:${fontStack};font-size:16px;line-height:1.5;color:#333333`;
const confirmCard =
  'max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.05)';
const confirmHeaderBar = 'background-color:#000000;padding:0;text-align:center';
const confirmHeaderImg = 'display:block;width:100%;max-height:250px;object-fit:cover;border:0';
const confirmContent = 'padding:40px 30px';
const confirmTitle =
  'color:#2c2c2c;font-size:24px;font-weight:300;letter-spacing:1px;text-align:center;margin:0 0 20px';
const confirmGreeting = 'margin:0 0 20px;color:#333333';
const confirmLead = 'margin:0 0 30px;color:#555555';
const confirmDetailBox = `background-color:${BRAND.detailBoxBg};border-radius:6px;padding:20px;margin:0 0 30px`;
const confirmDetailLabel = `font-weight:bold;color:${BRAND.accentLabel};text-transform:uppercase;font-size:12px;margin:0 0 8px`;
const confirmDetailValue = 'font-size:16px;color:#333333;margin:0 0 12px';
const confirmMuted = 'margin:0 0 10px;color:#333333';
const confirmLink = `color:${BRAND.accent};text-decoration:none`;
const confirmClosing = 'margin:0;color:#333333';

function detailRow(label, valueHtml) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:4px;">
    <tr>
      <td valign="top" width="32%" style="padding-right:8px;">
        <p style="${confirmDetailLabel}">${escapeHtml(label)}</p>
      </td>
      <td valign="top">
        <p style="${confirmDetailValue}">${valueHtml}</p>
      </td>
    </tr>
  </table>`;
}

/**
 * Zákazník: potvrzení objednávky poukazu (hotovost při vyzvednutí).
 */
export function buildVoucherConfirmationHtml({
  voucherLabel,
  packaging,
  targetPickupDate,
  totalPriceKc,
}) {
  const preview = `Potvrzení objednávky poukazu — ${voucherLabel || BRAND.name}`;
  const totalStr =
    typeof totalPriceKc === 'number'
      ? `${totalPriceKc.toLocaleString('cs-CZ')} Kč`
      : escapeHtml(String(totalPriceKc ?? '—'));

  const inner = `
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${escapeHtml(preview)}</title>
</head>
<body style="${confirmBodyOuter}">
  <div style="${confirmCard}">
    <div style="${confirmHeaderBar}">
      <img src="${BRAND.headerImageUrl}" width="600" alt="Skin Studio" style="${confirmHeaderImg}" />
    </div>
    <div style="${confirmContent}">
      <h1 style="${confirmTitle}">POTVRZENÍ OBJEDNÁVKY POUKAZU</h1>
      <p style="${confirmGreeting}">Dobrý den,</p>
      <p style="${confirmLead}">
        Děkujeme za vaši objednávku dárkového poukazu. Částku uhradíte v hotovosti nebo převodem na účet při osobním vyzvednutí.
      </p>
      <div style="${confirmDetailBox}">
        ${detailRow('Poukaz', escapeHtml(voucherLabel || '—'))}
        ${detailRow('Balení', escapeHtml(packagingLabelCs(packaging)))}
        ${detailRow('Datum vyzvednutí', escapeHtml(formatPickupDateCs(targetPickupDate)))}
        ${detailRow('Celkem k úhradě', escapeHtml(totalStr))}
      </div>
      <p style="${confirmMuted}">
        Máte-li dotaz k objednávce, napište nám na
        <a href="mailto:${BRAND.emailReservations}" style="${confirmLink}">${BRAND.emailReservations}</a>.
      </p>
      <p style="${confirmClosing}">Těšíme se na vás v salonu!</p>
      ${mailFooterHtml()}
    </div>
  </div>
</body>
</html>`;
  return inner;
}

const main = "background-color:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif";
const container = 'margin:0 auto;padding:32px 24px;max-width:520px';
const h1 = `color:#1a1a1a;font-size:22px;font-weight:600;margin:0 0 24px;border-bottom:2px solid ${BRAND.accent};padding-bottom:12px`;
const box = 'background-color:#fff;border-radius:8px;padding:20px;margin:16px 0;border:1px solid #e8e8e8';
const label = 'color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;margin:12px 0 4px';
const value = 'color:#111;font-size:15px;margin:0 0 8px';
const link = `color:${BRAND.accent};font-size:14px;word-break:break-all`;

/**
 * Admin: nová objednávka poukazu.
 */
export function buildAdminVoucherOrderHtml({
  orderId,
  voucherLabel,
  packaging,
  targetPickupDate,
  contactEmail,
  contactPhone,
  totalPriceKc,
}) {
  const totalStr =
    typeof totalPriceKc === 'number'
      ? `${totalPriceKc.toLocaleString('cs-CZ')} Kč`
      : escapeHtml(String(totalPriceKc ?? '—'));

  const emailLink = contactEmail
    ? `<a href="mailto:${escapeHtml(contactEmail)}" style="color:${BRAND.accent};text-decoration:underline;">${escapeHtml(contactEmail)}</a>`
    : '—';

  return `
<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="${main}">
  <div style="${container}">
    <h1 style="${h1}">Nová objednávka dárkového poukazu (web)</h1>
    <div style="${box}">
      <p style="${label}">Číslo objednávky</p>
      <p style="${value};font-family:monospace;font-size:14px;">${escapeHtml(orderId || '—')}</p>
      <p style="${label}">Poukaz</p>
      <p style="${value}">${escapeHtml(voucherLabel || '—')}</p>
      <p style="${label}">Balení</p>
      <p style="${value}">${escapeHtml(packagingLabelCs(packaging))}</p>
      <p style="${label}">Datum vyzvednutí</p>
      <p style="${value}">${escapeHtml(formatPickupDateCs(targetPickupDate))}</p>
      <p style="${label}">E-mail zákazníka</p>
      <p style="${value}">${emailLink}</p>
      <p style="${label}">Telefon</p>
      <p style="${value}">${escapeHtml(contactPhone || '—')}</p>
      <p style="${label}">Celkem</p>
      <p style="${value}">${escapeHtml(totalStr)}</p>
    </div>
    ${mailFooterHtml()}
  </div>
</body>
</html>`;
}

/**
 * Zákazník: poukaz je připraven k vyzvednutí.
 */
export function buildVoucherReadyHtml({
  voucherLabel,
  totalPriceKc,
}) {
  const preview = `Váš poukaz je připraven — ${voucherLabel || BRAND.name}`;
  const totalStr =
    typeof totalPriceKc === 'number'
      ? `${totalPriceKc.toLocaleString('cs-CZ')} Kč`
      : escapeHtml(String(totalPriceKc ?? '—'));

  const inner = `
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${escapeHtml(preview)}</title>
</head>
<body style="${confirmBodyOuter}">
  <div style="${confirmCard}">
    <div style="${confirmHeaderBar}">
      <img src="${BRAND.headerImageUrl}" width="600" alt="Skin Studio" style="${confirmHeaderImg}" />
    </div>
    <div style="${confirmContent}">
      <h1 style="${confirmTitle}">VÁŠ POUKAZ JE PŘIPRAVEN</h1>
      <p style="${confirmGreeting}">Dobrý den,</p>
      <p style="${confirmLead}">
        Váš dárkový poukaz <strong>${escapeHtml(voucherLabel || '')}</strong> je krásně zabalený a čeká na vás.
      </p>
      <div style="${confirmDetailBox}">
        ${detailRow('Poukaz', escapeHtml(voucherLabel || '—'))}
        ${detailRow('Celkem k úhradě', escapeHtml(totalStr))}
        ${detailRow('Platba', 'Hotovost nebo QR kód při převzetí')}
        ${detailRow('Adresa', escapeHtml(BRAND.addressLine))}
      </div>
      <p style="${confirmMuted}">
        Napište nám, kdy si chcete poukaz vyzvednout — odpovíme co nejdříve.
        Kontakt: <a href="mailto:${BRAND.emailReservations}" style="${confirmLink}">${BRAND.emailReservations}</a>
        nebo <a href="${BRAND.phoneTel}" style="${confirmLink}">${BRAND.phone}</a>.
      </p>
      <p style="${confirmClosing}">Těšíme se na vás!</p>
      ${mailFooterHtml()}
    </div>
  </div>
</body>
</html>`;
  return inner;
}

/**
 * Veřejné údaje studia (shodné s webem – viz salon-system/src/constants/config.js CONTACT).
 * Používá se jen v HTML šablonách e-mailů ve Functions.
 */
export const BRAND = {
  name: 'Skin Studio',
  addressLine: 'Masarykovo nám. 72, Uherský Brod',
  phone: '+420 724 875 558',
  phoneTel: 'tel:+420724875558',
  emailInfo: 'info@skinstudio.cz',
  emailReservations: 'rezervace@skinstudio.cz',
  /** Odkaz / zvýraznění (shodné s původní EmailJS šablonou) */
  accent: '#d4a5a5',
  accentLabel: '#8a5a5a',
  detailBoxBg: '#fff0f0',
  /** Hlavička e-mailu (stejný obrázek jako na webu) */
  headerImageUrl:
    'https://raw.githubusercontent.com/TM2559/Skinstudio/main/salon-system/public/skinstudio_titulka.png',
};

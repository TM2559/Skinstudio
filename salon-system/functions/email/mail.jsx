/**
 * E-mailové šablony pro Resend (React Email).
 *
 * Mapování z původních EmailJS template parametrů:
 * - name          → jméno klienta
 * - to_email      → příjemce (řeší Resend API `to`, ne šablona)
 * - date, time    → termín
 * - service       / serviceName → název služby
 * - phone         → jen admin notifikace
 * - calendar_link → calendarLink (potvrzení klientovi + admin)
 * - reply_to      → nastavuje se v resendMail.js (hlavička), ne v HTML
 *
 * Potvrzení + připomínka sdílí stejné styly (confirm*). Úpravy: tento soubor (+ brand.js), pak `npm run build` ve functions/.
 */
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { render } from '@react-email/render';
import { BRAND } from './brand.js';

function MailFooter() {
  return (
    <Section style={footer}>
      <Hr style={hr} />
      <Text style={footerBrand}>{BRAND.name}</Text>
      <Text style={footerLine}>{BRAND.addressLine}</Text>
      <Text style={footerLine}>
        <Link href={BRAND.phoneTel} style={footerLink}>
          {BRAND.phone}
        </Link>
        {' · '}
        <Link href={`mailto:${BRAND.emailReservations}`} style={footerLink}>
          {BRAND.emailReservations}
        </Link>
      </Text>
      <Text style={footerMuted}>
        <Link href={`mailto:${BRAND.emailInfo}`} style={footerLinkMuted}>
          {BRAND.emailInfo}
        </Link>
      </Text>
    </Section>
  );
}

/** Potvrzení rezervace klientovi – viz původní EmailJS HTML (titulka, barvy, kalendář). */
export function BookingConfirmationEmail({ name, date, time, serviceName, calendarLink }) {
  const preview = `Potvrzení rezervace – ${serviceName || BRAND.name}`;
  return (
    <Html lang="cs">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={confirmBodyOuter}>
        <Container style={confirmCard}>
          <Section style={confirmHeaderBar}>
            <Img
              src={BRAND.headerImageUrl}
              width={600}
              alt="Skin Studio"
              style={confirmHeaderImg}
            />
          </Section>
          <Section style={confirmContent}>
            <Heading style={confirmTitle}>POTVRZENÍ REZERVACE</Heading>
            <Text style={confirmGreeting}>Dobrý den{name ? ` ${name}` : ''},</Text>
            <Text style={confirmLead}>
              Děkuji za Vaši rezervaci. Vámi vybraný termín je pro vás závazně blokován.
            </Text>
            <Section style={confirmDetailBox}>
              <Row>
                <Column style={confirmLabelCol}>
                  <Text style={confirmDetailLabel}>Služba</Text>
                </Column>
                <Column>
                  <Text style={confirmDetailValue}>{serviceName || '—'}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={confirmLabelCol}>
                  <Text style={confirmDetailLabel}>Datum</Text>
                </Column>
                <Column>
                  <Text style={confirmDetailValue}>{date || '—'}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={confirmLabelCol}>
                  <Text style={confirmDetailLabel}>Čas</Text>
                </Column>
                <Column>
                  <Text style={confirmDetailValue}>{time || '—'}</Text>
                </Column>
              </Row>
            </Section>
            {calendarLink ? (
              <Section style={confirmBtnWrap}>
                <Button href={calendarLink} style={confirmCalendarBtn}>
                  📅 PŘIDAT DO KALENDÁŘE
                </Button>
              </Section>
            ) : null}
            <Text style={confirmMuted}>
              Pokud potřebujete termín změnit, prosím kontaktujte mě co nejdříve na{' '}
              <Link href={`mailto:${BRAND.emailReservations}`} style={confirmLink}>
                {BRAND.emailReservations}
              </Link>
              .
            </Text>
            <Text style={confirmClosing}>Těším se na vaši návštěvu!</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/** Interní hlášení o nové rezervaci (dříve admin šablona v EmailJS). */
export function AdminNotificationEmail({
  name,
  email,
  phone,
  date,
  time,
  serviceName,
  calendarLink,
}) {
  return (
    <Html lang="cs">
      <Head />
      <Preview>Nová rezervace – {serviceName || 'rezervace'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nová rezervace (web)</Heading>
          <Section style={box}>
            <Text style={label}>Jméno</Text>
            <Text style={value}>{name || '—'}</Text>
            <Text style={label}>E-mail klienta</Text>
            <Text style={value}>
              {email ? (
                <Link href={`mailto:${email}`} style={inlineLink}>
                  {email}
                </Link>
              ) : (
                '—'
              )}
            </Text>
            <Text style={label}>Telefon</Text>
            <Text style={value}>{phone || '—'}</Text>
            <Text style={label}>Služba</Text>
            <Text style={value}>{serviceName || '—'}</Text>
            <Text style={label}>Termín</Text>
            <Text style={value}>
              {date || '—'} v {time || '—'}
            </Text>
            {calendarLink ? (
              <>
                <Text style={label}>Kalendář (.ics / odkaz)</Text>
                <Link href={calendarLink} style={link}>
                  {calendarLink}
                </Link>
              </>
            ) : null}
          </Section>
          <MailFooter />
        </Container>
      </Body>
    </Html>
  );
}

/** Připomínka zítřejší rezervace (dříve EmailJS reminder + sendDailyReminders) – stejný layout jako potvrzení. */
export function ReminderEmail({ name, date, time, serviceName }) {
  const preview = `Připomenutí rezervace – ${date || ''} ${time || ''}`;
  return (
    <Html lang="cs">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={confirmBodyOuter}>
        <Container style={confirmCard}>
          <Section style={confirmHeaderBar}>
            <Img
              src={BRAND.headerImageUrl}
              width={600}
              alt="Skin Studio"
              style={confirmHeaderImg}
            />
          </Section>
          <Section style={confirmContent}>
            <Heading style={confirmTitle}>Připomenutí REZERVACE</Heading>
            <Text style={confirmGreeting}>Dobrý den{name ? ` ${name}` : ''},</Text>
            <Text style={confirmLead}>
              Dovoluji si Vám připomenout, že se blíží termín Vaší rezervace.
            </Text>
            <Section style={confirmDetailBox}>
              <Row>
                <Column style={confirmLabelCol}>
                  <Text style={confirmDetailLabel}>Služba</Text>
                </Column>
                <Column>
                  <Text style={confirmDetailValue}>{serviceName || '—'}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={confirmLabelCol}>
                  <Text style={confirmDetailLabel}>Datum</Text>
                </Column>
                <Column>
                  <Text style={confirmDetailValue}>{date || '—'}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={confirmLabelCol}>
                  <Text style={confirmDetailLabel}>Čas</Text>
                </Column>
                <Column>
                  <Text style={confirmDetailValue}>{time || '—'}</Text>
                </Column>
              </Row>
            </Section>
            <Text style={confirmMuted}>
              Pokud potřebujete termín změnit, prosím kontaktujte mě co nejdříve na{' '}
              <Link href={`mailto:${BRAND.emailReservations}`} style={confirmLink}>
                {BRAND.emailReservations}
              </Link>
              .
            </Text>
            <Text style={confirmClosing}>Těším se na vaši návštěvu!</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderBookingConfirmationHtml(props) {
  return render(<BookingConfirmationEmail {...props} />);
}

export async function renderAdminNotificationHtml(props) {
  return render(<AdminNotificationEmail {...props} />);
}

export async function renderReminderHtml(props) {
  return render(<ReminderEmail {...props} />);
}

const accent = BRAND.accent;

const fontStack = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const confirmBodyOuter = {
  backgroundColor: '#f4f4f4',
  margin: '0',
  padding: '20px',
  fontFamily: fontStack,
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#333333',
};

const confirmCard = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
};

const confirmHeaderBar = {
  backgroundColor: '#000000',
  padding: '0',
  textAlign: 'center',
};

const confirmHeaderImg = {
  display: 'block',
  width: '100%',
  maxHeight: '250px',
  objectFit: 'cover',
  border: '0',
};

const confirmContent = {
  padding: '40px 30px',
};

const confirmTitle = {
  color: '#2c2c2c',
  fontSize: '24px',
  fontWeight: '300',
  letterSpacing: '1px',
  textAlign: 'center',
  margin: '0 0 20px',
};

const confirmGreeting = {
  margin: '0 0 20px',
  color: '#333333',
};

const confirmLead = {
  margin: '0 0 30px',
  color: '#555555',
};

const confirmDetailBox = {
  backgroundColor: BRAND.detailBoxBg,
  borderRadius: '6px',
  padding: '20px',
  margin: '0 0 30px',
};

const confirmLabelCol = {
  width: '30%',
  verticalAlign: 'top',
  paddingRight: '8px',
};

const confirmDetailLabel = {
  fontWeight: 'bold',
  color: BRAND.accentLabel,
  textTransform: 'uppercase',
  fontSize: '12px',
  margin: '0 0 8px',
};

const confirmDetailValue = {
  fontSize: '16px',
  color: '#333333',
  margin: '0 0 8px',
};

const confirmBtnWrap = {
  textAlign: 'center',
  margin: '0 0 30px',
};

const confirmCalendarBtn = {
  display: 'inline-block',
  padding: '12px 25px',
  backgroundColor: BRAND.accent,
  color: '#ffffff',
  textDecoration: 'none',
  borderRadius: '50px',
  fontWeight: 'bold',
  fontSize: '14px',
  letterSpacing: '0.5px',
};

const confirmMuted = {
  margin: '0 0 10px',
  color: '#333333',
};

const confirmLink = {
  color: BRAND.accent,
  textDecoration: 'none',
};

const confirmClosing = {
  margin: '0',
  color: '#333333',
};

const main = {
  backgroundColor: '#f6f6f6',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '32px 24px',
  maxWidth: '520px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '22px',
  fontWeight: '600',
  margin: '0 0 24px',
  borderBottom: `2px solid ${accent}`,
  paddingBottom: '12px',
};

const lead = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 12px',
};

const text = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 12px',
};

const closing = {
  color: '#333',
  fontSize: '15px',
  margin: '20px 0 8px',
};

const box = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
  border: '1px solid #e8e8e8',
};

const label = {
  color: '#666',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  margin: '12px 0 4px',
};

const value = {
  color: '#111',
  fontSize: '15px',
  margin: '0 0 8px',
};

const signature = {
  color: '#333',
  fontSize: '15px',
  margin: '0 0 24px',
};

const link = {
  color: accent,
  fontSize: '14px',
  wordBreak: 'break-all',
};

const inlineLink = {
  color: accent,
  textDecoration: 'underline',
};

const footer = {
  marginTop: '8px',
};

const hr = {
  borderColor: '#e8e8e8',
  margin: '24px 0 16px',
};

const footerBrand = {
  color: '#888',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0 0 4px',
};

const footerLine = {
  color: '#888',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 4px',
};

const footerMuted = {
  color: '#aaa',
  fontSize: '12px',
  margin: '8px 0 0',
};

const footerLink = {
  color: accent,
};

const footerLinkMuted = {
  color: '#999',
};

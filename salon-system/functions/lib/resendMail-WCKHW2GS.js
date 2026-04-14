import {
  getAdminTo,
  getFrom,
  getReplyTo,
  getResendApiKey,
  isResendConfigured
} from "./chunk-CAD7T5TA.js";

// src/resendMail.js
import { Resend } from "resend";

// email/mail.jsx
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
  Text
} from "@react-email/components";
import * as React from "react";
import { render } from "@react-email/render";

// email/brand.js
var BRAND = {
  name: "Skin Studio",
  addressLine: "Masarykovo n\xE1m. 72, Uhersk\xFD Brod",
  phone: "+420 724 875 558",
  phoneTel: "tel:+420724875558",
  emailInfo: "info@skinstudio.cz",
  emailReservations: "rezervace@skinstudio.cz",
  /** Odkaz / zvýraznění (shodné s původní EmailJS šablonou) */
  accent: "#d4a5a5",
  accentLabel: "#8a5a5a",
  detailBoxBg: "#fff0f0",
  /** Hlavička e-mailu (stejný obrázek jako na webu) */
  headerImageUrl: "https://raw.githubusercontent.com/TM2559/Skinstudio/main/salon-system/public/skinstudio_titulka.png"
};

// email/mail.jsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function MailFooter() {
  return /* @__PURE__ */ jsxs(Section, { style: footer, children: [
    /* @__PURE__ */ jsx(Hr, { style: hr }),
    /* @__PURE__ */ jsx(Text, { style: footerBrand, children: BRAND.name }),
    /* @__PURE__ */ jsx(Text, { style: footerLine, children: BRAND.addressLine }),
    /* @__PURE__ */ jsxs(Text, { style: footerLine, children: [
      /* @__PURE__ */ jsx(Link, { href: BRAND.phoneTel, style: footerLink, children: BRAND.phone }),
      " \xB7 ",
      /* @__PURE__ */ jsx(Link, { href: `mailto:${BRAND.emailReservations}`, style: footerLink, children: BRAND.emailReservations })
    ] }),
    /* @__PURE__ */ jsx(Text, { style: footerMuted, children: /* @__PURE__ */ jsx(Link, { href: `mailto:${BRAND.emailInfo}`, style: footerLinkMuted, children: BRAND.emailInfo }) })
  ] });
}
function BookingConfirmationEmail({ name, date, time, serviceName, calendarLink, calendarIcsLink }) {
  const preview = `Potvrzen\xED rezervace \u2013 ${serviceName || BRAND.name}`;
  return /* @__PURE__ */ jsxs(Html, { lang: "cs", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsx(Preview, { children: preview }),
    /* @__PURE__ */ jsx(Body, { style: confirmBodyOuter, children: /* @__PURE__ */ jsxs(Container, { style: confirmCard, children: [
      /* @__PURE__ */ jsx(Section, { style: confirmHeaderBar, children: /* @__PURE__ */ jsx(
        Img,
        {
          src: BRAND.headerImageUrl,
          width: 600,
          alt: "Skin Studio",
          style: confirmHeaderImg
        }
      ) }),
      /* @__PURE__ */ jsxs(Section, { style: confirmContent, children: [
        /* @__PURE__ */ jsx(Heading, { style: confirmTitle, children: "POTVRZEN\xCD REZERVACE" }),
        /* @__PURE__ */ jsx(Text, { style: confirmGreeting, children: "Dobr\xFD den," }),
        /* @__PURE__ */ jsx(Text, { style: confirmLead, children: "D\u011Bkuji za Va\u0161i rezervaci. V\xE1mi vybran\xFD term\xEDn je pro v\xE1s z\xE1vazn\u011B blokov\xE1n." }),
        /* @__PURE__ */ jsxs(Section, { style: confirmDetailBox, children: [
          /* @__PURE__ */ jsxs(Row, { children: [
            /* @__PURE__ */ jsx(Column, { style: confirmLabelCol, children: /* @__PURE__ */ jsx(Text, { style: confirmDetailLabel, children: "Slu\u017Eba" }) }),
            /* @__PURE__ */ jsx(Column, { children: /* @__PURE__ */ jsx(Text, { style: confirmDetailValue, children: serviceName || "\u2014" }) })
          ] }),
          /* @__PURE__ */ jsxs(Row, { children: [
            /* @__PURE__ */ jsx(Column, { style: confirmLabelCol, children: /* @__PURE__ */ jsx(Text, { style: confirmDetailLabel, children: "Datum" }) }),
            /* @__PURE__ */ jsx(Column, { children: /* @__PURE__ */ jsx(Text, { style: confirmDetailValue, children: date || "\u2014" }) })
          ] }),
          /* @__PURE__ */ jsxs(Row, { children: [
            /* @__PURE__ */ jsx(Column, { style: confirmLabelCol, children: /* @__PURE__ */ jsx(Text, { style: confirmDetailLabel, children: "\u010Cas" }) }),
            /* @__PURE__ */ jsx(Column, { children: /* @__PURE__ */ jsx(Text, { style: confirmDetailValue, children: time || "\u2014" }) })
          ] })
        ] }),
        calendarLink || calendarIcsLink ? /* @__PURE__ */ jsxs(Section, { style: confirmBtnWrap, children: [
          calendarLink ? /* @__PURE__ */ jsx(Button, { href: calendarLink, style: confirmCalendarBtn, children: "\u{1F4C5} Google Kalend\xE1\u0159" }) : null,
          calendarIcsLink ? /* @__PURE__ */ jsx(
            Button,
            {
              href: calendarIcsLink,
              style: calendarLink ? confirmCalendarBtnApple : confirmCalendarBtn,
              children: "P\u0159idat do Apple Kalend\xE1\u0159e"
            }
          ) : null
        ] }) : null,
        /* @__PURE__ */ jsxs(Text, { style: confirmMuted, children: [
          "Pokud pot\u0159ebujete term\xEDn zm\u011Bnit, pros\xEDm kontaktujte m\u011B co nejd\u0159\xEDve na",
          " ",
          /* @__PURE__ */ jsx(Link, { href: `mailto:${BRAND.emailReservations}`, style: confirmLink, children: BRAND.emailReservations }),
          "."
        ] }),
        /* @__PURE__ */ jsx(Text, { style: confirmClosing, children: "T\u011B\u0161\xEDm se na va\u0161i n\xE1v\u0161t\u011Bvu!" })
      ] })
    ] }) })
  ] });
}
function AdminNotificationEmail({
  name,
  email,
  phone,
  date,
  time,
  serviceName,
  calendarLink,
  calendarIcsLink
}) {
  return /* @__PURE__ */ jsxs(Html, { lang: "cs", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsxs(Preview, { children: [
      "Nov\xE1 rezervace \u2013 ",
      serviceName || "rezervace"
    ] }),
    /* @__PURE__ */ jsx(Body, { style: main, children: /* @__PURE__ */ jsxs(Container, { style: container, children: [
      /* @__PURE__ */ jsx(Heading, { style: h1, children: "Nov\xE1 rezervace (web)" }),
      /* @__PURE__ */ jsxs(Section, { style: box, children: [
        /* @__PURE__ */ jsx(Text, { style: label, children: "Jm\xE9no" }),
        /* @__PURE__ */ jsx(Text, { style: value, children: name || "\u2014" }),
        /* @__PURE__ */ jsx(Text, { style: label, children: "E-mail klienta" }),
        /* @__PURE__ */ jsx(Text, { style: value, children: email ? /* @__PURE__ */ jsx(Link, { href: `mailto:${email}`, style: inlineLink, children: email }) : "\u2014" }),
        /* @__PURE__ */ jsx(Text, { style: label, children: "Telefon" }),
        /* @__PURE__ */ jsx(Text, { style: value, children: phone || "\u2014" }),
        /* @__PURE__ */ jsx(Text, { style: label, children: "Slu\u017Eba" }),
        /* @__PURE__ */ jsx(Text, { style: value, children: serviceName || "\u2014" }),
        /* @__PURE__ */ jsx(Text, { style: label, children: "Term\xEDn" }),
        /* @__PURE__ */ jsxs(Text, { style: value, children: [
          date || "\u2014",
          " v ",
          time || "\u2014"
        ] }),
        calendarLink ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Text, { style: label, children: "Google Kalend\xE1\u0159" }),
          /* @__PURE__ */ jsx(Link, { href: calendarLink, style: link, children: calendarLink })
        ] }) : null,
        calendarIcsLink ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Text, { style: label, children: "Apple Kalend\xE1\u0159 (.ics)" }),
          /* @__PURE__ */ jsx(Link, { href: calendarIcsLink, style: link, children: calendarIcsLink })
        ] }) : null
      ] }),
      /* @__PURE__ */ jsx(MailFooter, {})
    ] }) })
  ] });
}
function ReminderEmail({ name, date, time, serviceName, calendarIcsLink }) {
  const preview = `P\u0159ipomenut\xED rezervace \u2013 ${date || ""} ${time || ""}`;
  return /* @__PURE__ */ jsxs(Html, { lang: "cs", children: [
    /* @__PURE__ */ jsx(Head, {}),
    /* @__PURE__ */ jsx(Preview, { children: preview }),
    /* @__PURE__ */ jsx(Body, { style: confirmBodyOuter, children: /* @__PURE__ */ jsxs(Container, { style: confirmCard, children: [
      /* @__PURE__ */ jsx(Section, { style: confirmHeaderBar, children: /* @__PURE__ */ jsx(
        Img,
        {
          src: BRAND.headerImageUrl,
          width: 600,
          alt: "Skin Studio",
          style: confirmHeaderImg
        }
      ) }),
      /* @__PURE__ */ jsxs(Section, { style: confirmContent, children: [
        /* @__PURE__ */ jsx(Heading, { style: confirmTitle, children: "P\u0159ipomenut\xED REZERVACE" }),
        /* @__PURE__ */ jsx(Text, { style: confirmGreeting, children: "Dobr\xFD den," }),
        /* @__PURE__ */ jsx(Text, { style: confirmLead, children: "Dovoluji si V\xE1m p\u0159ipomenout, \u017Ee se bl\xED\u017E\xED term\xEDn Va\u0161\xED rezervace." }),
        /* @__PURE__ */ jsxs(Section, { style: confirmDetailBox, children: [
          /* @__PURE__ */ jsxs(Row, { children: [
            /* @__PURE__ */ jsx(Column, { style: confirmLabelCol, children: /* @__PURE__ */ jsx(Text, { style: confirmDetailLabel, children: "Slu\u017Eba" }) }),
            /* @__PURE__ */ jsx(Column, { children: /* @__PURE__ */ jsx(Text, { style: confirmDetailValue, children: serviceName || "\u2014" }) })
          ] }),
          /* @__PURE__ */ jsxs(Row, { children: [
            /* @__PURE__ */ jsx(Column, { style: confirmLabelCol, children: /* @__PURE__ */ jsx(Text, { style: confirmDetailLabel, children: "Datum" }) }),
            /* @__PURE__ */ jsx(Column, { children: /* @__PURE__ */ jsx(Text, { style: confirmDetailValue, children: date || "\u2014" }) })
          ] }),
          /* @__PURE__ */ jsxs(Row, { children: [
            /* @__PURE__ */ jsx(Column, { style: confirmLabelCol, children: /* @__PURE__ */ jsx(Text, { style: confirmDetailLabel, children: "\u010Cas" }) }),
            /* @__PURE__ */ jsx(Column, { children: /* @__PURE__ */ jsx(Text, { style: confirmDetailValue, children: time || "\u2014" }) })
          ] })
        ] }),
        calendarIcsLink ? /* @__PURE__ */ jsx(Section, { style: confirmBtnWrap, children: /* @__PURE__ */ jsx(Button, { href: calendarIcsLink, style: confirmCalendarBtn, children: "P\u0159idat do Apple Kalend\xE1\u0159e" }) }) : null,
        /* @__PURE__ */ jsxs(Text, { style: confirmMuted, children: [
          "Pokud pot\u0159ebujete term\xEDn zm\u011Bnit, pros\xEDm kontaktujte m\u011B co nejd\u0159\xEDve na",
          " ",
          /* @__PURE__ */ jsx(Link, { href: `mailto:${BRAND.emailReservations}`, style: confirmLink, children: BRAND.emailReservations }),
          "."
        ] }),
        /* @__PURE__ */ jsx(Text, { style: confirmClosing, children: "T\u011B\u0161\xEDm se na va\u0161i n\xE1v\u0161t\u011Bvu!" })
      ] })
    ] }) })
  ] });
}
async function renderBookingConfirmationHtml(props) {
  return render(/* @__PURE__ */ jsx(BookingConfirmationEmail, { ...props }));
}
async function renderAdminNotificationHtml(props) {
  return render(/* @__PURE__ */ jsx(AdminNotificationEmail, { ...props }));
}
async function renderReminderHtml(props) {
  return render(/* @__PURE__ */ jsx(ReminderEmail, { ...props }));
}
var accent = BRAND.accent;
var fontStack = "'Helvetica Neue', Helvetica, Arial, sans-serif";
var confirmBodyOuter = {
  backgroundColor: "#f4f4f4",
  margin: "0",
  padding: "20px",
  fontFamily: fontStack,
  fontSize: "16px",
  lineHeight: "1.5",
  color: "#333333"
};
var confirmCard = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
};
var confirmHeaderBar = {
  backgroundColor: "#000000",
  padding: "0",
  textAlign: "center"
};
var confirmHeaderImg = {
  display: "block",
  width: "100%",
  maxHeight: "250px",
  objectFit: "cover",
  border: "0"
};
var confirmContent = {
  padding: "40px 30px"
};
var confirmTitle = {
  color: "#2c2c2c",
  fontSize: "24px",
  fontWeight: "300",
  letterSpacing: "1px",
  textAlign: "center",
  margin: "0 0 20px"
};
var confirmGreeting = {
  margin: "0 0 20px",
  color: "#333333"
};
var confirmLead = {
  margin: "0 0 30px",
  color: "#555555"
};
var confirmDetailBox = {
  backgroundColor: BRAND.detailBoxBg,
  borderRadius: "6px",
  padding: "20px",
  margin: "0 0 30px"
};
var confirmLabelCol = {
  width: "30%",
  verticalAlign: "top",
  paddingRight: "8px"
};
var confirmDetailLabel = {
  fontWeight: "bold",
  color: BRAND.accentLabel,
  textTransform: "uppercase",
  fontSize: "12px",
  margin: "0 0 8px"
};
var confirmDetailValue = {
  fontSize: "16px",
  color: "#333333",
  margin: "0 0 8px"
};
var confirmBtnWrap = {
  textAlign: "center",
  margin: "0 0 30px"
};
var confirmCalendarBtn = {
  display: "inline-block",
  padding: "12px 25px",
  backgroundColor: BRAND.accent,
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: "50px",
  fontWeight: "bold",
  fontSize: "14px",
  letterSpacing: "0.5px"
};
var confirmCalendarBtnApple = {
  ...confirmCalendarBtn,
  backgroundColor: "#1d1d1f",
  marginTop: "14px"
};
var confirmMuted = {
  margin: "0 0 10px",
  color: "#333333"
};
var confirmLink = {
  color: BRAND.accent,
  textDecoration: "none"
};
var confirmClosing = {
  margin: "0",
  color: "#333333"
};
var main = {
  backgroundColor: "#f6f6f6",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
};
var container = {
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "520px"
};
var h1 = {
  color: "#1a1a1a",
  fontSize: "22px",
  fontWeight: "600",
  margin: "0 0 24px",
  borderBottom: `2px solid ${accent}`,
  paddingBottom: "12px"
};
var box = {
  backgroundColor: "#fff",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0",
  border: "1px solid #e8e8e8"
};
var label = {
  color: "#666",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  margin: "12px 0 4px"
};
var value = {
  color: "#111",
  fontSize: "15px",
  margin: "0 0 8px"
};
var link = {
  color: accent,
  fontSize: "14px",
  wordBreak: "break-all"
};
var inlineLink = {
  color: accent,
  textDecoration: "underline"
};
var footer = {
  marginTop: "8px"
};
var hr = {
  borderColor: "#e8e8e8",
  margin: "24px 0 16px"
};
var footerBrand = {
  color: "#888",
  fontSize: "13px",
  fontWeight: "600",
  margin: "0 0 4px"
};
var footerLine = {
  color: "#888",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 4px"
};
var footerMuted = {
  color: "#aaa",
  fontSize: "12px",
  margin: "8px 0 0"
};
var footerLink = {
  color: accent
};
var footerLinkMuted = {
  color: "#999"
};

// src/resendMail.js
function getResendClient() {
  const key = getResendApiKey();
  if (!key) return null;
  return new Resend(key);
}
function resendErrText(err) {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (typeof err.message === "string" && err.message) return err.message;
  try {
    return JSON.stringify(err).slice(0, 400);
  } catch {
    return String(err);
  }
}
async function sendBookingEmailsInternal({
  name,
  email,
  phone,
  date,
  time,
  serviceName,
  calendarLink,
  calendarIcsLink,
  mode = "both"
}) {
  const from = getFrom();
  const replyTo = getReplyTo();
  const adminTo = getAdminTo();
  const resend = getResendClient();
  if (!getResendApiKey()) {
    return { clientOk: false, adminOk: false, clientError: "Chyb\xED RESEND_API_KEY (functions / Firebase secrets)." };
  }
  if (!from) {
    return { clientOk: false, adminOk: false, clientError: "Chyb\xED RESEND_FROM (ov\u011B\u0159en\xFD odes\xEDlatel v Resend)." };
  }
  if (!resend) {
    return { clientOk: false, adminOk: false, clientError: "Nelze vytvo\u0159it Resend klienta." };
  }
  let clientOk = true;
  let clientError = "";
  if (mode === "both" || mode === "clientOnly") {
    const clientHtml = await renderBookingConfirmationHtml({
      name,
      date,
      time,
      serviceName,
      calendarLink,
      calendarIcsLink
    });
    const clientResult = await resend.emails.send({
      from,
      to: [email],
      replyTo: replyTo || void 0,
      subject: `Potvrzen\xED rezervace \u2013 ${serviceName || "Skin Studio"}`,
      html: clientHtml
    });
    if (clientResult.error) {
      clientError = resendErrText(clientResult.error);
      console.error("Resend booking \u2192 klient:", clientResult.error);
      clientOk = false;
    } else {
      clientOk = true;
    }
  }
  let adminOk = true;
  let adminError = "";
  if (mode === "both") {
    if (adminTo) {
      const adminHtml = await renderAdminNotificationHtml({
        name,
        email,
        phone,
        date,
        time,
        serviceName,
        calendarLink,
        calendarIcsLink
      });
      const adminResult = await resend.emails.send({
        from,
        to: [adminTo],
        replyTo: email || replyTo || void 0,
        subject: `Nov\xE1 rezervace \u2013 ${serviceName || "rezervace"}`,
        html: adminHtml
      });
      if (adminResult.error) {
        adminError = resendErrText(adminResult.error);
        console.error("Resend booking \u2192 admin:", adminResult.error);
        adminOk = false;
      } else {
        adminOk = true;
      }
    }
  } else if (mode === "adminOnly") {
    if (!adminTo) {
      adminOk = false;
      adminError = "Chyb\xED RESEND_ADMIN_TO (functions / Firebase secrets).";
    } else {
      const adminHtml = await renderAdminNotificationHtml({
        name,
        email,
        phone,
        date,
        time,
        serviceName,
        calendarLink,
        calendarIcsLink
      });
      const adminResult = await resend.emails.send({
        from,
        to: [adminTo],
        replyTo: email || replyTo || void 0,
        subject: `Nov\xE1 rezervace \u2013 ${serviceName || "rezervace"}`,
        html: adminHtml
      });
      if (adminResult.error) {
        adminError = resendErrText(adminResult.error);
        console.error("Resend booking \u2192 admin:", adminResult.error);
        adminOk = false;
      } else {
        adminOk = true;
      }
    }
  }
  const out = { clientOk, adminOk };
  if (clientError) out.clientError = clientError;
  if (adminError) out.adminError = adminError;
  return out;
}
async function sendReminderEmailInternal(params) {
  const { name, email, date, time, serviceName, calendarIcsLink } = params;
  const from = getFrom();
  const replyTo = getReplyTo();
  const resend = getResendClient();
  if (!resend || !from || !email) return false;
  const html = await renderReminderHtml({ name, date, time, serviceName, calendarIcsLink });
  const result = await resend.emails.send({
    from,
    to: [email],
    replyTo: replyTo || void 0,
    subject: `P\u0159ipom\xEDnka rezervace \u2013 ${date || ""}`.trim(),
    html
  });
  return !result.error;
}
export {
  isResendConfigured,
  sendBookingEmailsInternal,
  sendReminderEmailInternal
};

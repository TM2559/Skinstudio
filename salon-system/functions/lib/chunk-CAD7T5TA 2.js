// src/resendEnv.js
import { defineString } from "firebase-functions/params";
var resendApiKeyParam = defineString("RESEND_API_KEY", { default: "" });
var resendFromParam = defineString("RESEND_FROM", { default: "" });
var resendReplyToParam = defineString("RESEND_REPLY_TO", { default: "" });
var resendAdminToParam = defineString("RESEND_ADMIN_TO", { default: "" });
function getResendApiKey() {
  try {
    return resendApiKeyParam.value() || process.env.RESEND_API_KEY || "";
  } catch {
    return process.env.RESEND_API_KEY || "";
  }
}
function getFrom() {
  try {
    return resendFromParam.value() || process.env.RESEND_FROM || "";
  } catch {
    return process.env.RESEND_FROM || "";
  }
}
function getReplyTo() {
  try {
    return resendReplyToParam.value() || process.env.RESEND_REPLY_TO || "";
  } catch {
    return process.env.RESEND_REPLY_TO || "";
  }
}
function getAdminTo() {
  try {
    return resendAdminToParam.value() || process.env.RESEND_ADMIN_TO || "";
  } catch {
    return process.env.RESEND_ADMIN_TO || "";
  }
}
function isResendConfigured() {
  return Boolean(getResendApiKey() && getFrom());
}

export {
  getResendApiKey,
  getFrom,
  getReplyTo,
  getAdminTo,
  isResendConfigured
};

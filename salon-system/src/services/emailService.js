import { callSendBookingConfirmationEmail, callSendAdminNotificationEmail, callSendReminderEmail } from '../firebaseConfig';

export async function sendBookingConfirmationEmail({ name, email, date, time, serviceName }) {
  try {
    const result = await callSendBookingConfirmationEmail({ name, email, date, time, serviceName });
    return result?.data?.sent ?? false;
  } catch (err) {
    console.error('sendBookingConfirmationEmail failed:', err);
    return false;
  }
}

export async function sendAdminNotificationEmail({ name, email, phone, date, time, serviceName, calendarLink }) {
  try {
    const result = await callSendAdminNotificationEmail({ name, email, phone, date, time, serviceName, calendarLink });
    return result?.data?.sent ?? false;
  } catch (err) {
    console.error('sendAdminNotificationEmail failed:', err);
    return false;
  }
}

export async function sendReminderEmail({ name, email, date, time, serviceName, calendarIcsLink }) {
  try {
    const result = await callSendReminderEmail({
      name,
      email,
      date,
      time,
      serviceName,
      ...(calendarIcsLink ? { calendarIcsLink } : {}),
    });
    return result?.data?.sent ?? false;
  } catch (err) {
    console.error('sendReminderEmail failed:', err);
    return false;
  }
}

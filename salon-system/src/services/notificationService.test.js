import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCallSendConfirmationSms = vi.fn(() => Promise.resolve());
const mockCallSendReminderSms = vi.fn(() => Promise.resolve({ data: { sent: 2 } }));
const mockCallSendBookingEmails = vi.fn(() => Promise.resolve({ data: { clientOk: true, adminOk: true } }));
const mockCallSendReminderEmails = vi.fn(() => Promise.resolve({ data: { sent: 2, errors: [] } }));

vi.mock('../firebaseConfig', () => ({
  callSendConfirmationSms: (...args) => mockCallSendConfirmationSms(...args),
  callSendReminderSms: (...args) => mockCallSendReminderSms(...args),
  callSendBookingEmails: (...args) => mockCallSendBookingEmails(...args),
  callSendReminderEmails: (...args) => mockCallSendReminderEmails(...args),
  EMAILJS_CONFIG: { PUBLIC_KEY: 'k', SERVICE_ID: 's', CONFIRM_TEMPLATE: 'c', ADMIN_TEMPLATE: 'a', REMINDER_TEMPLATE: 'r' },
}));
vi.mock('../constants/config', () => ({
  CONTACT: { EMAIL_PUBLIC: 'info@t.cz', EMAIL_RESERVATIONS: 'rez@t.cz' },
}));

global.fetch = vi.fn(() => Promise.resolve({ ok: true }));

import { sendBookingConfirmations, sendReminders } from './notificationService';

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
  });

  describe('sendBookingConfirmations', () => {
    const baseParams = {
      name: 'Jan', phone: '723456789', email: 'jan@t.cz',
      date: '01-03-2026', time: '10:00', serviceName: 'Masáž', duration: 60,
      calendarLink: 'https://cal.google.com/test',
    };

    it('sends SMS when phone is provided', async () => {
      const results = await sendBookingConfirmations(baseParams);
      expect(mockCallSendConfirmationSms).toHaveBeenCalledTimes(1);
      expect(results.sms).toBe(true);
    });

    it('skips SMS when phone is empty', async () => {
      const results = await sendBookingConfirmations({ ...baseParams, phone: '' });
      expect(mockCallSendConfirmationSms).not.toHaveBeenCalled();
      expect(results.sms).toBe(false);
    });

    it('sends confirmation + admin emails when email is provided', async () => {
      const results = await sendBookingConfirmations(baseParams);
      expect(results.email).toBe(true);
      expect(results.adminEmail).toBe(true);
      expect(mockCallSendBookingEmails).toHaveBeenCalledTimes(1);
    });

    it('skips emails when email is empty', async () => {
      const results = await sendBookingConfirmations({ ...baseParams, email: '' });
      expect(results.email).toBe(false);
      expect(results.adminEmail).toBe(false);
    });

    it('catches SMS errors without throwing', async () => {
      mockCallSendConfirmationSms.mockRejectedValueOnce(new Error('SMS fail'));
      const results = await sendBookingConfirmations(baseParams);
      expect(results.sms).toBe(false);
      expect(results.email).toBe(true);
    });
  });

  describe('sendReminders', () => {
    const reservations = [
      { id: '1', phone: '723456789', email: 'a@t.cz', name: 'A', date: '01-03-2026', time: '10:00', serviceName: 'X' },
      { id: '2', phone: '', email: 'b@t.cz', name: 'B', date: '01-03-2026', time: '11:00', serviceName: 'Y' },
      { id: '3', phone: '723000000', email: '', name: 'C', date: '01-03-2026', time: '12:00', serviceName: 'Z' },
    ];

    it('sends SMS reminders for reservations with phone', async () => {
      const result = await sendReminders(reservations);
      expect(mockCallSendReminderSms).toHaveBeenCalledTimes(1);
      const payload = mockCallSendReminderSms.mock.calls[0][0];
      expect(payload.reservations).toHaveLength(2);
      expect(result.smsSent).toBe(2);
    });

    it('sends email reminders for reservations with email', async () => {
      const result = await sendReminders(reservations);
      expect(mockCallSendReminderEmails).toHaveBeenCalledTimes(1);
      expect(result.emailSent).toBe(2);
    });

    it('handles SMS error gracefully', async () => {
      mockCallSendReminderSms.mockRejectedValueOnce(new Error('fail'));
      const result = await sendReminders(reservations);
      expect(result.smsSent).toBe(0);
      expect(result.emailSent).toBe(2);
    });

    it('returns zeros for empty list', async () => {
      const result = await sendReminders([]);
      expect(result.smsSent).toBe(0);
      expect(result.emailSent).toBe(0);
    });
  });
});

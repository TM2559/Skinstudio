import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCallSendBookingConfirmationEmail = vi.fn();
const mockCallSendAdminNotificationEmail = vi.fn();
const mockCallSendReminderEmail = vi.fn();

vi.mock('../firebaseConfig', () => ({
  callSendBookingConfirmationEmail: (...args) => mockCallSendBookingConfirmationEmail(...args),
  callSendAdminNotificationEmail: (...args) => mockCallSendAdminNotificationEmail(...args),
  callSendReminderEmail: (...args) => mockCallSendReminderEmail(...args),
}));

import {
  sendBookingConfirmationEmail,
  sendAdminNotificationEmail,
  sendReminderEmail,
} from './emailService';

describe('emailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sendBookingConfirmationEmail returns true on success', async () => {
    mockCallSendBookingConfirmationEmail.mockResolvedValue({ data: { sent: true } });
    const result = await sendBookingConfirmationEmail({
      name: 'Jan', email: 'jan@test.cz', date: '01.03.2026', time: '10:00', serviceName: 'Masáž',
    });
    expect(result).toBe(true);
    expect(mockCallSendBookingConfirmationEmail).toHaveBeenCalledWith({
      name: 'Jan', email: 'jan@test.cz', date: '01.03.2026', time: '10:00', serviceName: 'Masáž',
    });
  });

  it('sendBookingConfirmationEmail returns false on error', async () => {
    mockCallSendBookingConfirmationEmail.mockRejectedValue(new Error('Network error'));
    const result = await sendBookingConfirmationEmail({
      name: 'Jan', email: 'jan@test.cz', date: '01.03.2026', time: '10:00', serviceName: 'Masáž',
    });
    expect(result).toBe(false);
  });

  it('sendAdminNotificationEmail returns true on success', async () => {
    mockCallSendAdminNotificationEmail.mockResolvedValue({ data: { sent: true } });
    const result = await sendAdminNotificationEmail({
      name: 'Jan', email: 'jan@test.cz', phone: '123456', date: '01.03.2026', time: '10:00',
      serviceName: 'Masáž', calendarLink: 'https://cal.google.com/test',
    });
    expect(result).toBe(true);
  });

  it('sendAdminNotificationEmail returns false on error', async () => {
    mockCallSendAdminNotificationEmail.mockRejectedValue(new Error('fail'));
    const result = await sendAdminNotificationEmail({
      name: 'Jan', email: 'jan@test.cz', phone: '123', date: '01.03', time: '10:00', serviceName: 'X',
    });
    expect(result).toBe(false);
  });

  it('sendReminderEmail returns true on success', async () => {
    mockCallSendReminderEmail.mockResolvedValue({ data: { sent: true } });
    const result = await sendReminderEmail({
      name: 'Jan', email: 'jan@test.cz', date: '01.03.2026', time: '10:00', serviceName: 'Masáž',
    });
    expect(result).toBe(true);
  });

  it('sendReminderEmail returns false on error', async () => {
    mockCallSendReminderEmail.mockRejectedValue(new Error('fail'));
    const result = await sendReminderEmail({
      name: 'Jan', email: 'jan@test.cz', date: '01.03.2026', time: '10:00', serviceName: 'Masáž',
    });
    expect(result).toBe(false);
  });
});

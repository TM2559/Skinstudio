import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCallSendBookingEmails = vi.fn(() =>
  Promise.resolve({ data: { clientOk: true, adminOk: true } })
);
const mockCallSendReminderEmails = vi.fn(() =>
  Promise.resolve({ data: { sent: 2, errors: [] } })
);

vi.mock('../firebaseConfig', () => ({
  useResendEmails: () => true,
  EMAILJS_CONFIG: {},
  callSendBookingEmails: (...args) => mockCallSendBookingEmails(...args),
  callSendReminderEmails: (...args) => mockCallSendReminderEmails(...args),
}));

import { sendBookingConfirmationAndAdminEmails, sendReminderEmailsBatch } from './emailService';

describe('emailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCallSendBookingEmails.mockImplementation(() =>
      Promise.resolve({ data: { clientOk: true, adminOk: true } })
    );
    mockCallSendReminderEmails.mockImplementation(() =>
      Promise.resolve({ data: { sent: 2, errors: [] } })
    );
  });

  it('sends booking emails via callable', async () => {
    const result = await sendBookingConfirmationAndAdminEmails({
      name: 'Jan',
      email: 'jan@test.cz',
      phone: '123',
      date: '01.03.2026',
      time: '10:00',
      serviceName: 'Masáž',
      calendarLink: 'https://cal.google.com/test',
    });

    expect(result.clientOk).toBe(true);
    expect(result.adminOk).toBe(true);
    expect(mockCallSendBookingEmails).toHaveBeenCalledTimes(1);
    expect(mockCallSendBookingEmails.mock.calls[0][0]).toMatchObject({
      name: 'Jan',
      email: 'jan@test.cz',
      date: '01.03.2026',
      time: '10:00',
      serviceName: 'Masáž',
      calendarLink: 'https://cal.google.com/test',
    });
  });

  it('returns false when callable throws', async () => {
    mockCallSendBookingEmails.mockRejectedValueOnce(new Error('fail'));
    const result = await sendBookingConfirmationAndAdminEmails({
      name: 'Jan',
      email: 'jan@test.cz',
      phone: '',
      date: '01.03.2026',
      time: '10:00',
      serviceName: 'X',
      calendarLink: '',
    });
    expect(result.clientOk).toBe(false);
    expect(result.adminOk).toBe(false);
  });

  it('sends reminder batch via callable', async () => {
    mockCallSendReminderEmails.mockResolvedValueOnce({ data: { sent: 1, errors: [] } });
    const res = await sendReminderEmailsBatch([
      { name: 'A', email: 'a@test.cz', date: '01-03-2026', time: '10:00', serviceName: 'X' },
    ]);
    expect(res.sent).toBe(1);
    expect(mockCallSendReminderEmails).toHaveBeenCalledWith({
      reservations: [
        expect.objectContaining({
          name: 'A',
          email: 'a@test.cz',
          date: '01-03-2026',
          time: '10:00',
          serviceName: 'X',
        }),
      ],
    });
  });

  it('returns sent 0 for empty batch', async () => {
    const res = await sendReminderEmailsBatch([]);
    expect(res.sent).toBe(0);
    expect(mockCallSendReminderEmails).not.toHaveBeenCalled();
  });
});

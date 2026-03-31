import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../firebaseConfig', () => ({
  EMAILJS_CONFIG: {
    PUBLIC_KEY: 'test-key',
    SERVICE_ID: 'test-service',
    CONFIRM_TEMPLATE: 'tpl-confirm',
    ADMIN_TEMPLATE: 'tpl-admin',
    REMINDER_TEMPLATE: 'tpl-reminder',
  },
}));
vi.mock('../constants/config', () => ({
  CONTACT: {
    EMAIL_PUBLIC: 'info@test.cz',
    EMAIL_RESERVATIONS: 'rez@test.cz',
  },
}));

import {
  sendBookingConfirmationEmail,
  sendAdminNotificationEmail,
  sendReminderEmail,
} from './emailService';

describe('emailService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends booking confirmation email via fetch', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true }));

    const result = await sendBookingConfirmationEmail({
      name: 'Jan', email: 'jan@test.cz', date: '01.03.2026', time: '10:00', serviceName: 'Masáž',
    });

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.emailjs.com/api/v1.0/email/send');
    const body = JSON.parse(opts.body);
    expect(body.service_id).toBe('test-service');
    expect(body.template_id).toBe('tpl-confirm');
    expect(body.user_id).toBe('test-key');
    expect(body.template_params.greeting_line).toBe('Dobrý den,');
    expect(body.template_params.name).toBe('Jan');
    expect(body.template_params.to_email).toBe('jan@test.cz');
    expect(body.template_params.calendar_ics_link).toBe('');
    expect(body.template_params.reply_to).toBe('info@test.cz');
  });

  it('returns false when fetch fails', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
    const result = await sendBookingConfirmationEmail({
      name: 'Jan', email: 'jan@test.cz', date: '01.03.2026', time: '10:00', serviceName: 'Masáž',
    });
    expect(result).toBe(false);
  });

  it('returns false when response is not ok', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false }));
    const result = await sendBookingConfirmationEmail({
      name: 'Jan', email: 'jan@test.cz', date: '01.03.2026', time: '10:00', serviceName: 'Masáž',
    });
    expect(result).toBe(false);
  });

  it('sends admin notification email with correct template', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
    const result = await sendAdminNotificationEmail({
      name: 'Jan', email: 'jan@test.cz', phone: '123456', date: '01.03.2026', time: '10:00',
      serviceName: 'Masáž', calendarLink: 'https://cal.google.com/test',
    });
    expect(result).toBe(true);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.template_id).toBe('tpl-admin');
    expect(body.template_params.to_email).toBe('info@test.cz');
    expect(body.template_params.greeting_line).toBe('Dobrý den,');
    expect(body.template_params.calendar_link).toBe('https://cal.google.com/test');
    expect(body.template_params.calendar_ics_link).toBe('');
  });

  it('sends reminder email with correct template', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
    const result = await sendReminderEmail({
      name: 'Jan', email: 'jan@test.cz', date: '01.03.2026', time: '10:00', serviceName: 'Masáž',
    });
    expect(result).toBe(true);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.template_id).toBe('tpl-reminder');
    expect(body.template_params.greeting_line).toBe('Dobrý den,');
    expect(body.template_params.reply_to).toBe('rez@test.cz');
  });

  it('returns false when ADMIN_TEMPLATE is missing', async () => {
    const mod = await import('../firebaseConfig');
    const origTemplate = mod.EMAILJS_CONFIG.ADMIN_TEMPLATE;
    mod.EMAILJS_CONFIG.ADMIN_TEMPLATE = '';
    const result = await sendAdminNotificationEmail({
      name: 'Jan', email: 'jan@test.cz', phone: '123', date: '01.03', time: '10:00', serviceName: 'X',
    });
    expect(result).toBe(false);
    mod.EMAILJS_CONFIG.ADMIN_TEMPLATE = origTemplate;
  });
});

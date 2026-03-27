import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import AdminShiftsTab from './AdminShiftsTab';
import { Utils } from '../../utils/helpers';

function openTodayEditor(props = {}) {
  const todayKey = Utils.formatDateKey(new Date());
  const schedule = {
    [todayKey]: { periods: [{ start: '09:00', end: '12:00' }] },
  };
  const schedulePmu = {
    [todayKey]: { periods: [{ start: '12:00', end: '15:00' }] },
  };
  const onSaveDay = vi.fn(() => Promise.resolve());

  render(
    <AdminShiftsTab
      schedule={schedule}
      schedulePmu={schedulePmu}
      onSaveDay={onSaveDay}
      {...props}
    />
  );

  fireEvent.click(screen.getByText('KOSMETIKA + PMU'));
  return { onSaveDay, todayKey };
}

describe('AdminShiftsTab', () => {
  it('shows both service types in day list and allows opening editor', () => {
    openTodayEditor();
    expect(screen.getByText(/Kosmetika: 09:00 — 12:00/)).toBeInTheDocument();
    expect(screen.getByText(/PMU: 12:00 — 15:00/)).toBeInTheDocument();
    expect(screen.getByText(/Časové bloky - Kosmetika/)).toBeInTheDocument();
    expect(screen.getByText('PMU')).toBeInTheDocument();
  });

  it('saves both kosmetika and PMU periods for one day', async () => {
    const { onSaveDay, todayKey } = openTodayEditor();
    fireEvent.click(screen.getByText('PMU'));

    const pmuHeading = screen.getByText('Časové bloky - PMU');
    const pmuSection = pmuHeading.parentElement;
    expect(pmuSection).toBeTruthy();
    const pmuStartInput = within(pmuSection).getByDisplayValue('09:00');
    const pmuEndInput = within(pmuSection).getByDisplayValue('17:00');
    fireEvent.change(pmuStartInput, { target: { value: '15:00' } });
    fireEvent.change(pmuEndInput, { target: { value: '17:30' } });
    fireEvent.click(within(pmuSection).getByRole('button', { name: 'Přidat blok' }));

    fireEvent.click(screen.getByRole('button', { name: 'Uložit změny' }));

    expect(onSaveDay).toHaveBeenCalledTimes(1);
    expect(onSaveDay).toHaveBeenCalledWith(todayKey, {
      kosmetika: [{ start: '09:00', end: '12:00' }],
      pmu: [
        { start: '12:00', end: '15:00' },
        { start: '15:00', end: '17:30' },
      ],
    });
  });

  it('can mark day as closed and save empty periods for both services', () => {
    const { onSaveDay, todayKey } = openTodayEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Označit den jako zavřeno' }));
    fireEvent.click(screen.getByRole('button', { name: 'Uložit změny' }));

    expect(onSaveDay).toHaveBeenCalledWith(todayKey, {
      kosmetika: [],
      pmu: [],
    });
  });
});

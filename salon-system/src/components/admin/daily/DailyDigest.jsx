import React, { useMemo } from 'react';
import {
  calculateTimelineSegments,
  occupancyMinutesUnion,
  sumAvailableMinutes,
  totalShiftMinutes,
} from './calculateTimelineSegments';

function formatFreeMinutes(minutes) {
  if (minutes <= 0) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

const DailyDigest = ({ shift, reservations }) => {
  const segments = useMemo(
    () => calculateTimelineSegments(shift, reservations),
    [shift, reservations]
  );

  const totalMin = totalShiftMinutes(shift);
  const occupiedMin = occupancyMinutesUnion(shift, reservations);
  const freeMin = sumAvailableMinutes(segments);
  const pct = totalMin > 0 ? Math.min(100, Math.round((occupiedMin / totalMin) * 100)) : 0;

  const shiftLabel = shift.periods.map((p) => `${p.start}–${p.end}`).join(', ');

  const barFillClass = pct >= 90 ? 'bg-emerald-500' : 'bg-slate-900';

  return (
    <section
      role="region"
      aria-label="Denní přehled obsazenosti"
      className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5 mb-6"
    >
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Směna</div>
          <div className="text-lg font-semibold text-slate-900">{shiftLabel}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Obsazenost</div>
          <div className="text-lg font-semibold text-slate-900">{pct} %</div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Volný čas</div>
          <div className="text-lg font-semibold text-slate-900">{formatFreeMinutes(freeMin)}</div>
        </div>
      </div>
      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mt-3">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-in-out ${barFillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
};

export default DailyDigest;

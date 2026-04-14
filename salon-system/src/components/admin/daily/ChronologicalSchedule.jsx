import React, { useMemo } from 'react';
import { Utils } from '../../../utils/helpers';
import { calculateTimelineSegments } from './calculateTimelineSegments';
import ShiftBoundary from './ShiftBoundary';
import AvailableSlot from './AvailableSlot';
import ReservationTimelineCard from './ReservationTimelineCard';

const ChronologicalSchedule = ({
  shift,
  reservations,
  onSelectOrder,
  todayKey,
  onAvailableSlotClick,
}) => {
  const segments = useMemo(
    () => calculateTimelineSegments(shift, reservations),
    [shift, reservations]
  );

  const firstStart = shift.periods[0].start;
  const lastEnd = shift.periods[shift.periods.length - 1].end;

  const nextIsShortGap = (index) => {
    const next = segments[index + 1];
    if (!next || next.type !== 'available') return false;
    return next.endMin - next.startMin < 15;
  };

  return (
    <div className="chronological-schedule">
      <ShiftBoundary type="start" time={firstStart} />
      {segments.map((seg, index) => {
        if (seg.type === 'available') {
          const len = seg.endMin - seg.startMin;
          if (len < 15) return null;
          const startTime = Utils.minutesToTime(seg.startMin);
          const endTime = Utils.minutesToTime(seg.endMin);
          return (
            <AvailableSlot
              key={`avail-${seg.startMin}-${seg.endMin}`}
              duration={len}
              startTime={startTime}
              endTime={endTime}
              onClick={() =>
                onAvailableSlotClick?.({
                  startTime,
                  endTime,
                  duration: len,
                })
              }
            />
          );
        }

        const extraMb = nextIsShortGap(index);
        return (
          <ReservationTimelineCard
            key={seg.reservation.id || `${seg.reservation.time}-${index}`}
            data={seg.reservation}
            onSelectOrder={onSelectOrder}
            todayKey={todayKey}
            extraBottomMargin={extraMb}
            outsideShift={!!seg.outsideShift}
          />
        );
      })}
      <ShiftBoundary type="end" time={lastEnd} />
    </div>
  );
};

export default ChronologicalSchedule;

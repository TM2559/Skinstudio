import React from 'react';

const ShiftBoundary = ({ type, time }) => (
  <div className="flex items-center gap-3 py-2 opacity-60">
    <div className="h-px bg-slate-200 flex-1" />
    <span className="text-xs font-medium text-slate-400">
      {type === 'start' ? `Začátek směny ${time}` : `Konec směny ${time}`}
    </span>
    <div className="h-px bg-slate-200 flex-1" />
  </div>
);

export default ShiftBoundary;

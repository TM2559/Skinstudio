import React from 'react';

const AvailableSlot = ({ duration, startTime, endTime, onClick }) => {
  const label = `Vytvořit rezervaci od ${startTime} do ${endTime}`;
  return (
    <button
      type="button"
      className="bg-white border-2 border-dashed border-slate-200 rounded-lg my-2 flex items-center justify-center min-h-[3.5rem] cursor-pointer text-sm font-medium text-slate-500 hover:border-slate-300 hover:bg-slate-50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white w-full"
      aria-label={label}
      onClick={onClick}
    >
      {duration} min volné · {startTime}–{endTime}
    </button>
  );
};

export default AvailableSlot;

import React from 'react';

export default function TimeGrid({ slots, selectedTime, isDark, onSelect }) {
  return (
    <div>
      <h2 className={`text-[10px] font-bold uppercase tracking-widest mb-6 border-b pb-2 ${isDark ? 'text-stone-300 border-stone-800' : 'text-stone-500 border-stone-100'}`}>3. Čas</h2>
      <div className="grid grid-cols-3 gap-3">
        {slots.map(t => {
          const isTimeSelected = selectedTime === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onSelect(t)}
              className={`py-3 rounded-lg text-sm border transition-all ${
                isDark
                  ? isTimeSelected ? 'text-white border-[#daa59c]/60 bg-[#daa59c]/90' : 'bg-stone-900 border-stone-800 text-stone-200 hover:border-stone-700'
                  : isTimeSelected ? 'text-white border-[var(--skin-gold-dark)]' : 'bg-white border-stone-200 text-stone-700 hover:bg-[#F9F7F2] hover:border-stone-300'
              }`}
              style={!isDark && isTimeSelected ? { backgroundColor: 'var(--skin-gold-dark)' } : undefined}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

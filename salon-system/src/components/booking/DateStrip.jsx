import React from 'react';
import { Utils } from '../../utils/helpers';

export default function DateStrip({ dates, activeDateStr, slotsPerDate, selectedService, isDark, onSelect }) {
  return (
    <div>
      <h2 className={`text-[10px] font-bold uppercase tracking-widest mb-6 border-b pb-2 ${isDark ? 'text-stone-300 border-stone-800' : 'text-stone-500 border-stone-100'}`}>2. Termín</h2>
      <div className="mobile-carousel-strip date-strip-scroll flex gap-3 pb-4 min-w-0">
        {dates.length === 0 && <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>Momentálně nejsou vypsány žádné termíny.</p>}
        {dates.map(d => {
          const key = Utils.formatDateKey(d);
          const isActive = activeDateStr === key;
          const slotCount = slotsPerDate.get(key) ?? -1;
          const hasNoSlots = selectedService && slotCount === 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => { if (!hasNoSlots) onSelect(key); }}
              disabled={hasNoSlots}
              className={`mobile-carousel-strip-item flex flex-col items-center justify-center w-16 h-24 rounded-xl border transition-all shadow-sm ${
                hasNoSlots ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''
              } ${
                isDark
                  ? isActive ? 'bg-[#daa59c]/90 text-white border-[#daa59c]/60' : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700'
                  : isActive ? 'text-white border-[var(--skin-gold-dark)]' : 'bg-white text-stone-500 border-gray-100'
              }`}
              style={!isDark && isActive ? { backgroundColor: 'var(--skin-gold-dark)' } : undefined}
            >
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                {d.toLocaleDateString('cs-CZ', { weekday: 'short' })}
              </span>
              <span className="text-xl font-display leading-none my-1">
                {d.getDate()}
              </span>
              <span className="text-[9px] uppercase tracking-widest opacity-80">
                {d.toLocaleDateString('cs-CZ', { month: 'short' })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

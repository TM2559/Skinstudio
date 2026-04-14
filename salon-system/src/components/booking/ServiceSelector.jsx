import React from 'react';

function UpsellRow({ upsell, isActive, isDark, onToggle }) {
  const hasPrice = upsell.price != null && upsell.price !== '';
  return (
    <div
      className={`flex justify-between items-center rounded-lg py-1 -mx-1 px-1 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col justify-center min-w-0">
        <span className={`text-sm font-medium ${isDark ? (isActive ? 'text-white' : 'text-stone-300') : isActive ? 'text-stone-900' : 'text-stone-700'}`}>
          {upsell.name}
        </span>
        {hasPrice && (
          <span className={`text-[10px] font-light tracking-wide uppercase mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            zvýhodněná cena k ošetření
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`ml-4 rounded-full px-3 py-1 text-xs font-semibold transition-colors border flex-shrink-0 ${
          isDark
            ? isActive
              ? 'bg-[#daa59c]/90 text-white border-[#daa59c]/50'
              : 'bg-stone-800 text-stone-200 border-stone-700 hover:border-stone-600'
            : isActive
              ? 'bg-stone-800 text-white border-stone-800'
              : 'bg-white text-stone-800 border-stone-200 hover:border-stone-300'
        }`}
        aria-label={isActive ? 'Odebrat' : 'Přidat'}
      >
        {isActive ? '✓' : (hasPrice ? `+ ${upsell.price} Kč` : '+')}
      </button>
    </div>
  );
}

export default function ServiceSelector({ services, selectedService, selectedUpsells, isDark, onSelect, onUpsellToggle }) {
  return (
    <div>
      <h2 className={`text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2 border-b pb-2 ${isDark ? 'text-stone-300 border-stone-800' : 'text-stone-500 border-stone-100'}`}>
        <span
          className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-[8px] ${isDark ? 'bg-[#daa59c]' : ''}`}
          style={!isDark ? { backgroundColor: 'var(--skin-gold-dark)' } : undefined}
        >
          1
        </span>
        1. Výběr procedury
      </h2>
      <div className="grid gap-3">
        {services.map(s => {
          const isSelected = selectedService?.id === s.id;
          const addons = s.available_addons ?? [];
          return (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(s)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(s); } }}
              className={`p-4 rounded-xl border transition-all text-left relative shadow-sm cursor-pointer ${
                isDark
                  ? isSelected
                    ? 'bg-stone-900 border-[#daa59c]/70 border-l-4 border-l-[#daa59c]'
                    : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                  : isSelected
                    ? 'bg-[#F9F7F2] border border-stone-200 border-l-2'
                    : 'bg-white border-gray-100 hover:border-stone-200'
              }`}
              style={!isDark && isSelected ? { borderLeftColor: 'var(--skin-gold-dark)' } : undefined}
            >
              <div className="flex justify-between items-start gap-4 min-w-0">
                <span className={`text-sm leading-tight break-words min-w-0 ${isDark ? (isSelected ? 'font-bold text-white' : 'font-medium text-stone-200') : isSelected ? 'font-bold text-stone-900' : 'font-medium text-stone-800'}`}>{s.name}</span>
                {!(isSelected && s.isStartingPrice) && (
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg shrink-0 whitespace-nowrap ${isDark ? 'text-[#daa59c] bg-stone-800' : 'text-stone-700 bg-stone-100'}`}>
                    {s.isStartingPrice ? `od ${s.price} Kč` : `${s.price} Kč`}
                  </span>
                )}
              </div>
              {isSelected && addons.length > 0 && (
                <div className={`mt-4 pt-3 border-t space-y-2 ${isDark ? 'border-stone-800' : 'border-stone-100'}`}>
                  {addons.map((upsell) => (
                    <UpsellRow
                      key={upsell.id}
                      upsell={upsell}
                      isActive={selectedUpsells.some((u) => u.id === upsell.id)}
                      isDark={isDark}
                      onToggle={() => onUpsellToggle(upsell, !selectedUpsells.some((u) => u.id === upsell.id))}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

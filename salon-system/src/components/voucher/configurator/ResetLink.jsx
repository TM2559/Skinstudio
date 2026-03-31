import React from 'react';

/** Odkaz pro návrat k přehledu typů — odstupy řeší rodič (`gap-16`). */
export default function ResetLink({ visible, onReset }) {
  if (!visible) return null;
  return (
    <div>
      <button
        type="button"
        onClick={onReset}
        className="text-sm text-[#6b6560] border-b border-[#c5aa80]/40 border-opacity-60 pb-0.5 hover:text-[#2a2624] hover:border-[#c5aa80] transition-colors"
      >
        Zobrazit znovu všechny typy poukazů
      </button>
    </div>
  );
}

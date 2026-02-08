import React from 'react';
import { PHOTO_CATEGORIES, COSMETICS_CATEGORY, PMU_CATEGORY } from '../../constants/cosmetics';

/**
 * Segmented control for photo category: [ Kosmetika ] | [ PMU ].
 * Kosmetika = default/light. PMU = dark/gold to indicate destination.
 */
export default function CategoryToggle({ value, onChange, disabled }) {
  return (
    <div className="flex rounded-xl border border-stone-200 bg-stone-100 p-1 w-full max-w-md">
      {PHOTO_CATEGORIES.map((cat) => {
        const isCosmetics = cat.value === COSMETICS_CATEGORY;
        const isPmu = cat.value === PMU_CATEGORY;
        const isSelected = value === cat.value;
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => onChange(cat.value)}
            disabled={disabled}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              isSelected
                ? isPmu
                  ? 'bg-gradient-to-r from-[#B37E76] via-[#D49A91] to-[#B37E76] text-white shadow-md border border-[#D49A91]/20'
                  : 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-800'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

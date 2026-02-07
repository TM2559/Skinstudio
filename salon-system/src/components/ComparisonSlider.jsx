import React from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

/**
 * Before/After comparison slider for PMU (dark luxury theme).
 *
 * @typedef {Object} ComparisonProps
 * @property {string} beforeImage - URL of the "before" image
 * @property {string} afterImage - URL of the "after" image
 * @property {string} altText - Description for accessibility (e.g. "Před a po PMU obočí")
 */

/** @type {React.FC<ComparisonProps>} */
export default function ComparisonSlider({ beforeImage, afterImage, altText }) {
  const handle = (
    <div
      className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#B37E76] via-[#D49A91] to-[#B37E76] text-white border border-[#D49A91]/20 shadow-lg shadow-[#B37E76]/30 ring-2 ring-white/20"
      aria-hidden
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 5v14M16 5v14M5 8h14M5 16h14" />
      </svg>
    </div>
  );

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0F0F0F] aspect-[4/3] w-full">
      <ReactCompareSlider
        itemOne={
          <ReactCompareSliderImage
            src={beforeImage}
            alt={`${altText} – před`}
          />
        }
        itemTwo={
          <ReactCompareSliderImage
            src={afterImage}
            alt={`${altText} – po`}
          />
        }
        handle={handle}
        className="flex w-full flex-grow"
        style={{ minHeight: 280 }}
      />
    </div>
  );
}

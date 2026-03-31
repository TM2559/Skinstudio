import React from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import useIsMobile from '../hooks/useIsMobile';

/**
 * Before/After comparison slider.
 * theme: 'dark' = PMU (gold handle), 'light' = Cosmetics (white handle, soft shadow).
 * When image URLs are missing, renders nothing (no placeholder).
 *
 * @typedef {Object} ComparisonProps
 * @property {string} beforeImage - URL of the "before" image
 * @property {string} afterImage - URL of the "after" image
 * @property {string} altText - Description for accessibility (e.g. "Před a po PMU obočí")
 * @property {'dark'|'light'} [theme] - 'dark' (default) or 'light' for cosmetics/medical
 */

/** @type {React.FC<ComparisonProps>} */
export default function ComparisonSlider({ beforeImage, afterImage, altText = 'Srovnání', theme = 'dark' }) {
  const isMobile = useIsMobile();
  const hasImages = beforeImage && afterImage && beforeImage.trim() && afterImage.trim();

  if (!hasImages) return null;

  const isLight = theme === 'light';
  const handle = (
    <div
      className={`comparison-slider-handle flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-full touch-manipulation ${
        isLight
          ? 'bg-white/95 text-stone-500 border border-stone-200/80 shadow-sm'
          : 'bg-gradient-to-r from-[#B37E76] via-[#D49A91] to-[#B37E76] text-white border border-[#D49A91]/20 shadow-md ring-1 ring-white/20'
      }`}
      aria-hidden
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 17l-5-5 5-5" />
        <path d="M18 17l5-5-5-5" />
      </svg>
    </div>
  );

  const imageStyle = { objectFit: 'cover', objectPosition: 'center center' };

  return (
    <div
      className={`comparison-slider-contain rounded-xl overflow-hidden w-full flex flex-col items-stretch ${
        isLight ? 'border border-stone-200 bg-stone-50' : 'border border-white/10 bg-[#0F0F0F]'
      }`}
    >
      <div className="relative w-full aspect-[4/5] max-h-[65vh] md:max-h-[600px] min-h-[280px]">
        <ReactCompareSlider
          itemOne={
            <ReactCompareSliderImage
              src={beforeImage}
              alt={`${altText} – Před`}
              style={imageStyle}
            />
          }
          itemTwo={
            <ReactCompareSliderImage
              src={afterImage}
              alt={`${altText} – Po`}
              style={imageStyle}
            />
          }
          handle={handle}
          onlyHandleDraggable={isMobile}
          className="!absolute inset-0 w-full h-full"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}

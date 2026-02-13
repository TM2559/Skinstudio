import React from 'react';

/** Red outline heart icon for "srdci" replacement in footer taglines */
export function HeartIcon() {
  return (
    <span className="inline-flex items-center mx-1 relative top-[1px]" aria-hidden>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          stroke="#E57590"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * Renders tagline with the given word replaced by HeartIcon (e.g. "srdci").
 * @param {string} tagline - Full sentence containing the word to replace
 * @param {string} heartWord - Word to replace with heart icon (e.g. 'srdci')
 */
export function TaglineWithHeart({ tagline, heartWord }) {
  const parts = tagline.split(heartWord);
  if (parts.length !== 2) return <>{tagline}</>;
  return (
    <>
      {parts[0]}
      <HeartIcon />
      {parts[1]}
    </>
  );
}

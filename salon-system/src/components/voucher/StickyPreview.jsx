import React from 'react';

/**
 * Náhled poukazu — pouze od breakpointu lg (na mobilu se neskládá / nezabírá místo).
 */
export default function StickyPreview({ children, className = '' }) {
  return (
    <div
      className={`hidden lg:flex lg:flex-col lg:sticky lg:top-8 lg:h-full lg:min-h-0 lg:overflow-hidden lg:bg-[#FAFAFA] ${className}`.trim()}
    >
      {children}
    </div>
  );
}

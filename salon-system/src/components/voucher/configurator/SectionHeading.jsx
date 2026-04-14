import React from 'react';

export default function SectionHeading({ children, id, className = '' }) {
  return (
    <h2
      id={id}
      className={`text-[11px] uppercase tracking-[0.05em] text-[#71717A] mb-6 ${className}`.trim()}
    >
      {children}
    </h2>
  );
}

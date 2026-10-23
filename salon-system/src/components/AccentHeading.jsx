import React from 'react';

/**
 * Nadpis sekce s jedním slovem rukopisem (identita Skin Studio): „Proč *ke mně*“ → „ke mně“ písmem Sacramento.
 * Text bez hvězdiček se vykreslí beze změny.
 */
export default function AccentHeading({ text, className = '', as: Tag = 'h2' }) {
  const parts = String(text || '').split(/\*([^*]+)\*/);
  return (
    <Tag className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="font-signature font-normal text-[1.35em] leading-none text-[#B08D55] align-[-0.08em] px-1">
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </Tag>
  );
}

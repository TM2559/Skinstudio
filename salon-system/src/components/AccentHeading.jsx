import React from 'react';

/**
 * Nadpis sekce se zvýrazněným slovem (identita Skin Studio): „Proč *ke mně*“ → „ke mně“ zlatou kurzívou.
 * Text bez hvězdiček se vykreslí beze změny.
 */
export default function AccentHeading({ text, className = '', as: Tag = 'h2' }) {
  const parts = String(text || '').split(/\*([^*]+)\*/);
  return (
    <Tag className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <em key={i} className="font-display italic font-medium text-[#B08D55]">
            {part}
          </em>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </Tag>
  );
}

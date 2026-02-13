import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Renders service description as Markdown (bold, lists, etc.).
 * Cleans parenthetical meta-commentary before rendering.
 */
function cleanDescription(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const markdownComponents = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-stone-800">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
};

export default function ServiceDescriptionMarkdown({ text, className = '' }) {
  const cleaned = cleanDescription(text);
  if (!cleaned) return null;
  return (
    <div className={`text-gray-600 leading-relaxed max-w-[65ch] ${className}`}>
      <ReactMarkdown components={markdownComponents}>{cleaned}</ReactMarkdown>
    </div>
  );
}

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

/**
 * Renders service description as Markdown (bold, lists, etc.).
 * Cleans parenthetical meta-commentary before rendering.
 */
function cleanDescription(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

const markdownComponents = {
  p: ({ node, children, ...props }) => <p className="mb-3 last:mb-0" {...props}>{children}</p>,
  strong: ({ node, children, ...props }) => (
    <span className="font-semibold text-[var(--skin-gold)]" {...props}>{children}</span>
  ),
  ul: ({ node, children, ...props }) => (
    <ul className="list-disc pl-5 space-y-2 my-3" {...props}>{children}</ul>
  ),
  ol: ({ node, children, ...props }) => (
    <ol className="list-decimal pl-5 space-y-2 my-3" {...props}>{children}</ol>
  ),
  li: ({ node, children, ...props }) => <li className="pl-1" {...props}>{children}</li>,
};

export default function ServiceDescriptionMarkdown({ text, className = '' }) {
  const cleaned = cleanDescription(text);
  if (!cleaned) return null;
  return (
    <div className={`text-sm text-stone-500 leading-relaxed max-w-[65ch] ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]} components={markdownComponents}>{cleaned}</ReactMarkdown>
    </div>
  );
}

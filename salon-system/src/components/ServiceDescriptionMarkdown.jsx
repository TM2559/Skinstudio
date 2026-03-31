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

const ROSE_ACCENT = '#daa59c';

function getMarkdownComponents(theme) {
  const isDark = theme === 'dark';
  const accentClass = isDark ? 'font-semibold' : 'font-semibold text-[var(--skin-gold)]';
  const accentStyle = isDark ? { color: ROSE_ACCENT } : undefined;
  return {
    p: ({ children, ...props }) => <p className="mb-3 last:mb-0" {...props}>{children}</p>,
    strong: ({ children, ...props }) => (
      <span className={accentClass} style={accentStyle} {...props}>{children}</span>
    ),
    ul: ({ children, ...props }) => (
      <ul className="list-disc pl-5 space-y-2 my-3" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal pl-5 space-y-2 my-3" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }) => <li className="pl-1" {...props}>{children}</li>,
  };
}

export default function ServiceDescriptionMarkdown({ text, className = '', theme = 'light' }) {
  const cleaned = cleanDescription(text);
  if (!cleaned) return null;
  const components = getMarkdownComponents(theme);
  const wrapperClass =
    theme === 'dark'
      ? `text-sm text-[#A1A1AA] leading-relaxed max-w-[65ch] ${className}`
      : `text-sm text-stone-500 leading-relaxed max-w-[65ch] ${className}`;
  return (
    <div className={wrapperClass}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]} components={components}>{cleaned}</ReactMarkdown>
    </div>
  );
}

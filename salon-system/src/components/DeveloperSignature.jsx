import React from 'react';

/**
 * Minimalist developer credit "0x9ff" – brand identifier is also its HEX color (#99ffff).
 * For use in footer (inline). Idle low-contrast, hover = #99ffff + glow.
 * @param {'light'|'dark'} theme - light: black/20 on light bg, dark: white/20 on dark footer
 */
export default function DeveloperSignature({ theme = 'dark' }) {
  const idleClass = theme === 'dark' ? 'text-white/20' : 'text-black/20';
  return (
    <a
      href="https://0x9ff.dev"
      target="_blank"
      rel="noopener noreferrer"
      className={`signature-0x9ff inline-block font-mono text-[10px] sm:text-[11px] tracking-[0.3em] uppercase ${idleClass} transition-all duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:opacity-100 hover:text-[#99ffff]`}
    >
      [0x9ff]
    </a>
  );
}

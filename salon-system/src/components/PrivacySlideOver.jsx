import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { WEB_CONTENT } from '../constants/content';
import PrivacyContent from './PrivacyContent';

/**
 * Slide-over panel showing full privacy policy. Used from booking form "Zásad soukromí" button.
 */
export default function PrivacySlideOver({ open, onClose, isDark = false }) {
  const { footer, privacy } = WEB_CONTENT;

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const overlayClass = 'fixed inset-0 z-40 bg-black/40 transition-opacity';
  const panelClass = isDark
    ? 'fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-stone-900 border-l border-stone-800 shadow-xl flex flex-col'
    : 'fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-white border-l border-stone-200 shadow-xl flex flex-col';

  return (
    <>
      <div className={overlayClass} aria-hidden onClick={onClose} />
      <div
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-slideover-title"
      >
        <div className={`flex items-center justify-between shrink-0 px-6 py-4 border-b ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
          <h2 id="privacy-slideover-title" className={`font-display text-lg font-semibold ${isDark ? 'text-stone-100' : 'text-stone-800'}`}>
            {privacy.pageTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-stone-400 hover:bg-stone-800 hover:text-stone-200' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'}`}
            aria-label="Zavřít"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 pt-2 pb-8">
          <PrivacyContent footer={footer} privacy={privacy} isDark={isDark} />
        </div>
        <div className={`shrink-0 px-6 py-4 border-t ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
          <Link
            to="/zpracovani-osobnich-udaju"
            onClick={onClose}
            className={`text-sm font-medium ${isDark ? 'text-[#daa59c] hover:underline' : 'text-[var(--skin-gold-dark)] hover:underline'}`}
          >
            Celé zásady na samostatné stránce →
          </Link>
        </div>
      </div>
    </>
  );
}

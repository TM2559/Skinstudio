import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Accessible confirmation dialog replacing native confirm()/alert().
 * Traps focus, supports Escape to close, returns result via onConfirm/onCancel.
 *
 * @param {boolean} open
 * @param {string} title
 * @param {string} message
 * @param {() => void} onConfirm
 * @param {() => void} onCancel
 * @param {string} [confirmLabel='Potvrdit']
 * @param {string} [cancelLabel='Zrušit']
 * @param {boolean} [alertOnly=false] - If true, show only a single "OK" button (replaces alert())
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Potvrdit',
  cancelLabel = 'Zrušit',
  alertOnly = false,
}) {
  const dialogRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (open) confirmBtnRef.current?.focus();
  }, [open]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel?.();
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onCancel]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-dialog-title" className="font-display text-lg font-bold text-stone-900 mb-2">
          {title}
        </h3>
        <p id="confirm-dialog-message" className="text-sm text-stone-500 mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className="flex-1 bg-stone-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors"
          >
            {alertOnly ? 'OK' : confirmLabel}
          </button>
          {!alertOnly && (
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-stone-200 rounded-xl text-xs font-bold uppercase tracking-widest text-stone-400 hover:bg-stone-50 transition-colors"
            >
              {cancelLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

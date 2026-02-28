import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ICON_MAP = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const STYLE_MAP = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-stone-50 border-stone-200 text-stone-800',
};

export default function ToastContainer({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = ICON_MAP[toast.type] || Info;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-300 ${STYLE_MAP[toast.type] || STYLE_MAP.info}`}
          >
            <Icon size={18} className="shrink-0 mt-0.5" />
            <p className="text-sm flex-1">{toast.message}</p>
            <button
              onClick={() => onDismiss?.(toast.id)}
              className="shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

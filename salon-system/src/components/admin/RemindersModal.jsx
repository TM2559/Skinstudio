import React from 'react';
import { Send, Loader2 } from 'lucide-react';

const RemindersModal = ({ open, onClose, remindersList, onSend, isSending }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95">
        <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2 text-stone-900">
          <Send size={20} /> Připomínky
        </h3>
        {remindersList.length > 0 ? (
          <>
            <p className="text-stone-500 text-sm mb-6">Odeslat {remindersList.length} připomínek (SMS a e-mail podle kontaktu)?</p>
            <div className="flex gap-3">
              <button
                onClick={onSend}
                disabled={isSending}
                className="flex-1 bg-stone-800 text-white py-3 rounded-xl font-bold text-xs uppercase disabled:opacity-50"
              >
                {isSending ? <Loader2 className="animate-spin mx-auto" size={14} /> : 'Odeslat'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 border border-stone-200 rounded-xl text-xs font-bold uppercase text-stone-400"
              >
                Zrušit
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-stone-500 text-sm mb-4">Žádné připomínky k odeslání.</p>
            <button onClick={onClose} className="w-full py-3 bg-stone-100 rounded-xl font-bold">
              Zavřít
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemindersModal;

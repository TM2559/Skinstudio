import React from 'react';
import { motion } from 'framer-motion';
import { Banknote } from 'lucide-react';

export default function SummaryAndCTA({
  show,
  totalPrice,
  formatPrice,
  submitError,
  canSubmit,
  isSubmitting,
  onSubmit,
}) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E5E5] py-5 px-6 lg:absolute lg:left-0 lg:right-auto lg:w-full lg:shadow-none pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] lg:px-10"
    >
      {submitError && (
        <p className="text-xs text-red-600 mb-3" role="alert">
          {submitError}
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4 w-full max-w-full">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-baseline justify-between gap-6">
            <span className="text-[#737373] text-sm shrink-0">Celkem k úhradě</span>
            <span className="font-semibold text-xl text-[#171717] shrink-0 tabular-nums tracking-tight" aria-live="polite" aria-atomic="true">
              {formatPrice(totalPrice)}
            </span>
          </div>
          <p className="text-xs text-[#737373] flex items-center gap-2">
            <Banknote size={14} className="shrink-0" aria-hidden />
            Platba proběhne v hotovosti při osobním převzetí.
          </p>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full sm:w-auto shrink-0 bg-[#171717] text-white font-medium px-10 py-3 rounded-none hover:bg-black transition-colors disabled:bg-[#E5E5E5] disabled:text-[#A3A3A3] disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Odesílám…' : 'Závazně objednat'}
        </button>
      </div>
    </motion.div>
  );
}
